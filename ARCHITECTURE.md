# Drishti AI - Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │             React Frontend (AppPage.tsx)                 │   │
│  │                                                           │   │
│  │  ┌─────────────────┐          ┌──────────────────────┐  │   │
│  │  │  Input Panel    │          │   Results Panel      │  │   │
│  │  │                 │          │                      │  │   │
│  │  │ ┌─────────────┐ │          │ ┌────────────────┐   │  │   │
│  │  │ │   Camera    │ │          │ │ Segmentation   │   │  │   │
│  │  │ │   Stream    │ │          │ │     Mask       │   │  │   │
│  │  │ └─────────────┘ │          │ └────────────────┘   │  │   │
│  │  │ ┌─────────────┐ │          │ ┌────────────────┐   │  │   │
│  │  │ │   Upload    │ │          │ │    Results     │   │  │   │
│  │  │ │   Button    │ │          │ │   Description  │   │  │   │
│  │  │ └─────────────┘ │          │ └────────────────┘   │  │   │
│  │  │ ┌─────────────┐ │          │ ┌────────────────┐   │  │   │
│  │  │ │   Capture   │ │          │ │  Activity Log  │   │  │   │
│  │  │ │   Button    │ │          │ └────────────────┘   │  │   │
│  │  │ └─────────────┘ │          │                      │  │   │
│  │  │                 │          │  Progress Bar        │  │   │
│  │  │  Settings       │          │  Loading Spinner     │  │   │
│  │  └─────────────────┘          └──────────────────────┘  │   │
│  │                                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          ▲                                        │
│                          │                                        │
│                      Fetch API                                    │
│                          │                                        │
│                 ┌────────▼────────┐                               │
│                 │  MediaDevices   │                               │
│                 │  SpeechRecog    │                               │
│                 │  TTS (Web Audio)│                               │
│                 └─────────────────┘                               │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
                          ▲              ▼
                          │              │
                    HTTP GET/POST   WebSocket (optional)
                          │              │
        ┌─────────────────┴──────────────┴──────────────┐
        │                                                │
┌───────▼────────────────────────────────────────────────▼───────┐
│                    FLASK BACKEND                               │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  Routes:                                               │   │
│  │  - GET  /api/health        Health check               │   │
│  │  - POST /api/predict       Image inference            │   │
│  │  - GET  /                  Serve React SPA            │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  Prediction Pipeline:                                  │   │
│  │                                                         │   │
│  │  1. Receive Image (base64)                             │   │
│  │     ▼                                                  │   │
│  │  2. Decode & Validate                                 │   │
│  │     ▼                                                  │   │
│  │  3. Preprocess (resize to 512x512, normalize)         │   │
│  │     ▼                                                  │   │
│  │  4. UNet Model Inference                              │   │
│  │     ▼                                                  │   │
│  │  5. Get Predictions (argmax of 19 classes)           │   │
│  │     ▼                                                  │   │
│  │  6. Generate Description                              │   │
│  │     ▼                                                  │   │
│  │  7. Return JSON Response                              │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  ML Model:                                             │   │
│  │                                                         │   │
│  │  ┌─ UNet Architecture ─────────────────────────────┐  │   │
│  │  │                                                  │  │   │
│  │  │  Input (3, 512, 512)                            │  │   │
│  │  │       ▼                                          │  │   │
│  │  │  [Encoder] conv3→3  [Bottleneck]  [Decoder]    │  │   │
│  │  │  • DoubleConv      • DoubleConv   • Upsampling │  │   │
│  │  │  • MaxPool 4x      • 1024 filters • Concat     │  │   │
│  │  │       ▼                    ▼            ▼       │  │   │
│  │  │  Output (19, 512, 512) ← Predictions           │  │   │
│  │  │                                                  │  │   │
│  │  │  Classes: 0=bg, 1=person, 2=car, 3=dog...     │  │   │
│  │  └──────────────────────────────────────────────┘  │  │   │
│  │                                                     │  │   │
│  │  Device: CUDA (GPU) or CPU                         │  │   │
│  │  Weights: trained_model.pth                        │  │   │
│  └────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

### Successful Prediction Flow

