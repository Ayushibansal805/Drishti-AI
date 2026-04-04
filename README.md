# 🚀 Drishti – AI-Powered Spatial Audio Assistive System

## 👁️ Overview

**Drishti** is a real-time AI-powered assistive system designed to help visually impaired individuals navigate their surroundings safely and independently.

Unlike traditional navigation systems that only provide directions, Drishti offers **real-time environmental awareness** by detecting objects, estimating their distance, identifying their position (left/center/right), and converting this information into **spatial audio alerts**.

---

## 🎯 Key Features

* 🔍 Real-time object detection using YOLOv8 (CPU optimized)
* 📏 Depth estimation using MiDaS (monocular depth)
* 📍 Spatial awareness (Left / Center / Right)
* 🎧 3D spatial audio feedback (direction-based sound)
* ⚠️ Hazard prioritization system (High / Medium / Low risk)
* 🔊 Offline text-to-speech (no internet required)
* ⚡ Optimized for low-end laptops (CPU-only execution)
* 🧠 Smart alert system (avoids repeated announcements)
* 📊 FPS display for performance monitoring
* 🎨 Modern React UI with Tailwind CSS
* ⚡ Full-stack integration with Flask backend

---

## 🏗️ Project Architecture

```
Webcam Input → Object Detection → Depth Estimation → 
Distance Calculation → Spatial Mapping → Hazard Analysis → 
Text Generation → Spatial Audio Output
         ↓
    Flask API Server (Port 5000)
         ↓
  React Frontend | Vite Dev Server (Port 5173)
```

---

## 📁 Project Structure

```
Drishti-AI (Main Repo - Full Stack)
├── app.py              # Flask backend server
├── requirements.txt    # Python dependencies (Backend + ML)
├── trained_model.pth   # Trained UNet model
├── .env                # Environment configuration
├── start-dev.bat       # Windows startup script
├── start-dev.ps1       # PowerShell startup script
│
├── src/                # Python backend (ML/AI models)
│   ├── model.py        # UNet model definition
│   ├── dataset.py      # Data loading utilities
│   ├── train.py        # Training script
│   └── predict.py      # Inference utilities
│
├── data/               # Data directory
│   ├── test/           # Test images
│   └── predictions/    # Model predictions
│
└── client/             # React Frontend (Integrated)
    ├── package.json    # Frontend dependencies & scripts
    ├── vite.config.ts  # Vite configuration with API proxy
    ├── index.html      # HTML entry point
    ├── tsconfig.json   # TypeScript configuration
    ├── tailwind.config.js   # Tailwind CSS config
    │
    ├── src/
    │   ├── App.tsx     # Main App component
    │   ├── main.tsx    # Application entry point
    │   ├── App.css     # Styles
    │   ├── index.css   # Global styles
    │   │
    │   ├── pages/      # Page components
    │   │   ├── Landing.tsx
    │   │   ├── About.tsx
    │   │   └── AppPage.tsx
    │   │
    │   ├── components/ # Reusable components
    │   └── assets/     # Static assets
    │
    ├── dist/           # Build output (generated)
    ├── node_modules/   # Dependencies (generated)
    └── public/         # Public assets
```

---

## ⚙️ Installation & Setup

### 🔹 Step 1: Clone Repository

```bash
git clone <repo-url>
cd Drishti-AI
```

### 🔹 Step 2: Create Virtual Environment

```bash
python -m venv venv
venv\Scripts\activate   # Windows
source venv/bin/activate  # macOS/Linux
```

### 🔹 Step 3: Install Python Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 🔹 Step 4: Install Frontend Dependencies

```bash
cd client
npm install
cd ..
```

---

## 🚀 Running the Application

### **Option 1: Automated Startup (Recommended)**

#### Windows (Batch File)
```bash
start-dev.bat
```

#### Windows (PowerShell)
```powershell
powershell -ExecutionPolicy Bypass -File start-dev.ps1
```

