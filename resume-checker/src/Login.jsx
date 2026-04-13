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
      fontFamily: "'Inter', sans-serif",
    }}>

      {/* Left side — branding */}
      <div style={{
        flex: 1,
        background: "linear-gradient(135deg, #0f0a2e 0%, #0a0a1a 100%)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "60px",
        borderRight: "1px solid #1e1e2e",
      }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 60 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: "linear-gradient(135deg, #7c3aed, #2563eb)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: 18,
            fontWeight: 700,
          }}>
            R
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>ResumeAI</span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: 42,
          fontWeight: 800,
          color: "#fff",
          lineHeight: 1.2,
          marginBottom: 20,
        }}>
          Land your dream job with AI
        </h1>

        <p style={{ color: "#6b7280", fontSize: 16, lineHeight: 1.8, maxWidth: 400 }}>
          Get instant ATS score, AI-powered feedback and a fully rewritten resume in seconds.
        </p>

        {/* Feature list */}
        <div style={{ marginTop: 48, display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            "ATS score and compatibility check",
            "AI rewrite suggestions",
            "Job description matching",
            "Chat with AI career coach",
          ].map((feature, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #7c3aed, #2563eb)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                color: "#fff",
                flexShrink: 0,
              }}>
                v
              </div>
              <span style={{ color: "#9ca3af", fontSize: 14 }}>{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right side — login form */}
      <div style={{
        width: 480,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px",
        flexShrink: 0,
      }}>
        <div style={{ width: "100%", maxWidth: 360 }}>

          <h2 style={{
            fontSize: 26,
            fontWeight: 700,
            color: "#fff",
            marginBottom: 8,
          }}>
            Welcome back
          </h2>

          <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 32 }}>
            Sign in to continue to ResumeAI
          </p>

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
              marginBottom: 24,
            }}
          >
            <span style={{ fontSize: 18 }}>G</span>
            Continue with Google
          </button>

          {/* Divider */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 24,
          }}>
            <div style={{ flex: 1, height: 1, background: "#1e1e2e" }} />
            <span style={{ color: "#4b5563", fontSize: 12 }}>100% free</span>
            <div style={{ flex: 1, height: 1, background: "#1e1e2e" }} />
          </div>

          <p style={{ color: "#4b5563", fontSize: 12, textAlign: "center", lineHeight: 1.6 }}>
            By signing in you agree to our terms of service. No credit card required.
          </p>

        </div>
      </div>

    </div>
  )
}

export default Login