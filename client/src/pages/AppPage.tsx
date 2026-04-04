import { useRef, useEffect, useState, useCallback } from "react";
import { checkHealth, sendPrediction, fileToBase64, canvasToBase64, predictionsToMaskImage } from "../services/api";

interface Message {
  text: string;
  type: 'ai' | 'user' | 'system';
  timestamp: Date;
}

const AppPage: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Image & Output State
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [maskImage, setMaskImage] = useState<string | null>(null);
  const [output, setOutput] = useState("🎯 Ready to process images...");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Processing State
  const [isLoading, setIsLoading] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  
  // Voice & History
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { text: "👋 Welcome to Drishti AI! Upload an image or use your camera to get started.", type: 'system', timestamp: new Date() }
  ]);
  
  // UI State
  const [backendStatus, setBackendStatus] = useState<string>("🔄 Checking...");
  const [predictions, setPredictions] = useState<any>(null);
  const [showAbout, setShowAbout] = useState(false);
  const [useCamera, setUseCamera] = useState(true);
  const [autoCapture, setAutoCapture] = useState(true);
  
  // Camera setup & backend health check
  useEffect(() => {
    // Check backend health
    checkHealth()
      .then(health => {
        setBackendStatus(`✅ Backend Ready (${health.device})`);
        addMessage("Backend connected successfully!", 'system');
      })
      .catch(err => {
        setBackendStatus("❌ Backend: Not Connected");
        setErrorMessage("Backend is not running. Please start the Flask server on port 5000.");
        addMessage(`Failed to connect to backend: ${err.message}`, 'system');
      });

    // Initialize camera
    if (useCamera) {
      navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play();
            };
          }
        })
        .catch(err => {
          setErrorMessage("Camera access denied or not available");
          console.error("Camera error:", err);
          addMessage("Could not access camera", 'system');
        });
    }

    // Cleanup
    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-capture from camera at intervals
  useEffect(() => {
    if (!autoCapture || !useCamera || isLoading) return;

    const interval = setInterval(() => {
      captureFrame();
    }, 3000); // Capture every 3 seconds

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoCapture, useCamera, isLoading]);

  const addMessage = useCallback((text: string, type: 'ai' | 'user' | 'system') => {
    setMessages(prev => [...prev, { text, type, timestamp: new Date() }]);
  }, []);

  // 📤 Upload Image
  const handleUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrorMessage("Please upload a valid image file");
      addMessage("Invalid file type", 'system');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("Image is too large (max 10MB)");
      addMessage("File too large", 'system');
      return;
    }

    setUseCamera(false);
    setOriginalImage(URL.createObjectURL(file));
    setMaskImage(null);
    setOutput("📤 Processing uploaded image...");
    setErrorMessage(null);
    
    try {
      const base64 = await fileToBase64(file);
      await processPrediction(base64);
    } catch (error) {
      const errorMsg = `Error: ${(error as Error).message}`;
      setErrorMessage(errorMsg);
      setOutput(errorMsg);
      addMessage(errorMsg, 'system');
    }
  };

  // 📸 Capture from Camera
  const captureFrame = async () => {
    if (!videoRef.current || !canvasRef.current || isLoading) return;
    
    try {
      const context = canvasRef.current.getContext('2d');
      if (!context) return;

      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);

      const base64 = canvasToBase64(canvasRef.current);
      setOriginalImage(base64);
      setMaskImage(null);
      
      await processPrediction(base64);
    } catch (error) {
      console.error("Capture error:", error);
    }
  };

  // 🧠 Send Prediction to Backend
  const processPrediction = async (imageData: string) => {
    setIsLoading(true);
    setProcessingProgress(0);
    setErrorMessage(null);
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => Math.min(prev + 15, 90));
      }, 200);

      const result = await sendPrediction(imageData);
      
      clearInterval(progressInterval);
      setProcessingProgress(100);

      // Store predictions
      setPredictions(result);

      // Update output
      const description = result.description || "Processing complete";
      setOutput(`📊 ${description}`);
      addMessage(description, 'ai');

      // Generate and display mask image
      if (result.predictions && Array.isArray(result.predictions)) {
        try {
          const maskDataUrl = predictionsToMaskImage(result.predictions);
          if (maskDataUrl) {
            setMaskImage(maskDataUrl);
          }
        } catch (err) {
          console.warn("Could not generate mask visualization:", err);
        }
      }

      // Text-to-speech
      try {
        const utterance = new SpeechSynthesisUtterance(description);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn("Text-to-speech not available:", err);
      }

      // Success feedback
      setTimeout(() => setProcessingProgress(0), 1000);
    } catch (error) {
      const errorMsg = (error as Error).message;
      setErrorMessage(errorMsg);
      setOutput(`❌ Error: ${errorMsg}`);
      addMessage(`Error during processing: ${errorMsg}`, 'system');
      setProcessingProgress(0);
    } finally {
      setIsLoading(false);
    }
  };

  // 🎤 Voice Command
  const startListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SR) {
      setErrorMessage("Voice recognition not supported. Use Chrome or Edge browser.");
      return;
    }

    const recog = new SR();
    recog.lang = 'en-US';
    recog.continuous = false;
    recog.interimResults = false;

    recog.onstart = () => {
      setListening(true);
      setOutput("🎤 Listening...");
    };

    recog.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      addMessage(text, 'user');
      processVoiceCommand(text.toLowerCase());
    };

    recog.onerror = (e: any) => {
      setErrorMessage(`Voice error: ${e.error}`);
      setListening(false);
    };

    recog.onend = () => setListening(false);
    
    try {
      recog.start();
    } catch (err) {
      console.error("Voice recognition error:", err);
      setListening(false);
    }
  };

  // Process voice commands
  const processVoiceCommand = (text: string) => {
    if (text.includes('capture') || text.includes('photo')) {
      captureFrame();
    } else if (text.includes('repeat') || text.includes('again')) {
      if (predictions?.description) {
        const utterance = new SpeechSynthesisUtterance(predictions.description);
        window.speechSynthesis.speak(utterance);
      }
    } else {
      addMessage("Command not recognized. Try 'capture' or 'repeat'.", 'system');
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
      color: "#fff",
      fontFamily: "'Inter', 'system-ui', sans-serif",
      display: "flex",
      flexDirection: "column",
      overflow: "auto"
    }}>
      {/* Hidden Canvas for Frame Capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* TOP BAR */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 24px",
        background: "rgba(0, 0, 0, 0.3)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        backdropFilter: "blur(10px)",
        position: "sticky",
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}
             onClick={() => setShowAbout(true)}>
          <h1 style={{ margin: 0, fontSize: "24px" }}>👁️</h1>
          <div>
            <h2 style={{ margin: "0 0 4px 0", fontSize: "18px", fontWeight: "600" }}>Drishti AI</h2>
            <p style={{ margin: 0, fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>Vision Assistant</p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <div style={{
            padding: "8px 16px",
            borderRadius: "8px",
            background: "rgba(59, 130, 246, 0.1)",
            border: "1px solid rgba(59, 130, 246, 0.3)",
            fontSize: "13px"
          }}>
            {backendStatus}
          </div>
        </div>
      </div>

      {/* ERROR MESSAGE */}
      {errorMessage && (
        <div style={{
          padding: "12px 24px",
          background: "rgba(239, 68, 68, 0.1)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          color: "#fca5a5",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <span>⚠️ {errorMessage}</span>
          <button 
            onClick={() => setErrorMessage(null)}
            style={{ background: "none", border: "none", color: "#fca5a5", cursor: "pointer", fontSize: "18px" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "24px",
        padding: "24px",
        maxWidth: "1400px",
        margin: "0 auto",
        width: "100%",
        boxSizing: "border-box"
      }}>
        {/* LEFT PANEL - Input & Output */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Camera/Image Viewer */}
          <div style={{
            borderRadius: "16px",
            overflow: "hidden",
            background: "rgba(15, 23, 42, 0.8)",
            border: "2px solid rgba(148, 163, 184, 0.2)",
            aspectRatio: "4 / 3",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
            position: "relative"
          }}>
            {originalImage ? (
              <img src={originalImage} alt="Input" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : useCamera ? (
              <video 
                ref={videoRef}
                autoPlay
                playsInline
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div style={{ textAlign: "center", color: "rgba(255,255,255,0.5)" }}>
                <p style={{ fontSize: "48px", margin: "0 0 12px 0" }}>📷</p>
                <p>No image selected</p>
                <p style={{ fontSize: "12px", marginTop: "12px" }}>Upload an image or enable camera</p>
              </div>
            )}

            {/* Loading Overlay */}
            {isLoading && (
              <div style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0, 0, 0, 0.6)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                backdropFilter: "blur(4px)"
              }}>
                <div style={{
                  width: "48px",
                  height: "48px",
                  border: "4px solid rgba(148, 163, 184, 0.2)",
                  borderTopColor: "rgb(59, 130, 246)",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  marginBottom: "16px"
                }} />
                <p style={{ margin: "0 0 12px 0", fontSize: "14px" }}>
                  {Math.round(processingProgress)}% Processing...
                </p>
                <div style={{
                  width: "150px",
                  height: "4px",
                  background: "rgba(148, 163, 184, 0.2)",
                  borderRadius: "2px",
                  overflow: "hidden"
                }}>
                  <div style={{
                    width: `${processingProgress}%`,
                    height: "100%",
                    background: "linear-gradient(90deg, rgb(59, 130, 246), rgb(139, 92, 246))",
                    transition: "width 0.3s ease"
                  }} />
                </div>
              </div>
            )}
          </div>

          {/* Control Buttons */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px"
          }}>
            <label style={{
              background: "linear-gradient(135deg, rgb(34, 197, 94), rgb(22, 163, 74))",
              color: "white",
              padding: "14px 20px",
              borderRadius: "12px",
              cursor: "pointer",
              textAlign: "center",
              fontWeight: "600",
              fontSize: "14px",
              border: "none",
              boxShadow: "0 4px 12px rgba(34, 197, 94, 0.3)",
              transition: "all 0.2s"
            }}>
              📁 Upload
              <input type="file" hidden accept="image/*" onChange={handleUpload} />
            </label>

            <button
              onClick={captureFrame}
              disabled={isLoading || !useCamera}
              style={{
                background: isLoading || !useCamera 
                  ? "rgba(148, 163, 184, 0.3)" 
                  : "linear-gradient(135deg, rgb(59, 130, 246), rgb(37, 99, 235))",
                color: "white",
                padding: "14px 20px",
                borderRadius: "12px",
                border: "none",
                fontWeight: "600",
                fontSize: "14px",
                cursor: isLoading || !useCamera ? "not-allowed" : "pointer",
                boxShadow: isLoading || !useCamera ? "none" : "0 4px 12px rgba(59, 130, 246, 0.3)",
                opacity: isLoading || !useCamera ? 0.6 : 1,
                transition: "all 0.2s"
              }}
            >
              📸 Capture
            </button>
          </div>

          {/* Settings */}
          <div style={{
            background: "rgba(30, 41, 59, 0.6)",
            border: "1px solid rgba(148, 163, 184, 0.2)",
            borderRadius: "12px",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "12px"
          }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <input 
                type="checkbox" 
                checked={autoCapture} 
                onChange={(e) => setAutoCapture(e.target.checked)}
                style={{ cursor: "pointer" }}
              />
              <span style={{ fontSize: "14px" }}>🔄 Auto-capture from camera</span>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <input 
                type="checkbox" 
                checked={useCamera} 
                onChange={(e) => setUseCamera(e.target.checked)}
                style={{ cursor: "pointer" }}
              />
              <span style={{ fontSize: "14px" }}>📹 Use camera input</span>
            </label>
          </div>
        </div>

        {/* RIGHT PANEL - Results & Messages */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Mask Visualization */}
          {maskImage && (
            <div style={{
              borderRadius: "16px",
              overflow: "hidden",
              background: "rgba(15, 23, 42, 0.8)",
              border: "2px solid rgba(148, 163, 184, 0.2)",
              aspectRatio: "4 / 3",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)"
            }}>
              <img src={maskImage} alt="Segmentation Mask" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          )}

          {/* Output Card */}
          <div style={{
            background: "rgba(30, 41, 59, 0.6)",
            border: "1px solid rgba(148, 163, 184, 0.2)",
            borderRadius: "12px",
            padding: "20px",
            minHeight: maskImage ? "auto" : "200px"
          }}>
            <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              {isSpeaking ? "🔊" : "📊"} Results
            </h3>
            <p style={{
              margin: 0,
              fontSize: "16px",
              lineHeight: "1.6",
              color: output.includes("Error") ? "#fca5a5" : "#e2e8f0",
              minHeight: maskImage ? "auto" : "100px"
            }}>
              {output}
            </p>
            {predictions && (
              <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid rgba(148, 163, 184, 0.2)" }}>
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", margin: "0" }}>
                  ⏰ {new Date(predictions.timestamp).toLocaleTimeString()}
                </p>
              </div>
            )}
          </div>

          {/* Messages Panel */}
          <div style={{
            background: "rgba(30, 41, 59, 0.6)",
            border: "1px solid rgba(148, 163, 184, 0.2)",
            borderRadius: "12px",
            padding: "16px",
            maxHeight: "250px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "8px"
          }}>
            <h4 style={{ margin: "0 0 12px 0", fontSize: "14px" }}>💬 Activity Log</h4>
            {messages.slice(-5).reverse().map((msg, idx) => (
              <div key={idx} style={{
                padding: "8px 12px",
                borderRadius: "8px",
                background: msg.type === 'ai' ? "rgba(59, 130, 246, 0.1)" 
                  : msg.type === 'user' ? "rgba(34, 197, 94, 0.1)"
                  : "rgba(148, 163, 184, 0.1)",
                borderLeft: `3px solid ${msg.type === 'ai' ? "rgb(59, 130, 246)" 
                  : msg.type === 'user' ? "rgb(34, 197, 94)"
                  : "rgb(148, 163, 184)"}`,
                fontSize: "12px"
              }}>
                <p style={{ margin: 0, fontSize: "11px", color: "rgba(255,255,255,0.7)" }}>
                  {msg.timestamp.toLocaleTimeString()}
                </p>
                <p style={{ margin: "4px 0 0 0" }}>{msg.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* VOICE BUTTON */}
      <button
        onClick={startListening}
        disabled={listening || isLoading}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          width: "70px",
          height: "70px",
          borderRadius: "50%",
          background: listening 
            ? "linear-gradient(135deg, rgb(239, 68, 68), rgb(220, 38, 38))"
            : "linear-gradient(135deg, rgb(168, 85, 247), rgb(147, 51, 234))",
          color: "white",
          fontSize: "32px",
          border: "3px solid rgba(255, 255, 255, 0.2)",
          cursor: listening || isLoading ? "not-allowed" : "pointer",
          boxShadow: listening ? "0 0 30px rgba(239, 68, 68, 0.5)" : "0 8px 24px rgba(168, 85, 247, 0.4)",
          transition: "all 0.3s",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 50
        }}
        onMouseEnter={(e) => {
          if (!listening && !isLoading) {
            (e.currentTarget as any).style.transform = "scale(1.1)";
          }
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as any).style.transform = "scale(1)";
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
          transform: "translate(-50%, -50%)",
          padding: "32px 40px",
          borderRadius: "16px",
          background: "rgba(0, 0, 0, 0.95)",
          border: "2px solid rgba(59, 130, 246, 0.5)",
          zIndex: 200,
          textAlign: "center",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(10px)"
        }}>
          <p style={{ fontSize: "32px", margin: "0 0 16px 0" }}>🎤</p>
          <p style={{ fontSize: "18px", margin: "0 0 8px 0", fontWeight: "600" }}>Listening...</p>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", margin: 0 }}>Speak your command</p>
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
            background: "rgba(0, 0, 0, 0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 300,
            backdropFilter: "blur(8px)"
          }}
          onClick={() => setShowAbout(false)}
        >
          <div
            style={{
              background: "linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))",
              padding: "40px",
              borderRadius: "16px",
              maxWidth: "600px",
              border: "1px solid rgba(148, 163, 184, 0.2)",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.6)"
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ margin: "0 0 16px 0", fontSize: "28px" }}>👁️ About Drishti AI</h2>
            <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: "1.6" }}>
              Drishti is an AI-powered vision assistant designed to help visually impaired 
              individuals understand their surroundings through real-time image analysis and 
              voice feedback.
            </p>
            
            <h3 style={{ marginTop: "24px", marginBottom: "12px" }}>✨ Features:</h3>
            <ul style={{ marginLeft: "20px", color: "rgba(255,255,255,0.8)", lineHeight: "1.8" }}>
              <li>🔍 Real-time object detection and segmentation</li>
              <li>📊 Visual analysis with segmentation masks</li>
              <li>🎤 Voice commands and audio feedback</li>
              <li>📷 Camera capture and image upload</li>
              <li>⚡ Fast processing with GPU acceleration</li>
              <li>📱 Responsive design for all devices</li>
            </ul>

            <h3 style={{ marginTop: "24px", marginBottom: "12px" }}>🎯 How to Use:</h3>
            <ol style={{ marginLeft: "20px", color: "rgba(255,255,255,0.8)", lineHeight: "1.8" }}>
              <li>Upload an image or use camera to capture</li>
              <li>Wait for AI analysis (progress indicator shows status)</li>
              <li>Results are displayed with audio description</li>
              <li>Use voice commands for hands-free operation</li>
            </ol>

            <button
              onClick={() => setShowAbout(false)}
              style={{
                marginTop: "24px",
                background: "linear-gradient(135deg, rgb(59, 130, 246), rgb(37, 99, 235))",
                color: "white",
                padding: "12px 32px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px",
                boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as any).style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as any).style.transform = "translateY(0)";
              }}
            >
              Got it! 👍
            </button>
          </div>
        </div>
      )}

      {/* STYLES */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* Responsive Design */
        @media (max-width: 1024px) {
          div:has(> *:first-child) {
            grid-template-columns: 1fr !important;
          }
        }
        
        /* Scrollbar styling */
        ::-webkit-scrollbar {
          width: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(148, 163, 184, 0.1);
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.3);
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.5);
        }
      `}</style>
    </div>
  );
};

export default AppPage;
