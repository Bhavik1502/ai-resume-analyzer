import { useState, useEffect } from "react"
import { collection, getDocs, query, where, orderBy } from "firebase/firestore"
import { db } from "./firebase"

function PastAnalyses({ user }) {

  // Stores all past analyses fetched from Firestore
  const [analyses, setAnalyses] = useState([])

  // True while fetching from Firestore
  const [loading, setLoading] = useState(true)

  // Stores which analysis is expanded to show full details
  const [expanded, setExpanded] = useState(null)

  // useEffect runs when component loads — fetches past analyses
  useEffect(() => {
    async function fetchAnalyses() {
      try {
        // Query Firestore for all analyses belonging to this user
        const q = query(
          collection(db, "analyses"),
          where("userId", "==", user.uid),
        )

        const snapshot = await getDocs(q)

        // Convert Firestore documents to JavaScript objects
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))

        // Sort by date — newest first
        data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

        setAnalyses(data)
      } catch (err) {
        console.error(err)
      }
      setLoading(false)
    }

    fetchAnalyses()
  }, [user.uid])

  if (loading) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        color: "#6b7280",
        fontFamily: "'Inter', sans-serif",
      }}>
        Loading your analyses...
      </div>
    )
  }

  return (
    <div style={{
      padding: "2rem",
      fontFamily: "'Inter', sans-serif",
      maxWidth: 800,
      margin: "0 auto",
    }}>

      <h1 style={{
        fontSize: 24,
        fontWeight: 700,
        color: "#fff",
        marginBottom: 8,
      }}>
        Past Analyses
      </h1>
      <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 32 }}>
        All your previous resume checks
      </p>

      {/* Empty state */}
      {analyses.length === 0 && (
        <div style={{
          background: "#0d0d14",
          border: "1px solid #1e1e2e",
          borderRadius: 16,
          padding: 40,
          textAlign: "center",
        }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📄</div>
          <div style={{ color: "#6b7280", fontSize: 14 }}>
            No analyses yet — go analyze your first resume!
          </div>
        </div>
      )}

      {/* List of analyses */}
      {analyses.map((analysis) => (
        <div
          key={analysis.id}
          style={{
            background: "#0d0d14",
            border: "1px solid #1e1e2e",
            borderRadius: 16,
            padding: 20,
            marginBottom: 12,
            cursor: "pointer",
          }}
          onClick={() => setExpanded(expanded === analysis.id ? null : analysis.id)}
        >

          {/* Summary row */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>

              {/* Score circle */}
              <div style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #7c3aed, #2563eb)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                fontWeight: 700,
                color: "#fff",
                flexShrink: 0,
              }}>
                {analysis.feedback.score}
              </div>

              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#e8e8f0", marginBottom: 4 }}>
                  {analysis.fileName || "Resume"}
                </div>
                <div style={{ fontSize: 12, color: "#4b5563" }}>
                  {new Date(analysis.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              </div>
            </div>

            {/* ATS score badge */}
            <div style={{
              background: analysis.feedback.atsScore >= 70 ? "#0f2a1a" : analysis.feedback.atsScore >= 50 ? "#2a1a0a" : "#2a0a0a",
              border: `1px solid ${analysis.feedback.atsScore >= 70 ? "#065f46" : analysis.feedback.atsScore >= 50 ? "#92400e" : "#7f1d1d"}`,
              borderRadius: 20,
              padding: "4px 12px",
              fontSize: 12,
              color: analysis.feedback.atsScore >= 70 ? "#34d399" : analysis.feedback.atsScore >= 50 ? "#fbbf24" : "#f87171",
              fontWeight: 600,
            }}>
              ATS {analysis.feedback.atsScore}
            </div>
          </div>

          {/* Expanded details */}
          {expanded === analysis.id && (
            <div style={{ marginTop: 20, borderTop: "1px solid #1e1e2e", paddingTop: 20 }}>

              <p style={{ fontSize: 13, color: "#9ca3af", lineHeight: 1.7, marginBottom: 16 }}>
                {analysis.feedback.summary}
              </p>

              {/* Strengths */}
              <div style={{ fontSize: 11, fontWeight: 600, color: "#7c3aed", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                Strengths
              </div>
              {analysis.feedback.strengths.map((s, i) => (
                <div key={i} style={{
                  background: "#0f1a0f",
                  borderLeft: "3px solid #22c55e",
                  borderRadius: 6,
                  padding: "8px 12px",
                  fontSize: 13,
                  color: "#d1d5db",
                  marginBottom: 6,
                }}>
                  {s}
                </div>
              ))}

              {/* Improvements */}
              <div style={{ fontSize: 11, fontWeight: 600, color: "#7c3aed", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, marginTop: 16 }}>
                Areas to Improve
              </div>
              {analysis.feedback.improvements.map((s, i) => (
                <div key={i} style={{
                  background: "#1a0f0f",
                  borderLeft: "3px solid #ef4444",
                  borderRadius: 6,
                  padding: "8px 12px",
                  fontSize: 13,
                  color: "#d1d5db",
                  marginBottom: 6,
                }}>
                  {s}
                </div>
              ))}

            </div>
          )}

        </div>
      ))}

    </div>
  )
}

export default PastAnalyses