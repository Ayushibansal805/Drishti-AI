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

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__, 
            static_folder='client/dist',
            static_url_path='')
CORS(app)

# ==============================
# UNet Model Definition
# ==============================
class DoubleConv(nn.Module):
    """Two consecutive conv layers with ReLU"""
    def __init__(self, in_channels, out_channels):
        super(DoubleConv, self).__init__()
        self.conv = nn.Sequential(
            nn.Conv2d(in_channels, out_channels, kernel_size=3, padding=1),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_channels, out_channels, kernel_size=3, padding=1),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True)
        )
    
    def forward(self, x):
        return self.conv(x)


class UNet(nn.Module):
    def __init__(self, in_channels=3, out_classes=19):
        super(UNet, self).__init__()
        self.in_channels = in_channels
        self.out_classes = out_classes

        # Encoder
        self.down1 = DoubleConv(in_channels, 64)
        self.pool1 = nn.MaxPool2d(2)
        self.down2 = DoubleConv(64, 128)
        self.pool2 = nn.MaxPool2d(2)
        self.down3 = DoubleConv(128, 256)
        self.pool3 = nn.MaxPool2d(2)
        self.down4 = DoubleConv(256, 512)
        self.pool4 = nn.MaxPool2d(2)

        # Bottleneck
        self.bottleneck = DoubleConv(512, 1024)

        # Decoder
        self.up4 = nn.ConvTranspose2d(1024, 512, kernel_size=2, stride=2)
        self.conv4 = DoubleConv(1024, 512)
        self.up3 = nn.ConvTranspose2d(512, 256, kernel_size=2, stride=2)
        self.conv3 = DoubleConv(512, 256)
        self.up2 = nn.ConvTranspose2d(256, 128, kernel_size=2, stride=2)
        self.conv2 = DoubleConv(256, 128)
        self.up1 = nn.ConvTranspose2d(128, 64, kernel_size=2, stride=2)
        self.conv1 = DoubleConv(128, 64)

        self.final = nn.Conv2d(64, out_classes, kernel_size=1)

    def forward(self, x):
        # Encoder
        e1 = self.down1(x)
        e2 = self.down2(self.pool1(e1))
        e3 = self.down3(self.pool2(e2))
        e4 = self.down4(self.pool3(e3))
        
        # Bottleneck
        b = self.bottleneck(self.pool4(e4))

        # Decoder
        d4 = self.up4(b)
        d4 = self.conv4(torch.cat([d4, e4], dim=1))
        d3 = self.up3(d4)
        d3 = self.conv3(torch.cat([d3, e3], dim=1))
        d2 = self.up2(d3)
        d2 = self.conv2(torch.cat([d2, e2], dim=1))
        d1 = self.up1(d2)
        d1 = self.conv1(torch.cat([d1, e1], dim=1))

        return self.final(d1)


# ==============================
# Model Loading & Initialization
# ==============================
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
logger.info(f"Using device: {device}")

# Load model
try:
    model = UNet(in_channels=3, out_classes=19)
    model_path = os.path.join(os.path.dirname(__file__), 'trained_model.pth')
    
    if os.path.exists(model_path):
        logger.info(f"Loading model from {model_path}")
        checkpoint = torch.load(model_path, map_location=device)
        if isinstance(checkpoint, dict) and 'model_state_dict' in checkpoint:
            model.load_state_dict(checkpoint['model_state_dict'])
        else:
            model.load_state_dict(checkpoint)
    else:
        logger.warning(f"Model file not found at {model_path}, using untrained model")
    
    model.to(device)
    model.eval()
    logger.info("Model loaded successfully")
except Exception as e:
    logger.error(f"Failed to load model: {str(e)}")
    model = None


# ==============================
# Image Preprocessing
# ==============================
def prepare_image(image_data):
    """Convert base64 image to tensor"""
    try:
        # Decode base64
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        image_bytes = base64.b64decode(image_data)
        image = Image.open(BytesIO(image_bytes)).convert('RGB')
        
        # Resize to model input size (adjust as needed)
        image = image.resize((512, 512))
        
        # Convert to tensor and normalize
        to_tensor = transforms.Compose([
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406],
                               std=[0.229, 0.224, 0.225])
        ])
        tensor = to_tensor(image).unsqueeze(0).to(device)
        return tensor, image
    except Exception as e:
        logger.error(f"Error preparing image: {str(e)}")
        return None, None


# ==============================
# Prediction Functions
# ==============================
@app.route('/api/predict', methods=['POST'])
def predict():
    """Process image and return segmentation/object detection results"""
    try:
        if model is None:
            return jsonify({'error': 'Model not loaded'}), 500
        
        data = request.json
        image_data = data.get('image')
        
        if not image_data:
            return jsonify({'error': 'No image provided'}), 400
        
        # Prepare image
        tensor, original_image = prepare_image(image_data)
        if tensor is None:
            return jsonify({'error': 'Failed to process image'}), 400
        
        # Run inference
        with torch.no_grad():
            output = model(tensor)
            predictions = torch.argmax(output, dim=1).squeeze(0).cpu().numpy()
        
        # Convert predictions to response
        response = {
            'success': True,
            'predictions': predictions.tolist(),
            'shape': predictions.shape,
            'description': generate_audio_description(predictions),
            'timestamp': __import__('datetime').datetime.now().isoformat()
        }
        
        return jsonify(response)
    
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        return jsonify({'error': str(e)}), 500


def generate_audio_description(predictions):
    """Generate text description based on segmentation results"""
    # This can be expanded with actual object detection logic
    unique_classes = np.unique(predictions)
    class_names = {
        0: 'background', 1: 'person', 2: 'bicycle', 3: 'car', 4: 'dog',
        5: 'cat', 6: 'building', 7: 'road', 8: 'tree', 9: 'furniture',
        10: 'wall', 11: 'floor', 12: 'ceiling', 13: 'door', 14: 'window',
        15: 'table', 16: 'chair', 17: 'stairs', 18: 'other'
    }
    
    detected_objects = [class_names.get(int(c), f'Class {c}') 
                       for c in unique_classes if c != 0]
    
    if detected_objects:
        return f"Detected: {', '.join(detected_objects)}"
    return "No objects detected"


@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'device': str(device)
    })


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
