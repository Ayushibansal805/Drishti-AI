"""
Drishti Flask Backend Server
Integrates ML model (UNet) with React frontend
Provides REST API for predictions and model inference
"""

import os
import json
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from pathlib import Path
import torch
import torch.nn as nn
from torchvision import transforms
from PIL import Image
import numpy as np
import base64
from io import BytesIO
import logging
import requests
from dotenv import load_dotenv
from ultralytics import YOLO

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__, 
            static_folder='client/dist',
            static_url_path='')
CORS(app)

# ==============================
# YOLOv8 Model (Pre-trained Object Detection)
# ==============================
# Use YOLOv8n (nano) for fast inference or YOLOv8s (small) for better accuracy


# ==============================
# Model Loading & Initialization
# ==============================
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
logger.info(f"Using device: {device}")

# Load YOLOv8 pre-trained model
model = None
try:
    logger.info("Loading YOLOv8 pre-trained model...")
    # YOLOv8n = nano (fastest, ~3M params)
    # YOLOv8s = small (good balance, ~11M params) 
    model = YOLO('yolov8s.pt')  # Auto-downloads if not present
    model.to(device)
    logger.info("✓ YOLOv8s model loaded successfully!")
except Exception as e:
    logger.error(f"Failed to load YOLOv8 model: {str(e)}", exc_info=True)
    model = None


# ==============================
# Image Preprocessing
# ==============================
def prepare_image(image_data):
    """Convert base64 image to PIL Image for YOLO"""
    try:
        # Decode base64
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        image_bytes = base64.b64decode(image_data)
        image = Image.open(BytesIO(image_bytes)).convert('RGB')
        
        logger.info(f"Image loaded, size: {image.size}")
        return image
    except Exception as e:
        logger.error(f"Error preparing image: {str(e)}", exc_info=True)
        return None


# ==============================
# Image Description Functions
# ==============================
def image_to_base64(image: Image.Image) -> str:
    """Convert PIL Image to base64 string"""
    buffered = BytesIO()
    image.save(buffered, format="JPEG")
    return base64.b64encode(buffered.getvalue()).decode()


