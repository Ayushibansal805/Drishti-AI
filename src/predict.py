# src/predict.py
"""
Drishti Backend: AI-powered scene understanding for blind accessibility.
Loads UNet segmentation model, processes images, and provides voice descriptions.
"""
import os
from pathlib import Path
import torch
import torch.nn as nn
from torchvision import transforms
from PIL import Image
import numpy as np
import pyttsx3


# ==============================
# UNet class (same as Colab training)
# ==============================
class UNet(nn.Module):
    def __init__(self, in_channels=3, out_classes=19):
        super(UNet, self).__init__()

        def CBR(in_ch, out_ch):
            return nn.Sequential(
                nn.Conv2d(in_ch, out_ch, 3, padding=1),
                nn.BatchNorm2d(out_ch),
                nn.ReLU(inplace=True)
            )

        self.enc1 = CBR(in_channels, 64)
        self.enc2 = CBR(64, 128)
        self.enc3 = CBR(128, 256)
        self.pool = nn.MaxPool2d(2, 2)

        self.up2 = nn.ConvTranspose2d(256, 128, 2, stride=2)
        self.dec2 = CBR(256, 128)
        self.up1 = nn.ConvTranspose2d(128, 64, 2, stride=2)
        self.dec1 = CBR(128, 64)

        self.final = nn.Conv2d(64, out_classes, 1)

    def forward(self, x):
        e1 = self.enc1(x)
        e2 = self.enc2(self.pool(e1))
        e3 = self.enc3(self.pool(e2))

        d2 = self.up2(e3)
        d2 = self.dec2(torch.cat([d2, e2], dim=1))
        d1 = self.up1(d2)
        d1 = self.dec1(torch.cat([d1, e1], dim=1))

        out = self.final(d1)
        return out


# ==============================
# Class mappings: 19 semantic classes
# ==============================
CLASS_NAMES = {
    0: "road",
    1: "sidewalk",
    2: "building",
    3: "wall",
    4: "fence",
    5: "pole",
    6: "traffic light",
    7: "traffic sign",
    8: "vegetation",
    9: "terrain",
    10: "sky",
    11: "person",
    12: "rider",
    13: "car",
    14: "truck",
    15: "bus",
    16: "train",
    17: "motorcycle",
    18: "bicycle"
}

# Accessibility priority: which objects are important for blind users
PRIORITY_OBJECTS = {
    "obstacle": [2, 3, 4, 5, 6, 7],  # building, wall, fence, pole, traffic light, sign
    "person": [11, 12],              # person, rider
    "vehicle": [13, 14, 15, 16, 17, 18],  # car, truck, bus, train, motorcycle, bicycle
    "walkable": [0, 1, 9],           # road, sidewalk, terrain
    "sky": [10],                     # sky
    "vegetation": [8]               # vegetation
}


