import html2pdf from "html2pdf.js"
import { collection, addDoc } from "firebase/firestore"
import { db } from "./firebase"
import { useState } from "react"
import Groq from "groq-sdk"
import * as pdfjsLib from "pdfjs-dist"
import worker from "pdfjs-dist/build/pdf.worker?url"

pdfjsLib.GlobalWorkerOptions.workerSrc = worker

function ResumeChecker({ user, role }) {

  const [resumeText, setResumeText] = useState("")
  const [fileName, setFileName] = useState("")
  const [feedback, setFeedback] = useState(null)
  const [jobDescription, setJobDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [error, setError] = useState(null)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const [rewrittenResume, setRewrittenResume] = useState(null)
  const [rewriteLoading, setRewriteLoading] = useState(false)

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
      setError("Could not read the PDF. Try a different file.")
    }
    setPdfLoading(false)
  }

  function handleDrop(e) {
    e.preventDefault()
    handlePdfUpload(e.dataTransfer.files[0])
  }

  function handleDragOver(e) {
    e.preventDefault()
  }

  async function handleCheck() {
    if (!resumeText.trim()) return
    setLoading(true)
    setFeedback(null)
    setError(null)
    setRewrittenResume(null)
    setChatMessages([])

    try {
      const groq = getGroq()
      const prompt = `
        You are an expert resume reviewer and ATS specialist.
        Analyze the following resume and respond ONLY with a valid JSON object in exactly this format, no extra text:
        {
          "score": <number from 0-100>,
          "atsScore": <number from 0-100>,
          "atsIssues": ["<ats issue 1>", "<ats issue 2>", "<ats issue 3>"],
          "keywords": ["<keyword 1>", "<keyword 2>", "<keyword 3>"],
          "summary": "<2-3 sentence overall summary>",
          "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
          "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
          "rewrites": [
            { "original": "<weak line>", "rewritten": "<stronger version>" },
            { "original": "<weak line>", "rewritten": "<stronger version>" },
            { "original": "<weak line>", "rewritten": "<stronger version>" }
          ],
          "jobMatch": ${jobDescription.trim() ? `"<match percentage and explanation>"` : `"No job description provided"`}
        }
        Resume:
        ${resumeText}
        ${jobDescription.trim() ? `Job Description:\n${jobDescription}` : ""}
      `
      const result = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.3-70b-versatile",
      })
      const text = result.choices[0].message.content
      const cleaned = text.replace(/```json|```/g, "").trim()
      const parsed = JSON.parse(cleaned)
      setFeedback(parsed)

      await addDoc(collection(db, "analyses"), {
        userId: user.uid,
        fileName: fileName,
        feedback: parsed,
        resumeText: resumeText,
        createdAt: new Date().toISOString(),
      })
    } catch (err) {
      console.error(err)
      setError("Something went wrong. Please check your API key and try again.")
    }
    setLoading(false)
  }

  async function handleRewriteResume() {
    setRewriteLoading(true)
    setRewrittenResume(null)

    try {
      const groq = getGroq()

      // Step 1 — Extract resume into structured JSON
      const extractResult = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are a resume parser. Extract resume content into structured JSON.
            Return ONLY valid JSON, no extra text, no markdown, no code blocks.`
          },
          {
            role: "user",
            content: `Extract this resume into JSON with this exact structure:
            {
              "name": "<full name>",
              "contact": "<email> | <phone> | <location> | <linkedin if present>",
              "summary": "<professional summary>",
              "experience": [
                {
                  "title": "<job title> at <company>",
                  "dates": "<date range>",
                  "bullets": ["<bullet 1>", "<bullet 2>", "<bullet 3>"]
                }
              ],
              "education": [
                {
                  "degree": "<degree> at <institution>",
                  "dates": "<year or date range>"
                }
              ],
              "skills": "<comma separated skills>",
              "sections": [
                {
                  "title": "<any extra section name like Achievements, Projects, Certifications>",
                  "items": [
                    {
                      "title": "<item title if any>",
                      "bullets": ["<bullet 1>", "<bullet 2>"]
                    }
                  ]
                }
              ]
            }

            Resume:
            ${resumeText}`
          }
        ],
        model: "llama-3.3-70b-versatile",
      })

      const extractedText = extractResult.choices[0].message.content
      const extractedCleaned = extractedText.replace(/```json|```/g, "").trim()
      const extracted = JSON.parse(extractedCleaned)

      // Step 2 — Rewrite content only, keeping same structure
      const rewriteResult = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are an expert resume writer and ATS specialist.
            Rewrite ONLY the text content to be more impactful and ATS optimized.
            Keep the EXACT same JSON structure — do not add or remove any fields.
            Return ONLY valid JSON, no extra text, no markdown, no code blocks.`
          },
          {
            role: "user",
            content: `Rewrite this resume content to be more impactful and ATS optimized.
            Fix these ATS issues: ${feedback.atsIssues.join(", ")}
            Add these keywords naturally: ${feedback.keywords.join(", ")}
            Apply these improvements: ${feedback.improvements.join(", ")}
            Keep the EXACT same JSON structure, just improve the words.
            Resume JSON:
            ${JSON.stringify(extracted, null, 2)}`
          }
        ],
        model: "llama-3.3-70b-versatile",
      })

      const rewrittenText = rewriteResult.choices[0].message.content
      const rewrittenCleaned = rewrittenText.replace(/```json|```/g, "").trim()
      const rewritten = JSON.parse(rewrittenCleaned)

      // Step 3 — Inject rewritten content into clean HTML template
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1a1a1a; line-height: 1.6;">

          <div style="text-align: center; margin-bottom: 24px; border-bottom: 2px solid #2563eb; padding-bottom: 16px;">
            <h1 style="font-size: 26px; font-weight: 700; margin: 0 0 6px; color: #1a1a1a;">${rewritten.name}</h1>
            <p style="font-size: 13px; color: #4b5563; margin: 0;">${rewritten.contact}</p>
          </div>

          <div style="margin-bottom: 20px;">
            <h2 style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-bottom: 10px;">Professional Summary</h2>
            <p style="font-size: 13px; color: #374151; margin: 0;">${rewritten.summary}</p>
          </div>

          <div style="margin-bottom: 20px;">
            <h2 style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-bottom: 10px;">Work Experience</h2>
            ${rewritten.experience.map(exp => `
              <div style="margin-bottom: 14px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                  <strong style="font-size: 13px;">${exp.title}</strong>
                  <span style="font-size: 12px; color: #6b7280;">${exp.dates}</span>
                </div>
                <ul style="margin: 4px 0 0 16px; padding: 0;">
                  ${exp.bullets.map(b => `<li style="font-size: 13px; color: #374151; margin-bottom: 3px;">${b}</li>`).join("")}
                </ul>
              </div>
            `).join("")}
          </div>

          <div style="margin-bottom: 20px;">
            <h2 style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-bottom: 10px;">Education</h2>
            ${rewritten.education.map(edu => `
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                <strong style="font-size: 13px;">${edu.degree}</strong>
                <span style="font-size: 12px; color: #6b7280;">${edu.dates}</span>
              </div>
            `).join("")}
          </div>

          <div style="margin-bottom: 20px;">
            <h2 style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-bottom: 10px;">Skills</h2>
            <p style="font-size: 13px; color: #374151; margin: 0;">${rewritten.skills}</p>
          </div>

          ${rewritten.sections && rewritten.sections.length > 0 ? rewritten.sections.map(section => `
            <div style="margin-bottom: 20px;">
              <h2 style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-bottom: 10px;">${section.title}</h2>
              ${section.items && section.items.length > 0 ? section.items.map(item => `
                <div style="margin-bottom: 10px;">
                  ${item.title ? `<strong style="font-size: 13px; display: block; margin-bottom: 4px;">${item.title}</strong>` : ""}
                  ${item.bullets && item.bullets.length > 0 ? `
                    <ul style="margin: 0 0 0 16px; padding: 0;">
                      ${item.bullets.map(b => `<li style="font-size: 13px; color: #374151; margin-bottom: 3px;">${b}</li>`).join("")}
                    </ul>
                  ` : ""}
                </div>
              `).join("") : ""}
            </div>
          `).join("") : ""}

        </div>
      `

      setRewrittenResume(html)

    } catch (err) {
      console.error(err)
    }
    setRewriteLoading(false)
  }

  function handleDownloadPDF() {
    const element = document.getElementById("rewritten-resume-preview")
    const options = {
      margin: [10, 10, 10, 10],
      filename: "optimized-resume.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["avoid-all", "css", "legacy"] }
    }
    html2pdf().set(options).from(element).save()
  }

  async function handleChatSend() {
    if (!chatInput.trim()) return
    const userMessage = { role: "user", content: chatInput }
    const updatedMessages = [...chatMessages, userMessage]
    setChatMessages(updatedMessages)
    setChatInput("")
    setChatLoading(true)

    try {
      const groq = getGroq()
      const result = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are an expert career coach and resume specialist.
            You have already analyzed this resume and given it a score of ${feedback?.score}/100 and an ATS score of ${feedback?.atsScore}/100.
            Here is the resume you analyzed:
            ${resumeText}
            Help the user improve their resume, ATS score, and job application.
            When asked to rewrite something, provide the full rewritten version.
            Keep responses clear, specific and actionable.
            IMPORTANT: If the user asks you to rewrite or update their resume, provide the complete rewritten resume and end your response with the marker: [RESUME_DOWNLOAD_READY]`
          },
          ...updatedMessages.map(m => ({
            role: m.role === "ai" ? "assistant" : "user",
            content: m.content
          }))
        ],
        model: "llama-3.3-70b-versatile",
      })

      const text = result.choices[0].message.content
      const hasResume = text.includes("[RESUME_DOWNLOAD_READY]")
      const cleanText = text.replace("[RESUME_DOWNLOAD_READY]", "").trim()

      setChatMessages([...updatedMessages, {
        role: "ai",
        content: cleanText,
        hasDownload: hasResume,
      }])
    } catch (err) {
      console.error(err)
      setChatMessages([...updatedMessages, { role: "ai", content: "Sorry something went wrong. Try again!" }])
    }
    setChatLoading(false)
  }

  function handleDownloadPDFFromText(text) {
    const wrapper = document.createElement("div")
    wrapper.style.fontFamily = "Arial, sans-serif"
    wrapper.style.padding = "40px"
    wrapper.style.color = "#1a1a1a"
    wrapper.style.lineHeight = "1.6"
    wrapper.style.fontSize = "13px"
    wrapper.style.whiteSpace = "pre-wrap"
    wrapper.innerText = text

    const options = {
      margin: [10, 10, 10, 10],
      filename: "updated-resume.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
    }
    html2pdf().set(options).from(wrapper).save()
  }

  const styles = {
    page: {
      minHeight: "100vh",
      background: "#0f0f13",
      color: "#e8e8f0",
      fontFamily: "'Inter', sans-serif",
      padding: "2rem 1rem",
    },
    container: { maxWidth: 720, margin: "0 auto" },
    badge: {
      display: "inline-block",
      background: "#1e1b4b",
      color: "#a78bfa",
      fontSize: 12,
      padding: "4px 12px",
      borderRadius: 20,
      marginBottom: 16,
      border: "1px solid #3730a3",
    },
    heading: {
      fontSize: "clamp(24px, 5vw, 36px)",
      fontWeight: 700,
      margin: "0 0 8px",
      background: "linear-gradient(90deg, #a78bfa, #60a5fa)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
    },
    subheading: { color: "#6b7280", fontSize: 15, marginBottom: 32 },
    card: {
      background: "#18181f",
      border: "1px solid #2a2a35",
      borderRadius: 16,
      padding: 24,
      marginBottom: 16,
    },
    label: {
      fontSize: 12,
      fontWeight: 600,
      color: "#6b7280",
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 12,
      display: "block",
    },
    dropZone: {
      border: "2px dashed #2a2a35",
      borderRadius: 12,
      padding: "40px 20px",
      textAlign: "center",
      cursor: "pointer",
      transition: "border-color 0.2s",
      background: "#0f0f13",
    },
    uploadIcon: { fontSize: 36, marginBottom: 12 },
    uploadText: { fontSize: 15, color: "#9ca3af", marginBottom: 6 },
    uploadSubtext: { fontSize: 13, color: "#4b5563" },
    fileSuccess: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      background: "#0f1a0f",
      border: "1px solid #22c55e",
      borderRadius: 10,
      padding: "12px 16px",
      marginTop: 12,
    },
    textarea: {
      width: "100%",
      background: "#0f0f13",
      border: "1px solid #2a2a35",
      borderRadius: 10,
      color: "#e8e8f0",
      fontSize: 14,
      padding: 14,
      resize: "vertical",
      fontFamily: "inherit",
      lineHeight: 1.6,
      boxSizing: "border-box",
      outline: "none",
    },
    button: {
      width: "100%",
      padding: "14px",
      background: resumeText.trim() && !loading
        ? "linear-gradient(90deg, #7c3aed, #2563eb)" : "#1f1f2e",
      color: resumeText.trim() && !loading ? "#fff" : "#4b5563",
      border: "none",
      borderRadius: 10,
      fontSize: 16,
      fontWeight: 600,
      cursor: resumeText.trim() && !loading ? "pointer" : "not-allowed",
      marginTop: 8,
      letterSpacing: 0.3,
    },
    resultsCard: {
      background: "#18181f",
      border: "1px solid #2a2a35",
      borderRadius: 16,
      padding: 24,
      marginTop: 24,
    },
    scoreCircle: {
      width: 80,
      height: 80,
      borderRadius: "50%",
      background: "linear-gradient(135deg, #7c3aed, #2563eb)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 26,
      fontWeight: 700,
      color: "#fff",
      flexShrink: 0,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: 600,
      color: "#7c3aed",
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 12,
      marginTop: 28,
    },
    strengthItem: {
      background: "#0f1a0f",
      border: "1px solid #1a3a1a",
      borderLeft: "3px solid #22c55e",
      borderRadius: 8,
      padding: "10px 14px",
      fontSize: 14,
      color: "#d1d5db",
      marginBottom: 8,
    },
    improvementItem: {
      background: "#1a0f0f",
      border: "1px solid #3a1a1a",
      borderLeft: "3px solid #ef4444",
      borderRadius: 8,
      padding: "10px 14px",
      fontSize: 14,
      color: "#d1d5db",
      marginBottom: 8,
    },
    rewriteCard: {
      background: "#0f0f13",
      border: "1px solid #2a2a35",
      borderRadius: 10,
      padding: 16,
      marginBottom: 12,
    },
    originalLine: {
      fontSize: 13,
      color: "#6b7280",
      marginBottom: 10,
      textDecoration: "line-through",
    },
    rewrittenLine: { fontSize: 14, color: "#a78bfa", fontWeight: 500 },
    errorBox: {
      background: "#1a0f0f",
      border: "1px solid #ef4444",
      borderRadius: 10,
      padding: 16,
      color: "#ef4444",
      fontSize: 14,
      marginTop: 16,
    },
    jobMatchBox: {
      background: "#0f0f1a",
      border: "1px solid #3730a3",
      borderRadius: 10,
      padding: 16,
      color: "#a78bfa",
      fontSize: 14,
      lineHeight: 1.7,
    },
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        <div style={styles.badge}>✦ AI Powered by Groq</div>
        <h1 style={styles.heading}>AI Resume Analyzer</h1>
        <p style={styles.subheading}>
          Upload your resume and get instant AI feedback, ATS score, and rewrite suggestions
        </p>

        <div style={styles.card}>
          <label style={styles.label}>Upload Resume (PDF)</label>
          <div
            style={styles.dropZone}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => document.getElementById("fileInput").click()}
          >
            <div style={styles.uploadIcon}>📄</div>
            <div style={styles.uploadText}>
              {pdfLoading ? "Reading PDF..." : "Drag & drop your PDF here"}
            </div>
            <div style={styles.uploadSubtext}>or click to browse</div>
          </div>
          <input
            id="fileInput"
            type="file"
            accept=".pdf"
            style={{ display: "none" }}
            onChange={(e) => handlePdfUpload(e.target.files[0])}
          />
          {fileName && !pdfLoading && (
            <div style={styles.fileSuccess}>
              <span style={{ color: "#22c55e", fontSize: 18 }}>✓</span>
              <span style={{ fontSize: 14, color: "#d1d5db" }}>{fileName} — ready to analyse</span>
            </div>
          )}
        </div>

        <div style={styles.card}>
          <label style={styles.label}>Job Description (optional)</label>
          <p style={{ fontSize: 13, color: "#4b5563", marginBottom: 10 }}>
            Paste a job posting to see how well your resume matches it
          </p>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste job description here..."
            rows={5}
            style={styles.textarea}
          />
        </div>

        <button
          onClick={handleCheck}
          disabled={loading || !resumeText.trim()}
          style={styles.button}
        >
          {loading ? (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
              <span style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", display: "inline-block", marginRight: 8, animation: "spin 0.8s linear infinite" }} />
              Analysing your resume...
            </span>
          ) : "Analyse my resume"}
        </button>

        {error && <div style={styles.errorBox}>{error}</div>}

        {feedback && (
          <div style={styles.resultsCard}>

            <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 16 }}>
              <div style={styles.scoreCircle}>{feedback.score}</div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>Resume Score</div>
                <div style={{ fontSize: 13, color: "#6b7280" }}>out of 100</div>
              </div>
            </div>
            <p style={{ color: "#9ca3af", fontSize: 14, lineHeight: 1.7 }}>
              {feedback.summary}
            </p>

            <div style={styles.sectionTitle}>ATS Score</div>
            <div style={{
              display: "flex", alignItems: "center", gap: 16,
              background: "#0f0f13", border: "1px solid #2a2a35",
              borderRadius: 10, padding: 16, marginBottom: 12,
            }}>
              <div style={{
                width: 60, height: 60, borderRadius: "50%",
                background: feedback.atsScore >= 70 ? "#22c55e" : feedback.atsScore >= 50 ? "#f59e0b" : "#ef4444",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, fontWeight: 700, color: "#fff", flexShrink: 0,
              }}>
                {feedback.atsScore}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>ATS Compatibility</div>
                <div style={{ fontSize: 13, color: feedback.atsScore >= 70 ? "#22c55e" : feedback.atsScore >= 50 ? "#f59e0b" : "#ef4444" }}>
                  {feedback.atsScore >= 70 ? "Good — likely to pass ATS filters" : feedback.atsScore >= 50 ? "Average — needs some improvements" : "Poor — likely to be filtered out"}
                </div>
              </div>
            </div>

            <div style={styles.sectionTitle}>ATS Issues</div>
            {feedback.atsIssues.map((issue, i) => (
              <div key={i} style={styles.improvementItem}>⚠ {issue}</div>
            ))}

            <button
              onClick={handleRewriteResume}
              disabled={rewriteLoading}
              style={{
                width: "100%", padding: "14px",
                background: rewriteLoading ? "#1f1f2e" : "linear-gradient(90deg, #059669, #0891b2)",
                color: rewriteLoading ? "#4b5563" : "#fff",
                border: "none", borderRadius: 10, fontSize: 15, fontWeight: 600,
                cursor: rewriteLoading ? "not-allowed" : "pointer",
                marginTop: 16, letterSpacing: 0.3,
              }}
            >
              {rewriteLoading ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                  <span style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", display: "inline-block", marginRight: 8, animation: "spin 0.8s linear infinite" }} />
                  Rewriting your resume for ATS...
                </span>
              ) : "Rewrite my resume for ATS"}
            </button>

            {rewrittenResume && (
              <div style={{
                marginTop: 16,
                background: "#0f0f13",
                border: "1px solid #059669",
                borderRadius: 12,
                padding: 20,
              }}>
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "center", marginBottom: 16,
                }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#059669" }}>
                    ATS Optimized Resume
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => navigator.clipboard.writeText(rewrittenResume)}
                      style={{
                        background: "#1e1b4b", border: "1px solid #3730a3",
                        borderRadius: 8, padding: "6px 14px",
                        fontSize: 13, color: "#a78bfa", cursor: "pointer",
                      }}
                    >
                      Copy HTML
                    </button>
                    <button
                      onClick={handleDownloadPDF}
                      style={{
                        background: "linear-gradient(90deg, #059669, #0891b2)",
                        border: "none", borderRadius: 8, padding: "6px 14px",
                        fontSize: 13, color: "#fff", cursor: "pointer", fontWeight: 600,
                      }}
                    >
                      Download PDF
                    </button>
                  </div>
                </div>
                <div
                  id="rewritten-resume-preview"
                  style={{ background: "#fff", borderRadius: 8, overflow: "hidden" }}
                  dangerouslySetInnerHTML={{ __html: rewrittenResume }}
                />
              </div>
            )}

            <div style={styles.sectionTitle}>Keywords Found</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {feedback.keywords.map((keyword, i) => (
                <div key={i} style={{
                  background: "#1e1b4b", border: "1px solid #3730a3",
                  borderRadius: 20, padding: "4px 12px",
                  fontSize: 13, color: "#a78bfa",
                }}>
                  {keyword}
                </div>
              ))}
            </div>

            <div style={styles.sectionTitle}>Strengths</div>
            {feedback.strengths.map((s, i) => (
              <div key={i} style={styles.strengthItem}>✓ {s}</div>
            ))}

            <div style={styles.sectionTitle}>Areas to Improve</div>
            {feedback.improvements.map((s, i) => (
              <div key={i} style={styles.improvementItem}>✗ {s}</div>
            ))}

            <div style={styles.sectionTitle}>AI Rewrite Suggestions</div>
            {feedback.rewrites.map((item, i) => (
              <div key={i} style={styles.rewriteCard}>
                <div style={styles.originalLine}>Before: {item.original}</div>
                <div style={styles.rewrittenLine}>After: {item.rewritten}</div>
              </div>
            ))}

            {jobDescription.trim() && (
              <>
                <div style={styles.sectionTitle}>Job Description Match</div>
                <div style={styles.jobMatchBox}>{feedback.jobMatch}</div>
              </>
            )}

            <div style={styles.sectionTitle}>Chat with AI about your resume</div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {[
                "How can I improve my ATS score?",
                "Rewrite my summary section",
                "What keywords am I missing?",
                "Update my entire resume",
              ].map((suggestion, i) => (
                <div
                  key={i}
                  onClick={() => setChatInput(suggestion)}
                  style={{
                    background: "#1e1b4b", border: "1px solid #3730a3",
                    borderRadius: 20, padding: "6px 14px",
                    fontSize: 13, color: "#a78bfa", cursor: "pointer",
                  }}
                >
                  {suggestion}
                </div>
              ))}
            </div>

            <div style={{
              background: "#0f0f13", border: "1px solid #2a2a35",
              borderRadius: 10, padding: 16, marginBottom: 12,
              minHeight: 120, maxHeight: 400, overflowY: "auto",
            }}>
              {chatMessages.length === 0 && (
                <div style={{ color: "#4b5563", fontSize: 14 }}>
                  Ask anything — or click "Update my entire resume" to get a downloadable PDF
                </div>
              )}

              {chatMessages.map((msg, i) => (
                <div key={i} style={{
                  marginBottom: 16, display: "flex", flexDirection: "column",
                  alignItems: msg.role === "user" ? "flex-end" : "flex-start",
                }}>
                  <div style={{
                    fontSize: 11, color: "#4b5563", marginBottom: 4,
                    textAlign: msg.role === "user" ? "right" : "left",
                  }}>
                    {msg.role === "user" ? "You" : "AI Coach"}
                  </div>
                  <div style={{
                    maxWidth: "85%", padding: "12px 16px", borderRadius: 12,
                    fontSize: 14, lineHeight: 1.7,
                    background: msg.role === "user" ? "#3730a3" : "#1e1b4b",
                    color: msg.role === "user" ? "#fff" : "#c4b5fd",
                    borderBottomRightRadius: msg.role === "user" ? 4 : 12,
                    borderBottomLeftRadius: msg.role === "ai" ? 4 : 12,
                    whiteSpace: "pre-wrap",
                  }}>
                    {msg.content}
                  </div>
                  {msg.role === "ai" && msg.hasDownload && (
                    <button
                      onClick={() => handleDownloadPDFFromText(msg.content)}
                      style={{
                        marginTop: 8, padding: "8px 16px",
                        background: "linear-gradient(90deg, #059669, #0891b2)",
                        border: "none", borderRadius: 8,
                        fontSize: 13, color: "#fff", cursor: "pointer", fontWeight: 600,
                      }}
                    >
                      Download as PDF
                    </button>
                  )}
                </div>
              ))}

              {chatLoading && (
                <div style={{ color: "#4b5563", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#7c3aed" }} />
                  AI is thinking...
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleChatSend()}
                placeholder="Ask about your resume..."
                style={{
                  flex: 1, background: "#0f0f13", border: "1px solid #2a2a35",
                  borderRadius: 10, color: "#e8e8f0", fontSize: 14,
                  padding: "12px 14px", outline: "none", fontFamily: "inherit",
                }}
              />
              <button
                onClick={handleChatSend}
                disabled={chatLoading || !chatInput.trim()}
                style={{
                  padding: "12px 20px",
                  background: chatInput.trim() && !chatLoading
                    ? "linear-gradient(90deg, #7c3aed, #2563eb)" : "#1f1f2e",
                  color: chatInput.trim() && !chatLoading ? "#fff" : "#4b5563",
                  border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600,
                  cursor: chatInput.trim() && !chatLoading ? "pointer" : "not-allowed",
                }}
              >
                Send
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  )
}

export default ResumeChecker