```
User uploads image
        ▼
Browser encodes to base64
        ▼
POST /api/predict with JSON
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgAB..."
}
        ▼
Backend receives request
        ▼
Validates image data
        ▼
Decodes base64 to PIL Image
        ▼
Resizes to 512×512
        ▼
Normalizes with ImageNet stats
        ▼
Converts to PyTorch tensor
        ▼
GPU/CPU inference through UNet
        ▼
Gets class predictions (19 channels)
        ▼
Applies argmax → class IDs
        ▼
Generates description: "Detected: person, car"
        ▼
Sends JSON response
{
  "success": true,
  "predictions": [[0,1,2,...], [1,2,1,...]],
  "shape": [512, 512],
  "description": "Detected: person, car, building",
  "timestamp": "2024-01-15T10:30:00Z"
}
        ▼
Frontend receives response
        ▼
Updates state:
  - setPredictions(response)
  - setOutput(description)
  - setMaskImage(heatmap)
        ▼
Converts predictions to heatmap:
  - Normalize pixel values to 0-255
  - Map to HSL colors (blue→red)
  - Create canvas image
  - Encode as PNG
        ▼
Renders:
  - Original image (left)
  - Segmentation mask (right)
  - Description text (center)
  - Activity log entry
        ▼
Speaks description with Web Audio API
        ▼
User sees result + hears audio ✓
```

---

## Error Flow Diagram

### Network/Server Error

```
User uploads image
        ▼
POST /api/predict
        ▼
Backend error (500, timeout, etc)
        ▼
Frontend receives error
        ▼
[1st Retry?] YES → Wait 1s, retry
        ▼
[2nd Retry?] YES → Wait 2s, retry
        ▼
[3rd Retry?] YES → Wait 3s, retry
        ▼
[All retries failed] → Stop
        ▼
Show error banner:
"❌ Failed to connect. Ensure backend
   running on http://localhost:5000"
        ▼
Add to activity log
        ▼
User can:
  ├─ Fix backend
  ├─ Try again
  ├─ Upload different image
  └─ Try later
```

---

## Component Hierarchy

```
App (Router)
├── Routes
│   ├── "/" → Landing
│   ├── "/about" → About
│   └── "/app" → AppPage
│
└── AppPage (Main Component)
    ├── State
    │   ├── originalImage: string | null
    │   ├── maskImage: string | null
    │   ├── output: string
    │   ├── isLoading: boolean
    │   ├── processingProgress: 0-100
    │   ├── messages: Message[]
    │   ├── predictions: any
    │   ├── backendStatus: string
    │   └── UI toggles
    │
    ├── Effects
    │   ├── useEffect (camera init + backend health)
    │   └── useEffect (auto-capture interval)
    │
    ├── Handlers
    │   ├── handleUpload()
    │   ├── captureFrame()
    │   ├── processPrediction()
    │   ├── startListening()
    │   └── processVoiceCommand()
    │
    └── Render
        ├── Top Bar
        │   ├── Logo + Title
        │   ├── Backend Status
        │   └── About Button
        │
        ├── Error Banner (conditional)
        │
        ├── Main Grid (2 cols)
        │   ├── Left Panel
        │   │   ├── Camera/Image Viewer
        │   │   │   └─ Loading Overlay (conditional)
        │   │   ├── Control Buttons
        │   │   │   ├─ Upload Label
        │   │   │   └─ Capture Button
        │   │   └─ Settings Checkboxes
        │   │
        │   └── Right Panel
        │       ├── Segmentation Mask (conditional)
        │       ├── Results Card
        │       │   └─ Description + Timestamp
        │       └─ Activity Log
        │
        ├── Voice Button (floating)
        │
        ├── Listening Indicator Modal (conditional)
        │
        ├── About Modal (conditional)
        │
        └─ Styles (animations, media queries)
```

---

## API Contract

### Request/Response Format

```typescript
// Health Check
GET /api/health
→ {
    status: "healthy" | "error",
    model_loaded: true | false,
    device: "cuda:0" | "cpu" | "cuda:1"
  }

// Prediction
POST /api/predict
← {
    image: "data:image/jpeg;base64,..."
  }
→ {
    success: true,
    predictions: number[][],     // 2D array [height][width]
    shape: [number, number],      // [height, width]
    description: string,          // "Detected: X, Y, Z"
    timestamp: string             // ISO 8601
  }
  
  // On Error:
  {
    error: string  // "No image provided" etc
  }
  Status: 400 | 500
```