def describe_with_ollama(image_data: str) -> dict:
    """
    Describe image using Ollama (local vision model)
    Requires: ollama pull llava or ollama pull neural-chat
    """
    try:
        # Check if Ollama is running
        response = requests.get("http://localhost:11434/api/tags", timeout=2)
        if response.status_code != 200:
            return {"success": False, "error": "Ollama not running"}
        
        # Convert base64 image to proper format if needed
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        # Use Ollama vision endpoint
        ollama_payload = {
            "model": "llava",  # or "neural-chat" for text-only
            "messages": [
                {
                    "role": "user",
                    "content": "Provide a detailed description of this image including all visible objects, people, actions, environment, colors, and spatial relationships.",
                    "images": [image_data]
                }
            ],
            "stream": False
        }
        
        response = requests.post(
            "http://localhost:11434/api/chat",
            json=ollama_payload,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            description = result.get("message", {}).get("content", "")
            return {
                "success": True,
                "description": description,
                "model": "ollama-llava"
            }
        else:
            return {
                "success": False,
                "error": f"Ollama returned status {response.status_code}"
            }
            
    except requests.exceptions.ConnectionError:
        return {"success": False, "error": "Ollama not accessible on localhost:11434"}
    except Exception as e:
        logger.error(f"Ollama error: {str(e)}")
        return {"success": False, "error": str(e)}


def describe_with_openai(image_data: str) -> dict:
    """
    Describe image using OpenAI Vision API
    Requires OPENAI_API_KEY environment variable
    """
    try:
        api_key = os.getenv("OPENAI_API_KEY")
        
        if not api_key or not api_key.strip():
            logger.error("OPENAI_API_KEY not set or empty")
            return {"success": False, "error": "API key not configured"}
        
        logger.info(f"OpenAI API Key present: {api_key[:20]}...")
        
        # Ensure image data is proper base64
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        logger.info(f"Image data size: {len(image_data)} bytes")
        logger.info("Preparing OpenAI Vision API request...")
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        }
        
        payload = {
            "model": "gpt-4-vision-preview",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Describe what you see in this image. Include people, objects, activities, environment, and any important details."
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_data}"
                            }
                        }
                    ]
                }
            ],
            "max_tokens": 300
        }
        
        logger.info("Sending request to OpenAI API...")
        
        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=60
        )
        
        logger.info(f"OpenAI response status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            description = result["choices"][0]["message"]["content"]
            logger.info(f"✓ OpenAI succeeded!")
            logger.info(f"Description: {description[:100]}...")
            return {
                "success": True,
                "description": description,
                "model": "openai-gpt4-vision"
            }
        else:
            try:
                error_data = response.json()
                error_msg = error_data.get("error", {}).get("message", str(error_data))
            except:
                error_msg = response.text
            
            logger.error(f"OpenAI API error ({response.status_code}): {error_msg}")
            return {
                "success": False,
                "error": f"API error {response.status_code}: {error_msg}"
            }
            
    except requests.exceptions.Timeout:
        logger.error("OpenAI request timeout (60 seconds)")
        return {"success": False, "error": "Request timeout"}
    except requests.exceptions.ConnectionError as e:
        logger.error(f"OpenAI connection error: {str(e)}")
        return {"success": False, "error": f"Connection error: {str(e)}"}
    except requests.exceptions.RequestException as e:
        logger.error(f"OpenAI request error: {str(e)}")
        return {"success": False, "error": f"Request error: {str(e)}"}
    except Exception as e:
        logger.error(f"OpenAI error: {str(e)}", exc_info=True)
        return {"success": False, "error": str(e)}


def describe_with_trained_model(image_data: str) -> dict:
    """
    Describe image using the trained PyTorch UNet model
    Generates object descriptions from segmentation results
    """
    try:
        tensor, original_image = prepare_image(image_data)
        if tensor is None:
            return {"success": False, "error": "Failed to prepare image"}
        
        if model is None:
            return {"success": False, "error": "Model not loaded"}
        
        logger.info("Running UNet model inference...")
        with torch.no_grad():
            output = model(tensor)
            predictions = torch.argmax(output, dim=1).squeeze(0).cpu().numpy()
        
        logger.info(f"Predictions shape: {predictions.shape}, unique classes: {len(np.unique(predictions))}")
        
        description = generate_audio_description(predictions)
        logger.info(f"Generated description: {description}")
        
        return {
            "success": True,
            "description": description,
            "model": "trained-unet-segmentation"
        }
        
    except Exception as e:
        logger.error(f"Trained model error: {str(e)}", exc_info=True)
        return {"success": False, "error": str(e)}


def get_best_description(descriptions: list) -> dict:
    """
    Select the best description from multiple sources
    Prefers: OpenAI > Ollama > Trained Model (by quality/length)
    """
    successful = [d for d in descriptions if d.get("success")]
    
    if not successful:
        return {
            "success": False,
            "description": "Could not generate description from any source",
            "source": "none",
            "all_errors": [d.get("error") for d in descriptions]
        }
    
    # Sort by priority: OpenAI first, then Ollama, then trained model
    priority_order = {"openai-gpt4-vision": 0, "ollama-llava": 1, "trained-unet-segmentation": 2}
    
    sorted_descriptions = sorted(
        successful,
        key=lambda x: (priority_order.get(x.get("model"), 999), -len(x.get("description", "")))
    )
    
    best = sorted_descriptions[0]
    return {
        "success": True,
        "description": best.get("description"),
        "source": best.get("model"),
        "all_sources": successful
    }


# ==============================
# Prediction Functions
# ==============================
@app.route('/api/describe-image', methods=['POST'])
def describe_image():
    """
    Generate image description using OpenAI Vision API
    Simple, reliable endpoint for image understanding
    """
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        image_data = data.get('image')
        if not image_data:
            return jsonify({'error': 'No image provided'}), 400
        
        logger.info("=" * 60)
        logger.info("IMAGE DESCRIPTION REQUEST")
        logger.info("=" * 60)
        
        # Check if API key is configured
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key or not api_key.strip():
            logger.error("OPENAI_API_KEY not configured in environment")
            return jsonify({
                'success': False,
                'description': 'Image processing service temporarily unavailable',
                'source': 'error'
            }), 503
        
        # Try OpenAI
        logger.info("Attempting OpenAI Vision API...")
        openai_result = describe_with_openai(image_data)
        
        if openai_result.get("success"):
            logger.info("✓ OpenAI succeeded!")
            logger.info("=" * 60)
            return jsonify({
                'success': True,
                'description': openai_result.get('description'),
                'source': 'openai-gpt4-vision',
                'timestamp': __import__('datetime').datetime.now().isoformat()
            }), 200
        else:
            error = openai_result.get('error', 'Unknown error')
            logger.error(f"✗ OpenAI failed: {error}")
            logger.info("=" * 60)
            return jsonify({
                'success': False,
                'description': 'Unable to process image at this time',
                'source': 'error'
            }), 503
    
    except Exception as e:
        logger.error(f"Description endpoint error: {str(e)}", exc_info=True)
        logger.info("=" * 60)
        return jsonify({
            'success': False,
            'description': 'An error occurred while processing the image'
        }), 500


@app.route('/api/predict', methods=['POST'])
def predict():
    """Process image and return object detection results using YOLOv8"""
    try:
        if model is None:
            logger.error("Model not loaded")
            return jsonify({'error': 'Model not loaded. Please check server logs.'}), 500
        
        data = request.json
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
            
        image_data = data.get('image')
        
        if not image_data:
            return jsonify({'error': 'No image provided. Please send image data in the request body.'}), 400
        
        logger.info("Processing prediction request with YOLOv8")
        
        # Prepare image
        image = prepare_image(image_data)
        if image is None:
            return jsonify({'error': 'Failed to process image. Please ensure it is a valid image file.'}), 400
        
        # Run YOLOv8 inference
        results = model(image, conf=0.5)  # conf threshold
        detections = results[0]
        
        logger.info(f"YOLOv8 detected {len(detections.boxes)} objects")
        
        # Extract detections
        detected_objects = []
        for box in detections.boxes:
            class_idx = int(box.cls[0])
            confidence = float(box.conf[0])
            class_name = model.names[class_idx]
            detected_objects.append({
                'class': class_name,
                'confidence': confidence,
                'box': box.xyxy[0].tolist()
            })
        
        logger.info(f"Detections: {detected_objects}")
        
        # Generate description
        description = generate_audio_description(detected_objects)
        
        # Prepare response
        response = {
            'success': True,
            'detections': detected_objects,
            'num_objects': len(detected_objects),
            'description': description,
            'timestamp': __import__('datetime').datetime.now().isoformat()
        }
        
        logger.info(f"Prediction completed. Description: {description}")
        return jsonify(response), 200
    
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}", exc_info=True)
        return jsonify({'error': f'Prediction failed: {str(e)}'}), 500


