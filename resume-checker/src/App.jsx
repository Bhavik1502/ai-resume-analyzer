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

  // When role loads, set the correct default page
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
      <Sidebar
        user={user}
        role={role}
        activePage={activePage}
        setActivePage={setActivePage}
      />
      <div style={{
        marginLeft: 240,
        flex: 1,
        minHeight: "100vh",
        background: "#080810",
      }}>
        {activePage === "analyze" && <ResumeChecker user={user} role={role} activePage={activePage} />}
        {activePage === "history" && <PastAnalyses user={user} />}
        {activePage === "chat" && <CareerChat user={user} />}
        {activePage === "analytics" && <RecruiterDashboard user={user} />}
      </div>
    </div>
  )
}

export default App