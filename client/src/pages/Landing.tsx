import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const text = "Seeing Beyond Sight — AI-powered real-time spatial awareness.";

const Landing: React.FC = () => {
  const navigate = useNavigate();

  const [show, setShow] = useState(false);
  const [typed, setTyped] = useState("");
  const [i, setI] = useState(0);

  // ⏱️ Auto show after 8 sec
  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 8000);
    return () => clearTimeout(timer);
  }, []);

  // ⌨️ Typing effect
  useEffect(() => {
    if (!show) return;

    if (i < text.length) {
      const t = setTimeout(() => {
        setTyped((prev) => prev + text[i]);
        setI((prev) => prev + 1);
      }, 35);

      return () => clearTimeout(t);
    }
  }, [i, show]);

  // ⏭️ Skip button
  const handleSkip = () => {
    setShow(true);
    setTyped(text);
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        overflow: "hidden",
      }}
    >
      {/* 🎥 VIDEO */}
      <video
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: "absolute",
          width: "100vw",
          height: "100vh",
          objectFit: "cover",
        }}
      >
        <source src="/video/drishti.mp4" type="video/mp4" />
      </video>

      {/* 🌑 OVERLAY */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          zIndex: 10,
        }}
      />

      {/* ⏭️ SKIP */}
      {!show && (
        <button
          onClick={handleSkip}
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            zIndex: 999,
            padding: "10px 16px",
            background: "rgba(255,255,255,0.2)",
            color: "white",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            backdropFilter: "blur(10px)",
          }}
        >
          Skip ⏭️
        </button>
      )}

      {/* ✨ CONTENT */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          color: "white",
          zIndex: 20,
          opacity: show ? 1 : 0,
          transition: "opacity 1s ease",
        }}
      >
        {/* 🔥 TITLE */}
        <h1
          style={{
            fontSize: "90px",
            fontWeight: 800,
            letterSpacing: "4px",
            textTransform: "uppercase",
            textShadow: "0 0 25px rgba(255,255,255,0.8)",
            marginBottom: "20px",
          }}
        >
          DRISHTI AI
        </h1>

        {/* ⌨️ TEXT */}
        <p
          style={{
            fontSize: "20px",
            maxWidth: "600px",
            marginBottom: "30px",
            minHeight: "60px",
          }}
        >
          {typed}
          {show && <span style={{ marginLeft: 5 }}>|</span>}
        </p>

        {/* 🚀 BUTTON */}
        <button
          onClick={() => navigate("/about")}
          style={{
            padding: "14px 30px",
            background: "linear-gradient(135deg,#7c3aed,#9333ea)",
            borderRadius: "12px",
            fontSize: "18px",
            color: "white",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 0 20px rgba(124,58,237,0.6)",
            transition: "0.3s",
          }}
          onMouseEnter={(e) =>
            ((e.target as HTMLButtonElement).style.transform = "scale(1.05)")
          }
          onMouseLeave={(e) =>
            ((e.target as HTMLButtonElement).style.transform = "scale(1)")
          }
        >
          🚀 Launch Drishti
        </button>
      </div>
    </div>
  );
};

export default Landing;