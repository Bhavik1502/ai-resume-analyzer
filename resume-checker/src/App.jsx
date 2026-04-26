import RecruiterDashboard from "./RecruiterDashboard"
import CareerChat from "./CareerChat"
import PastAnalyses from "./PastAnalyses"
import { useState, useEffect } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "./firebase"
import Sidebar from "./Sidebar"
import Login from "./Login"
import RoleSelect from "./RoleSelect"
import ResumeChecker from "./ResumeChecker"

function App() {

  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activePage, setActivePage] = useState("analyze")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))
        if (userDoc.exists() && userDoc.data().role) {
          setRole(userDoc.data().role)
        }
      } else {
        setUser(null)
        setRole(null)
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (role === "recruiter") {
      setActivePage("analytics")
    } else if (role === "student") {
      setActivePage("analyze")
    }
  }, [role])

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#080810",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#6b7280",
        fontFamily: "'Inter', sans-serif",
      }}>
        Loading...
      </div>
    )
  }

  if (!user) return <Login />
  if (!role) return <RoleSelect user={user} onRoleSelected={setRole} />

  return (
    <div style={{ display: "flex", fontFamily: "'Inter', sans-serif" }}>

      {/* Dark overlay when sidebar is open */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 40,
          }}
        />
      )}

      {/* Sidebar — slides in/out */}
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 50,
        transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.25s ease",
      }}>
        <Sidebar
          user={user}
          role={role}
          activePage={activePage}
          setActivePage={(page) => {
            setActivePage(page)
            setSidebarOpen(false)
          }}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* Main content */}
      <div style={{
        flex: 1,
        minHeight: "100vh",
        background: "#080810",
      }}>

        {/* Top bar with hamburger button */}
        <div style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          background: "#0d0d14",
          borderBottom: "1px solid #1e1e2e",
          padding: "0 16px",
          height: 56,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: "transparent",
              border: "1px solid #1e1e2e",
              borderRadius: 8,
              padding: "6px 10px",
              cursor: "pointer",
              color: "#9ca3af",
              fontSize: 18,
              lineHeight: 1,
            }}
          >
            ☰
          </button>

          <span style={{
            fontSize: 16,
            fontWeight: 700,
            background: "linear-gradient(90deg, #a78bfa, #60a5fa)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            ResumeAI
          </span>

          <div style={{
            marginLeft: "auto",
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
        </div>

        {/* Page content */}
        {activePage === "analyze" && <ResumeChecker user={user} role={role} activePage={activePage} />}
        {activePage === "history" && <PastAnalyses user={user} />}
        {activePage === "chat" && <CareerChat user={user} />}
        {activePage === "analytics" && <RecruiterDashboard user={user} />}
        {activePage === "nlp" && <RecruiterDashboard user={user} />}

      </div>

    </div>
  )
}

export default App