def generate_audio_description(detected_objects):
    """Generate text description based on YOLO detections"""
    if not detected_objects:
        return "No objects detected in image."
    
    # Group by class and count
    class_counts = {}
    for obj in detected_objects:
        class_name = obj['class']
        confidence = obj['confidence']
        if class_name not in class_counts:
            class_counts[class_name] = {'count': 0, 'avg_conf': 0}
        class_counts[class_name]['count'] += 1
        class_counts[class_name]['avg_conf'] = max(class_counts[class_name]['avg_conf'], confidence)
    
    # Format: "Image contains: person (95%), dog (87%)"
    parts = []
    for class_name in sorted(class_counts.keys()):
        conf = class_counts[class_name]['avg_conf']
        count = class_counts[class_name]['count']
        if count > 1:
            parts.append(f"{count}x {class_name} ({conf*100:.0f}%)")
        else:
            parts.append(f"{class_name} ({conf*100:.0f}%)")
    
    logger.info("=" * 60)
    logger.info("DETECTION RESULTS DEBUG")
    logger.info("=" * 60)
    for obj in detected_objects:
        logger.info(f"  {obj['class']}: {obj['confidence']*100:.1f}%")
    logger.info("=" * 60)
    
    return f"Image contains: {', '.join(parts)}"


@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint with configuration status"""
    api_key = os.getenv("OPENAI_API_KEY")
    api_key_configured = bool(api_key and api_key.strip())
    
    status = {
        'status': 'healthy',
        'model_loaded': model is not None,
        'device': str(device),
        'openai_configured': api_key_configured,
        'openai_key_preview': f"{api_key[:10]}...{api_key[-5:]}" if api_key_configured else "NOT SET"
    }
    
    logger.info(f"Health check: {status}")
    return jsonify(status), 200


@app.route('/api/debug/test-model', methods=['GET'])
def test_model():
    """Test if model is working by running a dummy prediction"""
    try:
        if model is None:
            return jsonify({
                'success': False,
                'error': 'Model not loaded',
                'model_loaded': False
            }), 500
        
        # Create a dummy image tensor with CORRECT input size: 128x256
        # This matches the training configuration
        dummy_tensor = torch.randn(1, 3, 128, 256).to(device)
        
        logger.info("Testing model with dummy input (1, 3, 128, 256)")
        
        with torch.no_grad():
            output = model(dummy_tensor)
            predictions = torch.argmax(output, dim=1).squeeze(0).cpu().numpy()
        
        unique = np.unique(predictions)
        
        logger.info("=" * 60)
        logger.info("MODEL TEST SUCCESSFUL")
        logger.info("=" * 60)
        logger.info(f"Input shape: {dummy_tensor.shape}")
        logger.info(f"Output shape: {output.shape}")
        logger.info(f"Predictions shape: {predictions.shape}")
        logger.info(f"Unique classes: {sorted(unique)}")
        logger.info(f"Class range: {predictions.min()} to {predictions.max()}")
        logger.info("=" * 60)
        
        return jsonify({
            'success': True,
            'model_loaded': True,
            'device': str(device),
            'input_shape': list(dummy_tensor.shape),
            'output_shape': list(output.shape),
            'predictions_shape': list(predictions.shape),
            'unique_classes': sorted(unique.tolist()),
            'class_range': [int(predictions.min()), int(predictions.max())],
            'message': 'Model is working correctly!',
            'note': 'Input size must be: (batch, channels, 128 height, 256 width)'
        }), 200
        
    except Exception as e:
        logger.error(f"Model test error: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e),
            'model_loaded': model is not None,
            'expected_input_shape': [1, 3, 128, 256]
        }), 500


# ==============================
# Serve React Frontend
# ==============================
@app.route('/')
def serve_index():
    """Serve the main React app"""
    return send_from_directory(app.static_folder, 'index.html')


@app.route('/<path:path>')
def serve_static(path):
    """Serve static files and fallback to index.html for SPA routing"""
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')


# ==============================
# Error Handlers
# ==============================
@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    # Serve index.html for SPA routing
    return send_from_directory(app.static_folder, 'index.html'), 200


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    logger.error(f"Internal server error: {str(error)}")
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    # Check if frontend is built
    if not os.path.exists(os.path.join(os.path.dirname(__file__), 'client/dist')):
        logger.warning("Frontend not built. Run 'npm run build' in the client folder first.")
    
    # Run development server
    app.run(debug=True, host='0.0.0.0', port=5000)
