import { useState } from "react"
import Groq from "groq-sdk"
import * as pdfjsLib from "pdfjs-dist"
import worker from "pdfjs-dist/build/pdf.worker?url"

pdfjsLib.GlobalWorkerOptions.workerSrc = worker

function RecruiterDashboard({ user }) {

  const [resumeText, setResumeText] = useState("")
  const [fileName, setFileName] = useState("")
  const [pdfLoading, setPdfLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [analysis, setAnalysis] = useState(null)

  function getGroq() {
    return new Groq({
      apiKey: import.meta.env.VITE_GROQ_API_KEY,
      dangerouslyAllowBrowser: true
    })
  }

  async function handlePdfUpload(file) {
    if (!file || file.type !== "application/pdf") {
      setError("Please upload a PDF file")
      return
    }
    setPdfLoading(true)
    setError(null)
    setFileName(file.name)
    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      let fullText = ""
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        const pageText = content.items.map(item => item.str).join(" ")
        fullText += pageText + "\n"
      }
      setResumeText(fullText)
    } catch (err) {
      console.error(err)
      setError("Could not read the PDF.")
    }
    setPdfLoading(false)
  }

  function handleDrop(e) {
    e.preventDefault()
    handlePdfUpload(e.dataTransfer.files[0])
  }

  async function handleAnalyze() {
    if (!resumeText.trim()) return
    setLoading(true)
    setAnalysis(null)
    setError(null)
    try {
      const groq = getGroq()
      const prompt = `
        You are an expert recruiter and NLP specialist analyzing a candidate's resume.
        
        Analyze the following resume and respond ONLY with a valid JSON object in exactly this format, no extra text:
        {
          "overallScore": <number 0-100>,
          "atsScore": <number 0-100>,
          "categories": {
            "experience": <number 0-100>,
            "skills": <number 0-100>,
            "education": <number 0-100>,
            "achievements": <number 0-100>,
            "formatting": <number 0-100>,
            "keywords": <number 0-100>
          },
          "nlp": {
  "sentiment": "<Positive/Neutral/Negative>",
  "tone": "<Professional/Casual/Technical/Creative>",
  "clarity": <number 0-100>,
  "quantifiableImpact": {
    "count": <number of numerical achievements found>,
    "examples": ["<example 1>", "<example 2>", "<example 3>"]
  },
  "temporalProgression": {
    "rating": "<Strong/Moderate/Weak>",
    "summary": "<2 sentence summary of career growth and date logic>"
  }
},
          "candidateSummary": "<3-4 sentence professional assessment of the candidate>"
        }

        Resume:
        ${resumeText}
      `
      const result = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.3-70b-versatile",
      })
      const text = result.choices[0].message.content
      const cleaned = text.replace(/```json|```/g, "").trim()
      const parsed = JSON.parse(cleaned)
      setAnalysis(parsed)
    } catch (err) {
      console.error(err)
      setError("Something went wrong. Please try again.")
    }
    setLoading(false)
  }

  return (
    <div style={{
      padding: "2rem",
      fontFamily: "'Inter', sans-serif",
      background: "#080810",
      minHeight: "100vh",
      color: "#e8e8f0",
    }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
          Recruiter Dashboard
        </h1>
        <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 32 }}>
          Deep resume analysis with NLP insights and visual stats
        </p>

        {/* Upload card */}
        <div style={{
          background: "#0d0d14",
          border: "1px solid #1e1e2e",
          borderRadius: 16,
          padding: 24,
          marginBottom: 16,
        }}>
          <div style={{
            fontSize: 12, fontWeight: 600, color: "#6b7280",
            textTransform: "uppercase", letterSpacing: 1, marginBottom: 12,
          }}>
            Upload Candidate Resume
          </div>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => document.getElementById("recruiterFileInput").click()}
            style={{
              border: "2px dashed #1e1e2e",
              borderRadius: 12,
              padding: "32px 20px",
              textAlign: "center",
              cursor: "pointer",
              background: "#080810",
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
            <div style={{ fontSize: 14, color: "#9ca3af", marginBottom: 4 }}>
              {pdfLoading ? "Reading PDF..." : "Drag & drop or click to upload"}
            </div>
            <div style={{ fontSize: 12, color: "#4b5563" }}>PDF files only</div>
          </div>
          <input
            id="recruiterFileInput"
            type="file"
            accept=".pdf"
            style={{ display: "none" }}
            onChange={(e) => handlePdfUpload(e.target.files[0])}
          />
          {fileName && !pdfLoading && (
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "#0f1a0f", border: "1px solid #22c55e",
              borderRadius: 10, padding: "12px 16px", marginTop: 12,
            }}>
              <span style={{ color: "#22c55e" }}>✓</span>
              <span style={{ fontSize: 14, color: "#d1d5db" }}>{fileName}</span>
            </div>
          )}
        </div>

        {/* Analyze button */}
        <button
          onClick={handleAnalyze}
          disabled={loading || !resumeText.trim()}
          style={{
            width: "100%", padding: "14px",
            background: resumeText.trim() && !loading
              ? "linear-gradient(90deg, #7c3aed, #2563eb)" : "#13131f",
            color: resumeText.trim() && !loading ? "#fff" : "#4b5563",
            border: "none", borderRadius: 10, fontSize: 16, fontWeight: 600,
            cursor: resumeText.trim() && !loading ? "pointer" : "not-allowed",
            marginBottom: 24,
          }}
        >
          {loading ? (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
              <span style={{
                width: 18, height: 18,
                border: "2px solid rgba(255,255,255,0.3)",
                borderTop: "2px solid #fff",
                borderRadius: "50%", display: "inline-block",
                marginRight: 8, animation: "spin 0.8s linear infinite"
              }} />
              Analyzing candidate...
            </span>
          ) : "Analyze Resume"}
        </button>

        {error && (
          <div style={{
            background: "#1a0f0f", border: "1px solid #ef4444",
            borderRadius: 10, padding: 16, color: "#ef4444",
            fontSize: 14, marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        {/* Results */}
        {analysis && (
          <div>

            {/* Score cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div style={{
                background: "#0d0d14", border: "1px solid #1e1e2e",
                borderRadius: 12, padding: 20, textAlign: "center",
              }}>
                <div style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: "linear-gradient(135deg, #7c3aed, #2563eb)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, fontWeight: 700, color: "#fff", margin: "0 auto 8px",
                }}>
                  {analysis.overallScore}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#e8e8f0" }}>Overall Score</div>
                <div style={{ fontSize: 11, color: "#4b5563" }}>out of 100</div>
              </div>

              <div style={{
                background: "#0d0d14", border: "1px solid #1e1e2e",
                borderRadius: 12, padding: 20, textAlign: "center",
              }}>
                <div style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: analysis.atsScore >= 70 ? "#059669" : analysis.atsScore >= 50 ? "#d97706" : "#dc2626",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, fontWeight: 700, color: "#fff", margin: "0 auto 8px",
                }}>
                  {analysis.atsScore}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#e8e8f0" }}>ATS Score</div>
                <div style={{ fontSize: 11, color: "#4b5563" }}>compatibility</div>
              </div>
            </div>

            {/* Candidate summary */}
            <div style={{
              background: "#0d0d14", border: "1px solid #1e1e2e",
              borderRadius: 12, padding: 20, marginBottom: 16,
            }}>
              <div style={{
                fontSize: 11, fontWeight: 600, color: "#7c3aed",
                textTransform: "uppercase", letterSpacing: 1, marginBottom: 8,
              }}>
                Candidate Summary
              </div>
              <p style={{ fontSize: 14, color: "#9ca3af", lineHeight: 1.7, margin: 0 }}>
                {analysis.candidateSummary}
              </p>
            </div>

            {/* Category breakdown — simple progress bars */}
            <div style={{
              background: "#0d0d14", border: "1px solid #1e1e2e",
              borderRadius: 12, padding: 20, marginBottom: 16,
            }}>
              <div style={{
                fontSize: 11, fontWeight: 600, color: "#7c3aed",
                textTransform: "uppercase", letterSpacing: 1, marginBottom: 16,
              }}>
                Category Breakdown
              </div>
              {Object.entries(analysis.categories).map(([key, value]) => (
                <div key={key} style={{ marginBottom: 12 }}>
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    marginBottom: 4, fontSize: 13, color: "#9ca3af",
                  }}>
                    <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                    <span style={{ color: "#a78bfa", fontWeight: 600 }}>{value}</span>
                  </div>
                  <div style={{
                    width: "100%", height: 6,
                    background: "#1e1e2e", borderRadius: 3,
                  }}>
                    <div style={{
                      width: `${value}%`, height: "100%",
                      background: "linear-gradient(90deg, #7c3aed, #2563eb)",
                      borderRadius: 3,
                    }} />
                  </div>
                </div>
              ))}
            </div>

            {/* NLP Analysis */}
<div style={{
  background: "#0d0d14", border: "1px solid #1e1e2e",
  borderRadius: 12, padding: 20,
}}>
  <div style={{
    fontSize: 11, fontWeight: 600, color: "#7c3aed",
    textTransform: "uppercase", letterSpacing: 1, marginBottom: 16,
  }}>
    NLP Analysis
  </div>

  {/* Top stats */}
  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
    {[
      { label: "Sentiment", value: analysis.nlp.sentiment },
      { label: "Tone", value: analysis.nlp.tone },
      { label: "Clarity Score", value: analysis.nlp.clarity + "/100" },
    ].map((item, i) => (
      <div key={i} style={{
        background: "#080810", border: "1px solid #1e1e2e",
        borderRadius: 8, padding: "12px 14px",
      }}>
        <div style={{ fontSize: 11, color: "#4b5563", marginBottom: 4 }}>{item.label}</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: "#e8e8f0" }}>{item.value}</div>
      </div>
    ))}
  </div>

  {/* Quantifiable Impact */}
  <div style={{
    background: "#080810", border: "1px solid #1e1e2e",
    borderRadius: 10, padding: 16, marginBottom: 12,
  }}>
    <div style={{ fontSize: 12, fontWeight: 600, color: "#7c3aed", marginBottom: 8 }}>
      Quantifiable Impact
    </div>
    <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 10 }}>
      {analysis.nlp.quantifiableImpact.count} numerical achievements found
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {analysis.nlp.quantifiableImpact.examples.map((ex, i) => (
        <div key={i} style={{
          background: "#1e1b4b", border: "1px solid #3730a3",
          borderRadius: 8, padding: "8px 12px",
          fontSize: 13, color: "#a78bfa",
        }}>
          {ex}
        </div>
      ))}
    </div>
  </div>

  {/* Temporal Progression */}
  <div style={{
    background: "#080810", border: "1px solid #1e1e2e",
    borderRadius: 10, padding: 16,
  }}>
    <div style={{ fontSize: 12, fontWeight: 600, color: "#7c3aed", marginBottom: 8 }}>
      Temporal Progression
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
      <div style={{
        background: analysis.nlp.temporalProgression.rating === "Strong" ? "#0f2a1a" : analysis.nlp.temporalProgression.rating === "Moderate" ? "#2a1a0a" : "#2a0a0a",
        border: `1px solid ${analysis.nlp.temporalProgression.rating === "Strong" ? "#065f46" : analysis.nlp.temporalProgression.rating === "Moderate" ? "#92400e" : "#7f1d1d"}`,
        borderRadius: 20,
        padding: "4px 12px",
        fontSize: 12,
        color: analysis.nlp.temporalProgression.rating === "Strong" ? "#34d399" : analysis.nlp.temporalProgression.rating === "Moderate" ? "#fbbf24" : "#f87171",
        fontWeight: 600,
      }}>
        {analysis.nlp.temporalProgression.rating}
      </div>
    </div>
    <p style={{ fontSize: 13, color: "#9ca3af", lineHeight: 1.7, margin: 0 }}>
      {analysis.nlp.temporalProgression.summary}
    </p>
  </div>

</div>

          </div>
        )}

      </div>
    </div>
  )
}

export default RecruiterDashboard