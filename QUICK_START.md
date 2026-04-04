# 🚀 Quick Start Guide - Drishti AI Full Stack

## ✅ Integration Complete!

Your Drishti AI project is now fully integrated with backend (Flask + ML) and frontend (React + Vite) in a single repository.

---

## 🎯 Start in 2 Ways

### **Option 1: Automated (Recommended)**

#### Windows PowerShell:
```bash
powershell -ExecutionPolicy Bypass -File start-dev.ps1
```

Or double-click: `start-dev.bat`

This will:
- ✅ Install dependencies if needed
- ✅ Start Flask backend (port 5000)
- ✅ Start React frontend (port 5173)
- ✅ Open both in separate windows

### **Option 2: Manual Setup**

**Terminal 1 - Backend:**
```bash
cd Drishti-AI
.\venv\Scripts\Activate.ps1
python app.py
```

Backend URL: http://localhost:5000

**Terminal 2 - Frontend:**
```bash
cd Drishti-AI\client
npm run dev
```

Frontend URL: http://localhost:5173


---

## 📋 What Was Done

| Component | Status | Location |
|-----------|--------|----------|
| Flask Backend Server | ✅ Created | `app.py` |
| API Endpoints | ✅ Ready | `/api/health`, `/api/predict` |
| Frontend Integrated | ✅ Done | `client/` |
| API Service | ✅ Created | `client/src/services/api.ts` |
| Database Ready | ✅ Connected | Vite proxy configured |
| Dependencies | ✅ Installed | All packages ready |
| Startup Scripts | ✅ Created | `start-dev.bat`, `start-dev.ps1` |
| Documentation | ✅ Complete | README.md, INTEGRATION_GUIDE.md |

---

## 🔍 Verify Installation

Open your browser and check:

1. **Backend Health**: http://localhost:5000/api/health
   - Should show: `{ "status": "healthy", "model_loaded": true }`

2. **Frontend**: http://localhost:5173 (or 5000 in production)
   - Should show Drishti AI app with camera and controls

3. **Backend Status**: Look at top of webpage
   - Should show: "✅ Backend: healthy"

---

## 🎮 Try It Out

1. **Upload Image**: Click "📁 Upload" button
2. **Capture Frame**: Click "📸 Capture" button  
3. **Voice Command**: Click "🤖" button

Each action sends data to the Flask backend for ML processing!

---

## 📚 Documentation

- **INTEGRATION_GUIDE.md** - Complete integration details
- **README.md** - Full project documentation
- **app.py** - Backend server code (well-commented)
- **client/src/services/api.ts** - Frontend API calls
- **client/src/pages/AppPage.tsx** - UI with backend integration

---

## 🐛 If Something Goes Wrong

### Port Already in Use?
```powershell
# Kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Flask Won't Start?
```bash
# Check Python is working
python --version

# Check Flask installed
python -c "import flask; print('Flask OK')"

# Start with debug output
python -u app.py
```

### Frontend Won't Load?
```bash
cd client
npm install
npm run dev
```

### Still Issues?
Check [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) → Troubleshooting section

---

## 📁 Project Structure

```
Drishti-AI (YOUR MAIN REPO) ⭐
├── app.py              ← Flask server
├── requirements.txt    ← Python dependencies
├── start-dev.bat       ← Click to auto-start!
├── start-dev.ps1       ← PowerShell version
│
├── client/             ← React Frontend
│   ├── package.json
│   ├── vite.config.ts  ← API proxy configured here
│   └── src/
│       ├── services/api.ts  ← Backend communication
│       └── pages/AppPage.tsx ← ML integration here
│
├── src/                ← ML Model Code
│   ├── model.py
│   ├── train.py
│   └── predict.py
│
└── README.md, INTEGRATION_GUIDE.md, etc.
```

---

## 🔌 API Endpoints

### Health Check
```http
GET /api/health

Response:
{
  "status": "healthy",
  "model_loaded": true,
  "device": "cpu"
}
```

### Image Prediction
```http
POST /api/predict
Content-Type: application/json

{
  "image": "<base64_image_data>"
}

Response:
{
  "success": true,
  "predictions": [[512x512 segmentation map]],
  "description": "Detected: person, car, building",
  "timestamp": "2026-04-04T10:30:00Z"
}
```

---

## ✨ Next Steps

1. **Test the app**: Run start-dev.ps1 and try uploading an image
2. **Customize ML**: Edit prediction logic in `app.py`
3. **Enhance UI**: Update React components in `client/src/`
4. **Deploy**: GitHub → Cloud (Azure, Heroku, etc.)

---

## 📞 Support

- **Flask docs**: https://flask.palletsprojects.com/
- **React docs**: https://react.dev/
- **PyTorch docs**: https://pytorch.org/
- **Vite docs**: https://vitejs.dev/

---

## 🎉 Ready to Go!

Your full-stack Drishti AI is ready!

**Start now:**
```bash
powershell -ExecutionPolicy Bypass -File start-dev.ps1
```

Then open: http://localhost:5173

**Enjoy!** 🚀