---

## State Machine

```
┌─────────────┐
│   INITIAL   │
└──────┬──────┘
       │ componentMount
       ▼
┌─────────────────────────────┐
│  CHECK BACKEND + INIT CAM   │
└──────┬────────────┬─────────┘
       │            │
  SUCCESS       ERROR
       │            │
       ▼            ▼
┌──────────┐   ┌─────────────┐
│  READY   │   │ ERROR_STATE │◄─┐
└────┬─────┘   └─────────────┘  │
     │                          │
     │ upload/capture           │
     ▼                          │
┌──────────────┐                │
│   LOADING    │ (progress 0→100)
└──────┬───────┘                │
       │                        │
       ├─ SUCCESS → READY ──────┘
       │
       └─ ERROR → ERROR_STATE ──┘
```

---

## Network Diagram

```
Development Setup:
┌─────────────────────────────────────────┐
│         http://localhost:5173           │
│  (Vite dev server with hot reload)      │
│                                         │
│  Proxy: /api/* → localhost:5000         │
└────────────────┬────────────────────────┘
                 │
                 │ Proxied HTTP
                 ▼
        ┌────────────────┐
        │ Flask :5000    │
        │ (Backend)      │
        └────────────────┘

Production Setup:
┌─────────────────────────────────────────┐
│         http://localhost:5000           │
│  (Flask serving React build)            │
│                                         │
│  Static: /*, /index.html                │
│  API: /api/*                            │
└────────────────┬────────────────────────┘
                 │
                 └─ Same Process
```

---

## File Size & Performance

```
Frontend Bundle (Production):
├── React          ~40KB
├── React Router   ~20KB
├── App Code       ~30KB
├── Total (gzip)   ~90KB
└── Initial Load   ~1-2s

Backend Model:
├── trained_model.pth  ~50-100MB (disk)
├── Loaded to VRAM      ~500-800MB (GPU)
└── CPU fallback        ~1-2GB (RAM)

Inference Time:
├── GPU (CUDA)          ~0.5-1s
├── CPU                 ~2-5s
├── Network roundtrip   ~0.5-1s
├── Frontend render     ~0.2-0.5s
└── Total               ~1-8s
```

---

## Browser APIs Used

```
┌─────────────────────────────────────────┐
│     Browser APIs & Capabilities         │
├─────────────────────────────────────────┤
│                                         │
│ MediaDevices API                        │
│  ├─ getUserMedia()  - Camera access     │
│  └─ getDisplayMedia() - Screen capture  │
│                                         │
│ Canvas API                              │
│  ├─ drawImage()      - Draw video frame │
│  ├─ toDataURL()      - Encode to base64 │
│  └─ createImageData() - Pixel manipulation
│                                         │
│ Web Audio API                           │
│  └─ SpeechSynthesisUtterance - TTS      │
│                                         │
│ Web Speech API                          │
│  └─ SpeechRecognition - Voice commands  │
│                                         │
│ Fetch API                               │
│  └─ fetch()         - HTTP requests     │
│                                         │
│ FileReader API                          │
│  └─ readAsDataURL() - File to base64    │
│                                         │
└─────────────────────────────────────────┘
```

---

## Security Layers

```
Frontend:
├─ Input Validation
│  ├─ File type check (image/*)
│  ├─ File size limit (10MB)
│  └─ Base64 encoding
│
├─ Error Handling
│  ├─ No stack traces to user
│  ├─ Generic server errors
│  └─ XSS prevention
│
└─ CORS
   └─ Only allow /api routes

Backend:
├─ Request Validation
│  ├─ Check for image field
│  ├─ Decode base64 safely
│  └─ Image format validation
│
├─ Error Handling
│  ├─ Catch all exceptions
│  ├─ Log to server only
│  └─ Generic error response
│
└─ Rate Limiting (optional)
   └─ Prevent abuse
```

---

**Legend**:
- ▼ = Data flow
- ◄─ = Return/fallback
- ├─ = Branch
- └─ = Terminal point

This architecture ensures:
✅ Clean separation of concerns
✅ Scalable design
✅ Error resilience
✅ User-friendly experience
✅ Production-ready code
