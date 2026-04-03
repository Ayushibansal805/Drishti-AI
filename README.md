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

---

## 🏗️ Project Architecture

```
Webcam Input → Object Detection → Depth Estimation → 
Distance Calculation → Spatial Mapping → Hazard Analysis → 
Text Generation → Spatial Audio Output
```

---

## 📁 Project Structure

```
drishti/
│── main.py          # Main application entry point
│── detection.py     # YOLO object detection
│── depth.py         # MiDaS depth estimation
│── spatial.py       # Left/Center/Right classification
│── hazard.py        # Risk evaluation logic
│── audio.py         # Text-to-speech + spatial audio
│── utils.py         # Frame optimization utilities
│── requirements.txt # Dependencies
│── README.md        # Project documentation
```

---

## ⚙️ Installation & Setup

### 🔹 Step 1: Clone or Create Project

```bash
mkdir drishti
cd drishti
```

---

### 🔹 Step 2: Create Virtual Environment

```bash
python -m venv venv
venv\Scripts\activate   # Windows
```

---

### 🔹 Step 3: Upgrade pip

```bash
python -m pip install --upgrade pip
```

---

### 🔹 Step 4: Install Dependencies

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
