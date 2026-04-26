import { signOut } from "firebase/auth"
import { auth } from "./firebase"

function Sidebar({ user, role, activePage, setActivePage, onClose }) {

  async function handleSignOut() {
    try {
      await signOut(auth)
    } catch (err) {
      console.error(err)
    }
  }

  const studentLinks = [
    { id: "analyze", label: "Analyze Resume", icon: "📄" },
    { id: "history", label: "Past Analyses", icon: "📊" },
    { id: "chat", label: "Career Chat", icon: "💬" },
  ]

  const recruiterLinks = [
    { id: "analytics", label: "Analyze Resume", icon: "📄" },
    { id: "nlp", label: "NLP Insights", icon: "🧠" },
  ]

  const links = role === "student" ? studentLinks : recruiterLinks

  return (
    <div style={{
      width: 240,
      minHeight: "100vh",
      background: "#0d0d14",
      borderRight: "1px solid #1e1e2e",
      display: "flex",
      flexDirection: "column",
      fontFamily: "'Inter', sans-serif",
    }}>

      {/* Logo + close button */}
      <div style={{
        padding: "20px",
        borderBottom: "1px solid #1e1e2e",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "linear-gradient(135deg, #7c3aed, #2563eb)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 700,
            fontSize: 14,
            flexShrink: 0,
          }}>
            R
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>ResumeAI</span>
        </div>

        {/* Close button — only shows when onClose is provided */}
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "1px solid #1e1e2e",
              borderRadius: 6,
              color: "#6b7280",
              fontSize: 16,
              cursor: "pointer",
              padding: "2px 8px",
              lineHeight: 1.5,
            }}
          >
            x
          </button>
        )}
      </div>

      {/* Role badge */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #1e1e2e" }}>
        <div style={{
          background: role === "student" ? "#1e1b4b" : "#0f2a1a",
          border: `1px solid ${role === "student" ? "#3730a3" : "#065f46"}`,
          borderRadius: 20,
          padding: "4px 12px",
          fontSize: 12,
          color: role === "student" ? "#a78bfa" : "#34d399",
          fontWeight: 600,
          textTransform: "capitalize",
          display: "inline-block",
        }}>
          {role}
        </div>
      </div>

      {/* Nav links */}
      <div style={{ padding: "12px 12px", flex: 1 }}>
        {links.map((link) => (
          <div
            key={link.id}
            onClick={() => setActivePage(link.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 12px",
              borderRadius: 10,
              cursor: "pointer",
              marginBottom: 4,
              background: activePage === link.id ? "#1e1b4b" : "transparent",
              color: activePage === link.id ? "#a78bfa" : "#6b7280",
              fontSize: 14,
              fontWeight: activePage === link.id ? 600 : 400,
              transition: "all 0.15s",
            }}
            onMouseEnter={e => {
              if (activePage !== link.id) {
                e.currentTarget.style.background = "#13131f"
                e.currentTarget.style.color = "#9ca3af"
              }
            }}
            onMouseLeave={e => {
              if (activePage !== link.id) {
                e.currentTarget.style.background = "transparent"
                e.currentTarget.style.color = "#6b7280"
              }
            }}
          >
            <span style={{ fontSize: 16 }}>{link.icon}</span>
            {link.label}
          </div>
        ))}
      </div>

      {/* User info + sign out */}
      <div style={{
        padding: "16px 20px",
        borderTop: "1px solid #1e1e2e",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 12,
        }}>
          {user?.photoURL && (
            <img
              src={user.photoURL}
              alt="profile"
              style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0 }}
            />
          )}
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#e8e8f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user?.displayName}
            </div>
            <div style={{ fontSize: 11, color: "#4b5563", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user?.email}
            </div>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          style={{
            width: "100%",
            padding: "8px",
            background: "transparent",
            border: "1px solid #1e1e2e",
            borderRadius: 8,
            fontSize: 13,
            color: "#6b7280",
            cursor: "pointer",
          }}
        >
          Sign out
        </button>
      </div>

    </div>
  )
}

export default Sidebar