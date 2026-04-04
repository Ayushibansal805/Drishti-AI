import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";

const About: React.FC = () => {
  const navigate = useNavigate();

  const title = "DRISHTI AI";
  const [typed, setTyped] = useState("");
  const [i, setI] = useState(0);

  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const [visible, setVisible] = useState<boolean[]>([false, false, false]);

  // ✍️ Typing animation
  useEffect(() => {
    if (i < title.length) {
      const t = setTimeout(() => {
        setTyped((prev) => prev + title[i]);
        setI((prev) => prev + 1);
      }, 80);
      return () => clearTimeout(t);
    }
  }, [i]);

  // 🌊 Scroll animation
  useEffect(() => {
    const handleScroll = () => {
      cardsRef.current.forEach((card, index) => {
        if (!card) return;

        const rect = card.getBoundingClientRect();

        if (rect.top < window.innerHeight - 100) {
          setVisible((prev) => {
            const updated = [...prev];
            updated[index] = true;
            return updated;
          });
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const cardStyle: React.CSSProperties = {
  flex: "1 1 300px",
  maxWidth: "320px",
  padding: 25,
  borderRadius: 20,
  background: "rgba(255,255,255,0.05)",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.1)",
  transition: "all 0.6s ease",
  cursor: "pointer",
  fontFamily: "Inter, sans-serif",
  lineHeight: 1.6,

  // 🔥 ADD THIS
  boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
};

  return (
    <div
  style={{
    minHeight: "100vh",

    // ✅ FIXED BACKGROUND
    backgroundImage: `
      linear-gradient(rgba(10,10,20,0.75), rgba(10,10,20,0.85)),
      url("/ai-bg.jpg")
    `,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",

    color: "white",
    padding: "40px 20px",
    textAlign: "center",
  }}
>
    
      {/* 🔥 HEADER */}
      <div style={{ marginBottom: 20, marginTop: -20 }}>
        <img
          src="/logo.png"
          style={{
            width: 100,
            marginBottom: 10,
            filter: "drop-shadow(0 0 25px rgba(124,58,237,0.9))",
          }}
        />

        <h1
          style={{
            fontSize: "60px",
            fontWeight: 800,
            letterSpacing: "3px",
            marginBottom: "5px",
            fontFamily: "Orbitron, sans-serif",
          }}
        >
          {typed}
          <span style={{ opacity: 0.6 }}>|</span>
        </h1>

        <p style={{ opacity: 0.7 }}>Seeing Beyond Sight</p>
      </div>

      {/* 🔥 CARDS */}
      <div
        style={{
          display: "flex",
          gap: 25,
          flexWrap: "wrap",
          justifyContent: "center",
          marginTop: 20,
        }}
      >
        {/* CARD 1 */}
        <div
          ref={(el) => (cardsRef.current[0] = el)}
          style={{
            ...cardStyle,
            opacity: visible[0] ? 1 : 0,
            transform: visible[0]
              ? "translateY(0)"
              : "translateY(60px)",
          }}
          onMouseEnter={(e) => {
  e.currentTarget.style.transform = "translateY(0) scale(1.05)";
  e.currentTarget.style.boxShadow =
    "0 20px 60px rgba(124,58,237,0.5)";
}}
onMouseLeave={(e) => {
  e.currentTarget.style.transform = visible[0]
    ? "translateY(0)"
    : "translateY(60px)";
  e.currentTarget.style.boxShadow =
    "0 10px 40px rgba(0,0,0,0.6)";
}}
        >
          <h3 style={{marginBottom: 10}}>🔍 About Drishti</h3>
          <p style={{textAlign: "justify"}}>
            Drishti AI is an advanced spatial intelligence system designed to
            assist visually impaired individuals by providing real-time
            environmental awareness.
            textAlign: "justify"
          </p>

          <p style={{ marginTop: 10, textAlign:"justify" }}>
            It uses computer vision and AI models to interpret surroundings and
            convert them into meaningful insights.

          </p>
        </div>

        {/* CARD 2 */}
        <div
          ref={(el) => (cardsRef.current[1] = el)}
          style={{
            ...cardStyle,
            opacity: visible[1] ? 1 : 0,
            transform: visible[1]
              ? "translateY(0)"
              : "translateY(60px)",
          }}
          onMouseEnter={(e) => {
  e.currentTarget.style.transform = "translateY(0) scale(1.05)";
  e.currentTarget.style.boxShadow =
    "0 20px 60px rgba(124,58,237,0.5)";
}}
onMouseLeave={(e) => {
  e.currentTarget.style.transform = visible[0]
    ? "translateY(0)"
    : "translateY(60px)";
  e.currentTarget.style.boxShadow =
    "0 10px 40px rgba(0,0,0,0.6)";
}}
        >
          <h3 style={{marginBottom: 10}}>🚀 Features</h3>
          <p style={{textAlign:"justify"}}>• Real-time object detection</p>
          <p style={{textAlign:"justify"}}>• Depth estimation</p>
          <p style={{textAlign:"justify"}}>• Spatial awareness (left/right/front)</p>
          <p style={{textAlign:"justify"}}>• Voice assistant interaction</p>
          <p style={{textAlign:"justify"}}>• Image-based detection</p>
        </div>

        {/* CARD 3 */}
        <div
          ref={(el) => (cardsRef.current[2] = el)}
          style={{
            ...cardStyle,
            opacity: visible[2] ? 1 : 0,
            transform: visible[2]
              ? "translateY(0)"
              : "translateY(60px)",
          }}
          onMouseEnter={(e) => {
  e.currentTarget.style.transform = "translateY(0) scale(1.05)";
  e.currentTarget.style.boxShadow =
    "0 20px 60px rgba(124,58,237,0.5)";
}}
onMouseLeave={(e) => {
  e.currentTarget.style.transform = visible[0]
    ? "translateY(0)"
    : "translateY(60px)";
  e.currentTarget.style.boxShadow =
    "0 10px 40px rgba(0,0,0,0.6)";
}}
        >
          <h3 style={{marginBottom: 10}}>💡 Uses & Impact</h3>
          <p style={{textAlign: "justify"}}>
            Drishti helps users safely navigate environments by detecting
            obstacles and providing real-time audio guidance.
          </p>

          <p style={{ marginTop: 10, textAlign: "justify" }}>
            It enhances independence, safety, and confidence for visually
            impaired individuals.
          </p>
        </div>
      </div>

      {/* 🚀 BUTTON */}
      <button
  onClick={() => navigate("/app")}
  style={{
    position: "fixed",   // ✅ ALWAYS VISIBLE
    bottom: 30,
    left: "50%",
    transform: "translateX(-50%)",

    padding: "16px 40px",
    fontSize: "18px",
    borderRadius: "14px",
    background: "linear-gradient(135deg,#7c3aed,#9333ea)",
    color: "white",
    border: "none",
    cursor: "pointer",
    boxShadow: "0 0 25px rgba(124,58,237,0.7)",
    zIndex: 999,
    transition: "0.3s",
  }}
  onMouseEnter={(e) =>
    (e.currentTarget.style.transform =
      "translateX(-50%) scale(1.08)")
  }
  onMouseLeave={(e) =>
    (e.currentTarget.style.transform =
      "translateX(-50%) scale(1)")
  }
>
  🚀 Open Drishti
</button>
    </div>
  );
};

export default About;