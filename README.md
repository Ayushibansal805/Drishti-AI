# 🚀 Drishti-AI

### AI-Powered Spatial Awareness System for the Visually Impaired

Drishti-AI is an intelligent assistive system designed to enhance environmental awareness for visually impaired individuals. Unlike traditional navigation tools, Drishti-AI **understands surroundings in real time** using advanced computer vision and delivers **context-aware audio feedback**.

---

## 🌟 Key Features

* 🎯 **Real-Time Object Detection** using YOLO
* 🧠 **Scene Understanding & Segmentation** using U-Net
* 🔊 **Audio Feedback System** for intuitive guidance
* ⚡ **Low-Latency Processing** for real-time usability
* 🌐 **Full-Stack Web Interface** (React + FastAPI)

---

## 🧠 AI Architecture

Drishti-AI combines detection and segmentation to create a richer understanding of the environment:

* **Object Detection (YOLO):** Identifies objects like people, vehicles, obstacles
* **Semantic Segmentation (U-Net):** Understands scene layout (road, walls, pathways)
* **Fusion Layer:** Combines both outputs for contextual awareness
* **Audio Engine:** Converts insights into meaningful voice guidance

---

## 🖼️ System Workflow

1. 📷 Capture real-time video input
2. 🧠 Run YOLO for object detection
3. 🧩 Run U-Net for segmentation
4. 🔗 Fuse outputs for context
5. 🔊 Generate audio instructions

---

## 🏗️ Tech Stack

### 🎨 Frontend

* React.js
* Tailwind CSS

### ⚙️ Backend

* FastAPI / Flask
* REST APIs

### 🤖 AI/ML

* PyTorch
* YOLO (Object Detection)
* U-Net (Segmentation)

---

## 📂 Project Structure

```
Drishti-AI/
│
├── frontend/        # React frontend
├── backend/         # API server (FastAPI/Flask)
├── model/           # ML models (YOLO + U-Net)
│
├── requirements.txt
├── README.md
└── .gitignore
```

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Ayushibansal805/Drishti-AI.git
cd Drishti-AI
```

---

### 2️⃣ Backend Setup

```bash
cd backend
pip install -r ../requirements.txt
python app.py
```

---

### 3️⃣ Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## 🔊 How It Helps

Drishti-AI acts as a **spatial companion**, enabling users to:

* Navigate safely in unfamiliar environments
* Detect obstacles in real-time
* Understand surroundings through audio cues

---

## 🧪 Future Improvements

* 📱 Mobile App Integration
* 🎧 3D Spatial Audio Feedback
* ⚡ Model Optimization for Edge Devices
* ☁️ Cloud-based Inference Scaling

---

## 🤝 Contributing

Contributions are welcome! Feel free to fork the repo and submit a PR.

---

## 📜 License

This project is licensed under the MIT License.

---

## 💡 Inspiration

Built with the vision of making AI accessible and impactful for real-world problems, especially in assistive technology.

---

## 👩‍💻 Author

Developed by **Ayushi Bansal**
✨ Passionate about AI, accessibility, and impactful tech

---
