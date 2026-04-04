# src/predict.py
import os
from pathlib import Path
import torch
import torch.nn as nn
from torchvision import transforms
from PIL import Image
import numpy as np


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
# Helpers and settings
# ==============================
def get_paths():
    # project root is parent of src
    base_dir = Path(__file__).resolve().parent.parent
    model_path = base_dir / "trained_model.pth"
    test_dir = base_dir / "data" / "test"
    pred_dir = base_dir / "data" / "predictions"
    return base_dir, model_path, test_dir, pred_dir


def load_model(model, model_path, device):
    # Use weights_only=False when available (PyTorch 2.6+) for safety
    loaded = None
    try:
        loaded = torch.load(str(model_path), map_location=device, weights_only=False)
    except TypeError:
        # Older torch versions may not accept weights_only argument
        loaded = torch.load(str(model_path), map_location=device)

    # Handle different checkpoint formats
    if isinstance(loaded, dict):
        # common patterns: {'state_dict': {...}} or direct state_dict
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
        # if the file contains an entire model object
        model = loaded

    return model


def preprocess_image(image_path, transform):
    img = Image.open(image_path).convert('RGB')
    return transform(img), img


def save_mask(mask_tensor, palette, out_path):
    # mask_tensor: 2D numpy array or torch tensor with class indices
    if isinstance(mask_tensor, torch.Tensor):
        mask_np = mask_tensor.cpu().numpy().astype(np.uint8)
    else:
        mask_np = np.array(mask_tensor).astype(np.uint8)

    # Save as single-channel (L) image
    mask_img = Image.fromarray(mask_np, mode='L')
    # Optionally apply palette (not implemented here) - keep grayscale indices
    mask_img.save(out_path)


def main():
    base_dir, model_path, test_dir, pred_dir = get_paths()

    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    num_classes = 19

    # prepare output dir
    pred_dir.mkdir(parents=True, exist_ok=True)

    # build model and load weights
    model = UNet(in_channels=3, out_classes=num_classes)
    model = load_model(model, model_path, device)
    model.to(device)
    model.eval()

    # preprocessing: match training (RGB, resized, ToTensor -> [0,1])
    transform = transforms.Compose([
        transforms.Resize((128, 256)),  # same as training
        transforms.ToTensor(),
    ])

    # collect image files
    exts = ('*.jpg', '*.jpeg', '*.png')
    files = []
    for e in exts:
        files.extend(sorted(test_dir.glob(e)))

    if not files:
        print(f"No test images found in {test_dir}. Supported: jpg, png")
        return

    with torch.no_grad():
        for img_path in files:
            input_tensor, orig_img = preprocess_image(img_path, transform)
            input_tensor = input_tensor.unsqueeze(0).to(device)

            output = model(input_tensor)  # [1, num_classes, H, W]
            predicted = torch.argmax(output, dim=1).squeeze(0).cpu()  # [H, W]

            out_name = img_path.stem + '_mask.png'
            out_path = pred_dir / out_name
            save_mask(predicted, None, out_path)

    print(f"Predictions saved to {pred_dir}")


if __name__ == '__main__':
    main()