This will automatically:
- Check and install dependencies (if needed)
- Start Flask backend (http://localhost:5000)
- Start Vite dev server (http://localhost:5173)

---

### **Option 2: Manual Startup (Separate Terminals)**

**Terminal 1 - Backend Server:**
```bash
# Make sure venv is activated
venv\Scripts\activate
python app.py
# Backend will be available at http://localhost:5000
```

**Terminal 2 - Frontend Dev Server:**
```bash
cd client
npm run dev
# Frontend will be available at http://localhost:5173
```

The frontend automatically proxies API calls to the backend via Vite configuration.

---

### **Option 3: Production Build**

Build and serve the frontend as static files from Flask:

```bash
# Build the React frontend
cd client
npm run build
cd ..

# Run the Flask server (serves built frontend)
python app.py
# Application will be available at http://localhost:5000
```

---

## 📡 API Endpoints

### Health Check
```
GET /api/health
```
Returns server status and model information.

### Image Prediction
```
POST /api/predict
Content-Type: application/json

{
  "image": "<base64 image data>"
}
```
Returns segmentation predictions and object descriptions.

---

## 🛠️ Development

### Frontend Development
```bash
cd client
npm run dev      # Start dev server with hot reload
npm run build    # Build for production
npm run lint     # Run ESLint
```

### Backend Development
```bash
# The Flask server runs in debug mode by default
python app.py
```

### Adding Environment Variables
Edit `.env` file in the root directory:
```env
FLASK_ENV=development
API_PORT=5000
MODEL_PATH=./trained_model.pth
```

---

## 🐛 Troubleshooting

### Port Already in Use
If port 5000 or 5173 is already in use:

**For Flask (5000):**
```bash
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**For Vite (5173):**
```bash
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### CORS Issues
The Flask backend is configured with CORS enabled. If you see CORS errors:
1. Check that Flask backend is running on http://localhost:5000
2. Ensure Vite proxy is configured in `client/vite.config.ts`
3. Verify the API endpoint is correct in your React components

### Model Not Loading
If you see "Model not loaded" errors:
1. Ensure `trained_model.pth` exists in the root directory
2. Check the Flask server logs for specific error messages
3. Verify the model format matches `UNet` class definition in `app.py`

### Frontend Not Building
```bash
# Clear cache and reinstall
cd client
rm -r node_modules package-lock.json
npm install
npm run build
```

---

#### Recommended (Stable Method)

```bash
pip install numpy
pip install opencv-python
pip install pyttsx3

pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu

pip install ultralytics
pip install sounddevice scipy
```

---

### 🔹 Step 5: Run the Project

```bash
python main.py
```

---

## 🎮 Controls

* Press **ESC** → Exit application

---

## 🧠 How It Works

### 1. Object Detection

* Uses YOLOv8n (lightweight model)
* Detects objects like:

  * Person
  * Vehicles
  * Obstacles

---

### 2. Depth Estimation

* Uses MiDaS_small model
* Generates depth map from single camera input

---

### 3. Distance Calculation

* Extracts depth values from detected object region
* Converts into approximate real-world distance

---

### 4. Spatial Mapping

* Frame divided into:

  * Left
  * Center
  * Right
* Helps determine direction of objects

---

### 5. Hazard Detection

Rules-based system:

* 🚗 Vehicle < 5m → HIGH risk
* 🚶 Person < 2m → MEDIUM risk
* Others → LOW risk

---

### 6. Spatial Audio Feedback

* Left object → sound in left ear
* Right object → sound in right ear
* Center → balanced audio

---

## ⚡ Performance Optimization

* Uses **YOLOv8n (nano model)** for speed
* Frame resized to **256x192**
* Processes **every 3–5 frames**
* Limits detection to **top 3 objects**
* Uses **threading for audio (non-blocking)**

---

## 📊 Expected Performance

| Feature           | Output         |
| ----------------- | -------------- |
| FPS               | 5–10 FPS (CPU) |
| Latency           | Low            |
| Accuracy          | Good           |
| Internet Required | ❌ No           |

---

## ⚠️ Limitations

* Performance depends on CPU capability
* Reduced accuracy in low-light conditions
* Depth estimation is approximate
* Real-time FPS is limited on low-end systems

---

## 🔮 Future Improvements

* 📱 Mobile app integration (Flutter)
* 🎧 Advanced binaural 3D audio
* ☁️ Cloud-based GPU acceleration
* 🧠 AI-based contextual understanding
* 🎙️ Voice command support
* 🧍 Object tracking (movement prediction)
* 🥽 Wearable device integration

---

## 👩‍💻 Team – InnovateHer

* **Ayushi Bansal**
* **Deepti Yadav**
* **Ishika Garg**

---

## 🏆 Use Case

Drishti can be used as:

* Assistive navigation tool
* Smart wearable system
* Safety enhancement device
* AI-based accessibility solution

---

## 💡 Key Innovation

> “Drishti converts vision into sound — enabling users to *hear* their surroundings.”

---

## 📜 License

This project is developed for educational and hackathon purposes.

---

## 🙌 Acknowledgements

* YOLOv8 – Ultralytics
* MiDaS – Intel Intelligent Systems Lab
* OpenCV Community
* PyTorch

---

## ⭐ Final Note

This project demonstrates how AI can be used to **empower accessibility and independence**, bridging the gap between vision and perception.

---
