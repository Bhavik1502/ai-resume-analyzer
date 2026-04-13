import { doc, updateDoc } from "firebase/firestore"
import { db } from "./firebase"

function RoleSelect({ user, onRoleSelected }) {

  async function handleRoleSelect(role) {
    try {
      await updateDoc(doc(db, "users", user.uid), {
        role: role
      })
      onRoleSelected(role)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080810",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Inter', sans-serif",
      padding: "2rem 1rem",
    }}>

      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 48 }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 9,
          background: "linear-gradient(135deg, #7c3aed, #2563eb)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontWeight: 700,
          fontSize: 16,
        }}>
          R
        </div>
        <span style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>ResumeAI</span>
      </div>

      {/* Heading */}
      <h1 style={{
        fontSize: 32,
        fontWeight: 800,
        color: "#fff",
        marginBottom: 8,
        textAlign: "center",
      }}>
        How are you using ResumeAI?
      </h1>

      <p style={{
        color: "#6b7280",
        fontSize: 15,
        marginBottom: 48,
        textAlign: "center",
      }}>
        We'll personalize your experience based on your role
      </p>

      {/* Role cards */}
      <div style={{
        display: "flex",
        gap: 20,
        flexWrap: "wrap",
        justifyContent: "center",
        width: "100%",
        maxWidth: 600,
      }}>

        {/* Student card */}
        <div
          onClick={() => handleRoleSelect("student")}
          style={{
            flex: 1,
            minWidth: 240,
            maxWidth: 280,
            background: "#0d0d14",
            border: "1px solid #1e1e2e",
            borderRadius: 16,
            padding: "32px 24px",
            cursor: "pointer",
            textAlign: "left",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = "#7c3aed"
            e.currentTarget.style.background = "#0f0a2e"
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = "#1e1e2e"
            e.currentTarget.style.background = "#0d0d14"
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 16 }}>🎓</div>
          <div style={{
            fontSize: 18,
            fontWeight: 700,
            color: "#fff",
            marginBottom: 8,
          }}>
            Student
          </div>
          <div style={{
            fontSize: 13,
            color: "#6b7280",
            lineHeight: 1.7,
            marginBottom: 20,
          }}>
            Upload your resume and get ATS score, AI feedback, rewrite suggestions and a downloadable improved resume.
          </div>
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}>
            {["ATS score", "AI rewrites", "PDF download", "Career chat"].map((f, i) => (
              <div key={i} style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13,
                color: "#9ca3af",
              }}>
                <div style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: "#1e1b4b",
                  border: "1px solid #3730a3",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 9,
                  color: "#a78bfa",
                  flexShrink: 0,
                }}>
                  v
                </div>
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Recruiter card */}
        <div
          onClick={() => handleRoleSelect("recruiter")}
          style={{
            flex: 1,
            minWidth: 240,
            maxWidth: 280,
            background: "#0d0d14",
            border: "1px solid #1e1e2e",
            borderRadius: 16,
            padding: "32px 24px",
            cursor: "pointer",
            textAlign: "left",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = "#2563eb"
            e.currentTarget.style.background = "#0a1628"
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = "#1e1e2e"
            e.currentTarget.style.background = "#0d0d14"
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 16 }}>💼</div>
          <div style={{
            fontSize: 18,
            fontWeight: 700,
            color: "#fff",
            marginBottom: 8,
          }}>
            Recruiter
          </div>
          <div style={{
            fontSize: 13,
            color: "#6b7280",
            lineHeight: 1.7,
            marginBottom: 20,
          }}>
            Analyze candidate resumes with ATS scoring, NLP insights, statistics and detailed analytics.
          </div>
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}>
            {["ATS analytics", "NLP analysis", "Candidate stats", "Detailed report"].map((f, i) => (
              <div key={i} style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13,
                color: "#9ca3af",
              }}>
                <div style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: "#0f1e3a",
                  border: "1px solid #1d4ed8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 9,
                  color: "#60a5fa",
                  flexShrink: 0,
                }}>
                  v
                </div>
                {f}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Signed in as */}
      <p style={{ color: "#4b5563", fontSize: 12, marginTop: 40 }}>
        Signed in as {user.email}
      </p>

    </div>
  )
}

export default RoleSelect