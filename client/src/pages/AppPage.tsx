import { useRef, useEffect, useState } from "react";
import { checkHealth, sendPrediction, fileToBase64, canvasToBase64 } from "../services/api";

const AppPage: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [image, setImage] = useState<string | null>(null);
  const [output, setOutput] = useState("🎯 No alerts yet...");
  const [isLoading, setIsLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [backendStatus, setBackendStatus] = useState<string>("Checking...");
  const [predictions, setPredictions] = useState<any>(null);

  // 🎥 Initialize Camera & Check Backend
  useEffect(() => {
    // Check backend health
    checkHealth()
      .then(health => {
        setBackendStatus(`✅ Backend: ${health.status}`);
      })
      .catch(err => {
        setBackendStatus("❌ Backend: Not connected");
        console.error("Backend error:", err);
      });

    // Initialize camera
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(err => {
        setOutput("❌ Camera access denied");
        console.error("Camera error:", err);
      });
  }, []);

  // 📤 Upload Image
  const handleUpload = async (e: any) => {
    const file = e.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
      setOutput("📁 Image uploaded. Processing...");
      
      try {
        const base64 = await fileToBase64(file);
        await processPrediction(base64);
      } catch (error) {
        setOutput("❌ Error: " + (error as Error).message);
      }
    }
  };

  // 📸 Capture from Camera
  const captureFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const context = canvasRef.current.getContext('2d');
    if (!context) return;

    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0);

    const base64 = canvasToBase64(canvasRef.current);
    setImage(base64);
    setOutput("📷 Processing frame...");
    
    await processPrediction(base64);
  };

  // 🧠 Send Prediction to Backend
  const processPrediction = async (imageData: string) => {
    setIsLoading(true);
    try {
      const result = await sendPrediction(imageData);
      setPredictions(result);
      setOutput(`🎯 ${result.description}`);
      
      // Speak the description
      const speech = new SpeechSynthesisUtterance(result.description);
      window.speechSynthesis.speak(speech);
      
      setHistory(prev => [`AI: ${result.description}`, ...prev]);
    } catch (error) {
      const errorMsg = `❌ Error: ${(error as Error).message}`;
      setOutput(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // 🎤 Voice Command
  const startListening = () => {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SR) return alert("Use Chrome or Edge browser");

    const recog = new SR();
    recog.start();

    recog.onstart = () => {
      setListening(true);
      setOutput("🎤 Listening...");
    };

    recog.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setHistory(prev => [`You: ${text}`, ...prev]);
      setOutput(`You said: "${text}"`);
    };

    recog.onend = () => setListening(false);
  };

  return (
    <div style={{
      height: "100vh",
      background: "radial-gradient(circle at center, #1a1a2e, #0f0f0f)",
      color: "white",
      overflow: "hidden",
      position: "relative",
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Hidden Canvas for Frame Capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* HEADER (TOP LEFT) */}
      <div
        onClick={() => setShowAbout(true)}
        style={{
          position: "fixed",
          top: 20,
          left: 20,
          display: "flex",
          alignItems: "center",
          gap: 10,
          cursor: "pointer",
          padding: "8px 12px",
          borderRadius: 12,
          background: "rgba(255,255,255,0.05)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.1)",
          zIndex: 100
        }}
      >
        <h2 style={{ fontSize: 18, margin: 0 }}>👁️ Drishti AI</h2>
      </div>

      {/* STATUS BAR (TOP CENTER) */}
      <div style={{
        position: "fixed",
        top: 20,
        left: "50%",
        transform: "translateX(-50%)",
        padding: "10px 20px",
        borderRadius: 20,
        backdropFilter: "blur(20px)",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        fontSize: 14,
        zIndex: 100
      }}>
        {backendStatus}
      </div>

      {/* EXTRA STATUS (TOP RIGHT) */}
      <div style={{
        position: "fixed",
        top: 20,
        right: 40,
        padding: "12px 20px",
        borderRadius: 16,
        background: "rgba(255,255,255,0.05)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.1)",
        fontSize: 12,
        zIndex: 100
      }}>
        <p style={{ margin: "4px 0" }}>⚡ Real-time</p>
        <p style={{ margin: "4px 0" }}>🧠 Processing</p>
      </div>

      {/* LEFT PANEL - Detection Info */}
      <div style={{
        position: "absolute",
        left: 30,
        top: 100,
        width: 320,
        padding: 20,
        borderRadius: 20,
        background: "rgba(255,255,255,0.05)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.1)"
      }}>
        <h3 style={{ marginTop: 0 }}>📄 Detection Output</h3>
        <p style={{ minHeight: 40, wordWrap: "break-word" }}>
          {output}
        </p>

        <hr style={{ borderColor: "rgba(255,255,255,0.2)" }} />

        <h4>🧠 Processing Status</h4>
        {isLoading ? (
          <p>⏳ Processing image...</p>
        ) : (
          <>
            <p>📊 Ready for input</p>
            <p>🎤 Voice Ready</p>
          </>
        )}

        {predictions && (
          <>
            <hr style={{ borderColor: "rgba(255,255,255,0.2)" }} />
            <h4>Last Prediction:</h4>
            <p style={{ fontSize: 12 }}>
              {predictions.description}
            </p>
          </>
        )}
      </div>

      {/* CAMERA SECTION */}
      <div style={{
        position: "absolute",
        right: 50,
        top: 120,
        width: 420,
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: "0 0 40px rgba(0,0,0,0.6)",
        border: "2px solid rgba(255,255,255,0.1)"
      }}>
        {image ? (
          <img src={image} style={{ width: "100%", height: "auto" }} alt="Captured" />
        ) : (
          <video 
            ref={videoRef}
            autoPlay
            playsInline
            style={{ width: "100%", height: "auto" }}
          />
        )}

        {/* CAMERA OVERLAY */}
        <div style={{
          position: "absolute",
          bottom: 10,
          left: 10,
          background: "rgba(0,0,0,0.7)",
          padding: "6px 10px",
          borderRadius: 8,
          fontSize: 12
        }}>
          {isLoading ? "🔄 Processing..." : "📷 Ready"}
        </div>
      </div>

      {/* CONTROL BUTTONS */}
      <div style={{
        position: "absolute",
        right: 80,
        top: 450,
        display: "flex",
        gap: 10,
        flexDirection: "column"
      }}>
        {/* Upload Button */}
        <label style={{
          background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
          padding: "10px 20px",
          borderRadius: 10,
          cursor: "pointer",
          textAlign: "center",
          fontWeight: "bold",
          transition: "all 0.3s",
          border: "1px solid rgba(255,255,255,0.2)"
        }}>
          📁 Upload
          <input type="file" hidden onChange={handleUpload} />
        </label>

        {/* Capture Button */}
        <button
          onClick={captureFrame}
          disabled={isLoading}
          style={{
            background: "linear-gradient(135deg, #3b82f6, #2563eb)",
            color: "white",
            padding: "10px 20px",
            borderRadius: 10,
            cursor: isLoading ? "not-allowed" : "pointer",
            border: "1px solid rgba(255,255,255,0.2)",
            fontWeight: "bold",
            transition: "all 0.3s",
            opacity: isLoading ? 0.6 : 1
          }}
        >
          📸 Capture
        </button>
      </div>

      {/* RADAR */}
      <div style={{
        position: "fixed",
        bottom: 30,
        left: 30,
        width: 150,
        height: 150,
        borderRadius: "50%",
        border: "1px solid rgba(255,255,255,0.2)",
        backdropFilter: "blur(20px)",
        background: "rgba(0,0,0,0.3)"
      }}>
        <div style={{
          width: 10,
          height: 10,
          background: "#10b981",
          borderRadius: "50%",
          position: "absolute",
          left: "60%",
          top: "40%"
        }} />
      </div>

      {/* DEPTH VISUALIZATION */}
      <div style={{
        position: "fixed",
        bottom: 20,
        left: "50%",
        transform: "translateX(-50%)",
        width: 300,
        height: 10,
        borderRadius: 10,
        background: "rgba(255,255,255,0.1)",
        overflow: "hidden",
        zIndex: 10
      }}>
        <div style={{
          width: "60%",
          height: "100%",
          background: "linear-gradient(90deg,#10b981,#22c55e)",
          animation: "pulseBar 2s infinite"
        }} />
      </div>

      {/* VOICE HISTORY */}
      <div style={{
        position: "fixed",
        bottom: 30,
        left: 200,
        width: 250,
        maxHeight: 200,
        overflowY: "auto",
        padding: 15,
        borderRadius: 20,
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.1)",
        fontSize: 12
      }}>
        <h4 style={{ marginTop: 0 }}>💬 Conversation</h4>
        {history.length === 0 ? (
          <p style={{ color: "rgba(255,255,255,0.5)" }}>No history yet...</p>
        ) : (
          history.slice(0, 5).map((h, i) => (
            <p key={i} style={{ margin: "6px 0", wordBreak: "break-word" }}>
              {h}
            </p>
          ))
        )}
      </div>

      {/* BOT HINT */}
      {showHint && (
        <div style={{
          position: "fixed",
          bottom: 110,
          right: 40,
          padding: "10px 15px",
          borderRadius: 12,
          background: "rgba(0,0,0,0.8)",
          border: "1px solid rgba(255,255,255,0.2)",
          fontSize: 12,
          zIndex: 10
        }}>
          Click to activate voice commands 🎤
        </div>
      )}

      {/* BOT PULSE RING */}
      <div style={{
        position: "fixed",
        bottom: 30,
        right: 40,
        width: 90,
        height: 90,
        borderRadius: "50%",
        background: "rgba(16,185,129,0.2)",
        animation: "pulseRing 2s infinite",
        zIndex: 5
      }} />

      {/* BOT BUTTON */}
      <button
        onClick={startListening}
        onMouseEnter={() => setShowHint(true)}
        onMouseLeave={() => setShowHint(false)}
        style={{
          position: "fixed",
          bottom: 30,
          right: 40,
          width: 70,
          height: 70,
          borderRadius: "50%",
          background: listening 
            ? "linear-gradient(135deg, #ef4444, #dc2626)"
            : "linear-gradient(135deg, #10b981, #059669)",
          fontSize: 24,
          zIndex: 100,
          cursor: "pointer",
          border: "2px solid rgba(255,255,255,0.3)",
          boxShadow: listening ? "0 0 20px rgba(239, 68, 68, 0.5)" : "0 0 20px rgba(16, 185, 129, 0.3)",
          transition: "all 0.3s"
        }}
      >
        {listening ? "🎤" : "🤖"}
      </button>

      {/* LISTENING INDICATOR */}
      {listening && (
        <div style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          padding: 30,
          borderRadius: 20,
          background: "rgba(0,0,0,0.9)",
          border: "2px solid rgba(255,255,255,0.2)",
          zIndex: 200,
          textAlign: "center"
        }}>
          <p style={{ fontSize: 24, margin: "10px 0" }}>🎤 Listening...</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
            Speak your command
          </p>
        </div>
      )}

      {/* ABOUT MODAL */}
      {showAbout && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 300,
            backdropFilter: "blur(5px)"
          }}
          onClick={() => setShowAbout(false)}
        >
          <div
            style={{
              background: "rgba(26,26,46,0.95)",
              padding: 40,
              borderRadius: 20,
              maxWidth: "600px",
              border: "1px solid rgba(255,255,255,0.2)",
              backdropFilter: "blur(20px)"
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2>👁️ About Drishti AI</h2>
            <p>
              Drishti is an AI-powered spatial audio assistive system designed to help 
              visually impaired individuals navigate their surroundings safely and independently.
            </p>
            <h3>✨ Features:</h3>
            <ul>
              <li>🔍 Real-time object detection</li>
              <li>📏 Depth estimation for distance awareness</li>
              <li>📍 Spatial positioning (left/center/right)</li>
              <li>🎧 3D spatial audio feedback</li>
              <li>⚠️ Hazard prioritization</li>
              <li>🎤 Voice command support</li>
            </ul>
            <button
              onClick={() => setShowAbout(false)}
              style={{
                background: "#10b981",
                color: "white",
                padding: "8px 20px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                marginTop: 20
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ANIMATIONS */}
      <style>{`
        @keyframes pulseBar {
          0% { width: 30% }
          50% { width: 80% }
          100% { width: 30% }
        }
        @keyframes pulseRing {
          0% { transform: scale(1); opacity: 0.6 }
          100% { transform: scale(1.8); opacity: 0 }
        }
      `}</style>
    </div>
  );
};

export default AppPage;
