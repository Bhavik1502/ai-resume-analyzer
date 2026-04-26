import { signInWithPopup } from "firebase/auth"
import { auth, googleProvider, db } from "./firebase"
import { doc, setDoc } from "firebase/firestore"

function Login() {

  async function handleGoogleLogin() {
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const user = result.user
      await setDoc(doc(db, "users", user.uid), {
        name: user.displayName,
        email: user.email,
        photo: user.photoURL,
        createdAt: new Date().toISOString(),
      }, { merge: true })
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080810",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Inter', sans-serif",
      padding: "1rem",
    }}>
      <div style={{
        width: "100%",
        maxWidth: 420,
        background: "#0d0d14",
        border: "1px solid #1e1e2e",
        borderRadius: 20,
        padding: "40px 32px",
        textAlign: "center",
      }}>

        {/* Logo */}
        <div style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          background: "linear-gradient(135deg, #7c3aed, #2563eb)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
          fontWeight: 700,
          color: "#fff",
          margin: "0 auto 20px",
        }}>
          R
        </div>

        {/* Heading */}
        <h1 style={{
          fontSize: 26,
          fontWeight: 700,
          background: "linear-gradient(90deg, #a78bfa, #60a5fa)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: 8,
        }}>
          ResumeAI
        </h1>

        <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 32, lineHeight: 1.6 }}>
          AI-powered resume analysis, ATS scoring and career coaching
        </p>

        {/* Feature list */}
        <div style={{ marginBottom: 32, textAlign: "left" }}>
          {[
            "ATS score and compatibility check",
            "AI rewrite suggestions",
            "Job description matching",
            "Chat with AI career coach",
            "Recruiter analytics dashboard",
          ].map((feature, i) => (
            <div key={i} style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 10,
            }}>
              <div style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #7c3aed, #2563eb)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                color: "#fff",
                flexShrink: 0,
              }}>
                v
              </div>
              <span style={{ fontSize: 13, color: "#9ca3af" }}>{feature}</span>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{
          height: 1,
          background: "#1e1e2e",
          marginBottom: 24,
        }} />

        {/* Google Sign In button */}
        <button
          onClick={handleGoogleLogin}
          style={{
            width: "100%",
            padding: "14px 24px",
            background: "#fff",
            color: "#1f1f1f",
            border: "none",
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            marginBottom: 16,
          }}
        >
          <span style={{ fontSize: 18 }}>G</span>
          Continue with Google
        </button>

        <p style={{ color: "#4b5563", fontSize: 12, lineHeight: 1.6 }}>
          Free to use. No credit card required.
        </p>

      </div>
    </div>
  )
}

export default Login