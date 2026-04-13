import { signOut } from "firebase/auth"
import { auth } from "./firebase"

function Navbar({ user, role }) {

  async function handleSignOut() {
    try {
      await signOut(auth)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <nav style={{
      background: "#0d0d14",
      borderBottom: "1px solid #1e1e2e",
      padding: "0 2rem",
      height: 60,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      position: "sticky",
      top: 0,
      zIndex: 100,
    }}>

      {/* Left — logo */}
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
        }}>
          R
        </div>
        <span style={{
          fontSize: 16,
          fontWeight: 700,
          color: "#fff",
        }}>
          ResumeAI
        </span>
      </div>

      {/* Right — user info + sign out */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>

        {/* Role badge */}
        {role && (
          <div style={{
            background: role === "student" ? "#1e1b4b" : "#0f2a1a",
            border: `1px solid ${role === "student" ? "#3730a3" : "#065f46"}`,
            borderRadius: 20,
            padding: "4px 12px",
            fontSize: 12,
            color: role === "student" ? "#a78bfa" : "#34d399",
            fontWeight: 600,
            textTransform: "capitalize",
          }}>
            {role}
          </div>
        )}

        {/* User photo */}
        {user?.photoURL && (
          <img
            src={user.photoURL}
            alt="profile"
            style={{ width: 32, height: 32, borderRadius: "50%" }}
          />
        )}

        {/* Sign out button */}
        <button
          onClick={handleSignOut}
          style={{
            background: "transparent",
            border: "1px solid #2a2a35",
            borderRadius: 8,
            padding: "6px 14px",
            fontSize: 13,
            color: "#6b7280",
            cursor: "pointer",
          }}
        >
          Sign out
        </button>

      </div>
    </nav>
  )
}

export default Navbar