# ==============================
# TTS and voice output
# ==============================
class VoiceEngine:
    def __init__(self, audio_enabled=False):
        """
        Initialize voice engine for text-to-speech output.
        
        Args:
            audio_enabled (bool): If True, actually play audio. If False, only print to console.
        """
        self.audio_enabled = audio_enabled
        self.engine = None
        
        if self.audio_enabled:
            try:
                self.engine = pyttsx3.init()
                self.engine.setProperty('rate', 150)  # slower for clarity
                self.engine.setProperty('volume', 0.9)
                print("[TTS] Voice engine initialized (audio enabled).")
            except Exception as e:
                print(f"[TTS] Warning: Could not initialize TTS: {e}")
                self.audio_enabled = False
        else:
            print("[TTS] Voice engine initialized (console-only mode).")

    def speak(self, text):
        """Speak text and print to console."""
        print(f"[Voice] {text}")
        if not self.audio_enabled or self.engine is None:
            return
        try:
            self.engine.say(text)
            self.engine.runAndWait()
        except Exception as e:
            print(f"[Warning] TTS error: {e}")

    def describe_scene(self, mask, img_shape):
        """Convert segmentation mask into voice description."""
        # Convert mask to numpy for slicing
        if isinstance(mask, torch.Tensor):
            mask_np = mask.cpu().numpy()
        else:
            mask_np = np.array(mask)
        
        h, w = mask_np.shape
        top_third = mask_np[:h//3]
        mid_third = mask_np[h//3:2*h//3]
        bottom_third = mask_np[2*h//3:]

        # Analyze each region
        top_desc = analyze_region(top_third)
        middle_desc = analyze_region(mid_third)
        bottom_desc = analyze_region(bottom_third)

        # Format with human touch for blind users
        full_description = format_description_for_blind_user(top_desc, middle_desc, bottom_desc)

        self.speak(full_description)
        return full_description


def analyze_region(region_mask):
    """Analyze a region and return description of detected objects."""
    # Convert to numpy if torch tensor
    if isinstance(region_mask, torch.Tensor):
        region_np = region_mask.cpu().numpy()
    else:
        region_np = np.array(region_mask)
    
    unique_classes = np.unique(region_np)
    
    detected = []
    for cls_id in unique_classes:
        if cls_id in CLASS_NAMES:
            cls_name = CLASS_NAMES[int(cls_id)]
            pixel_count = np.sum(region_np == cls_id)
            proportion = pixel_count / region_np.size
            
            # Only report if >5% of region
            if proportion > 0.05:
                # Categorize by priority
                for category, ids in PRIORITY_OBJECTS.items():
                    if cls_id in ids:
                        detected.append(cls_name)
                        break

    if detected:
        return ", ".join(set(detected))
    return None


def format_description_for_blind_user(top_desc, middle_desc, bottom_desc):
    """Format description with human touch for blind accessibility."""
    parts = []
    
    if top_desc:
        parts.append(f"Ahead of you above: {top_desc}")
    if middle_desc:
        parts.append(f"At your level: {middle_desc}")
    if bottom_desc:
        parts.append(f"Below you: {bottom_desc}")
    
    if not parts:
        return "The path ahead appears clear. You can move forward safely."
    
    return ". ".join(parts) + "."


# ==============================
# Helpers and paths
# ==============================
def get_paths():
    # project root is parent of src
    base_dir = Path(__file__).resolve().parent.parent
    model_path = base_dir / "models" / "best_model.pth"
    test_dir = base_dir / "data" / "test"
    pred_dir = base_dir / "data" / "predictions"
    return base_dir, model_path, test_dir, pred_dir


def load_model(model, model_path, device):
    """Load model weights safely with PyTorch 2.6+ weights_only=False."""
    print(f"[Model] Loading from {model_path}...")
    loaded = None
    try:
        loaded = torch.load(str(model_path), map_location=device, weights_only=False)
    except TypeError:
        # Older torch versions may not accept weights_only argument
        loaded = torch.load(str(model_path), map_location=device)

    # Handle different checkpoint formats
    if isinstance(loaded, dict):
        if 'state_dict' in loaded:
            state = loaded['state_dict']
        else:
            state = loaded
        try:
            model.load_state_dict(state)
        except Exception:
            # try stripping possible module prefixes (e.g., 'module.')
            new_state = {k.replace('module.', ''): v for k, v in state.items()}
            model.load_state_dict(new_state)
    else:
        model = loaded

    print("[Model] Model loaded successfully!")
    return model


def preprocess_image(image_path, transform):
    """Load and preprocess image (RGB, normalized to [0,1])."""
    img = Image.open(image_path).convert('RGB')
    tensor = transform(img)
    return tensor, img


def save_mask(mask_tensor, out_path):
    """Save segmentation mask as grayscale image for debugging."""
    if isinstance(mask_tensor, torch.Tensor):
        mask_np = mask_tensor.cpu().numpy().astype(np.uint8)
    else:
        mask_np = np.array(mask_tensor).astype(np.uint8)

    mask_img = Image.fromarray(mask_np, mode='L')
    mask_img.save(out_path)


def run_live_detection(model, device, transform, voice):
    """
    Run live detection from camera feed.
    Press 'q' to quit.
    """
    try:
        import cv2
    except ImportError:
        print("[Error] OpenCV not installed. Install with: pip install opencv-python")
        return
    
    print("\n[Live] Initializing camera...")
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("[Error] Could not open camera. Make sure a camera is connected.")
        voice.speak("Could not access camera. Please check if a camera is connected.")
        return
    
    print("[Live] Camera started. Press 'q' to quit.")
    voice.speak("Live detection started. I will describe what I see around you.")
    
    frame_count = 0
    
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                print("[Error] Failed to read frame from camera")
                break
            
            frame_count += 1
            
            # Process every 5th frame for speed
            if frame_count % 5 == 0:
                # Convert frame to RGB and prepare for model
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                pil_frame = Image.fromarray(rgb_frame)
                
                # Preprocess
                input_tensor = transform(pil_frame).unsqueeze(0).to(device)
                
                # Inference
                with torch.no_grad():
                    output = model(input_tensor)
                    predicted = torch.argmax(output, dim=1).squeeze(0).cpu()
                
                # Generate description
                h, w = predicted.shape
                top_third = predicted[:h//3]
                mid_third = predicted[h//3:2*h//3]
                bottom_third = predicted[2*h//3:]
                
                top_desc = analyze_region(top_third.numpy())
                middle_desc = analyze_region(mid_third.numpy())
                bottom_desc = analyze_region(bottom_third.numpy())
                
                description = format_description_for_blind_user(top_desc, middle_desc, bottom_desc)
                
                # Print and speak (every 5 frames)
                print(f"[Live] Frame {frame_count}: {description}")
                voice.speak(description)
            
            # Display on screen (optional, for sighted operators)
            cv2.putText(frame, "Press 'q' to quit", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            cv2.imshow("Drishti Live Detection", frame)
            
            # Press 'q' to quit
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
    
    except KeyboardInterrupt:
        print("\n[Live] Stopped by user")
    
    finally:
        cap.release()
        cv2.destroyAllWindows()
        voice.speak("Live detection ended.")
        print("[Live] Camera released.")


def main():
    """Main backend pipeline: load model, process images or run live detection."""
    base_dir, model_path, test_dir, pred_dir = get_paths()

    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    num_classes = 19

    print(f"[System] Device: {device}")
    print(f"[System] Using {device} for inference.")

    # prepare output dir
    pred_dir.mkdir(parents=True, exist_ok=True)
    print(f"[System] Output directory: {pred_dir}")

    # build model and load weights
    model = UNet(in_channels=3, out_classes=num_classes)
    model = load_model(model, model_path, device)
    model.to(device)
    model.eval()

    # Initialize TTS engine with audio playback enabled for accessibility
    # This is important for blind users who need voice feedback
    voice = VoiceEngine(audio_enabled=True)

    # preprocessing: match training (RGB, resized, ToTensor -> [0,1])
    transform = transforms.Compose([
        transforms.Resize((128, 256)),  # same as training
        transforms.ToTensor(),
    ])

    # Ask user for mode
    print("\n[Mode Selection]")
    print("1. Batch processing (process all images in data/test/)")
    print("2. Live detection (real-time camera feed)")
    
    import sys
    if len(sys.argv) > 1:
        mode = sys.argv[1]
    else:
        mode = input("Choose mode (1 or 2): ").strip()
    
    if mode == "2" or mode.lower().startswith("live"):
        # Live camera mode
        voice.speak("Starting live detection mode. I will describe what I see in real time.")
        run_live_detection(model, device, transform, voice)
    else:
        # Batch processing mode (default)
        batch_process_images(model, device, transform, voice, test_dir, pred_dir)


def batch_process_images(model, device, transform, voice, test_dir, pred_dir):
    """Process all images in batch from test_dir."""
    # collect image files
    exts = ('*.jpg', '*.jpeg', '*.png', '*.JPG', '*.PNG')
    files = []
    for e in exts:
        files.extend(sorted(test_dir.glob(e)))

    if not files:
        msg = f"No test images found in {test_dir}. Supported: jpg, png"
        print(f"[Warning] {msg}")
        voice.speak(msg)
        return

    voice.speak(f"Found {len(files)} images. Starting batch processing.")
    print(f"[Processing] Found {len(files)} image(s). Starting inference...")

    with torch.no_grad():
        for idx, img_path in enumerate(files, 1):
            print(f"\n[Processing] Image {idx}/{len(files)}: {img_path.name}")
            
            try:
                input_tensor, orig_img = preprocess_image(img_path, transform)
                input_tensor = input_tensor.unsqueeze(0).to(device)

                output = model(input_tensor)  # [1, num_classes, H, W]
                predicted = torch.argmax(output, dim=1).squeeze(0).cpu()  # [H, W]

                # Save mask for debugging
                out_name = img_path.stem + '_mask.png'
                out_path = pred_dir / out_name
                save_mask(predicted, out_path)
                print(f"[Output] Mask saved: {out_path.name}")

                # Generate voice description
                print("[Voice] Analyzing scene...")
                description = voice.describe_scene(predicted, orig_img.size)
                print(f"[Output] Scene description: {description}")

            except Exception as e:
                err_msg = f"Error processing {img_path.name}: {str(e)}"
                print(f"[Error] {err_msg}")
                voice.speak(err_msg)

    final_msg = f"Processing complete. Predictions saved to {pred_dir}"
    print(f"\n[Complete] {final_msg}")
    voice.speak("Processing complete.")


if __name__ == '__main__':
    main()