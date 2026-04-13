import { useState } from "react"
import Groq from "groq-sdk"

function CareerChat({ user }) {

  const [messages, setMessages] = useState([
    // Default welcome message from AI
    {
      role: "ai",
      content: `Hi ${user?.displayName?.split(" ")[0] || "there"}! I'm your AI career coach. I can help you with resume tips, interview prep, career advice, job search strategies and more. What would you like to talk about?`
    }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)

  function getGroq() {
    return new Groq({
      apiKey: "your_groq_key_here",
      dangerouslyAllowBrowser: true
    })
  }

  async function handleSend() {
    if (!input.trim()) return

    const userMessage = { role: "user", content: input }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput("")
    setLoading(true)

    try {
      const groq = getGroq()

      const result = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are an expert AI career coach helping job seekers and students. 
            You specialize in resume writing, interview preparation, job search strategies, 
            career planning, salary negotiation, and professional development.
            Keep responses concise, practical and actionable.
            The user's name is ${user?.displayName || "there"}.`
          },
          // Pass full chat history so AI remembers context
          ...updatedMessages.map(m => ({
            role: m.role === "ai" ? "assistant" : "user",
            content: m.content
          }))
        ],
        model: "llama-3.3-70b-versatile",
      })

      const text = result.choices[0].message.content
      setMessages([...updatedMessages, { role: "ai", content: text }])

    } catch (err) {
      console.error(err)
      setMessages([...updatedMessages, { role: "ai", content: "Sorry something went wrong. Try again!" }])
    }

    setLoading(false)
  }

  // Suggested questions to get started
  const suggestions = [
    "How do I prepare for a technical interview?",
    "What should I put in my resume summary?",
    "How do I negotiate my salary?",
    "What are the best job search strategies?",
  ]

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      fontFamily: "'Inter', sans-serif",
      background: "#080810",
    }}>

      {/* Header */}
      <div style={{
        padding: "20px 24px",
        borderBottom: "1px solid #1e1e2e",
        background: "#0d0d14",
      }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
          Career Chat
        </h1>
        <p style={{ fontSize: 13, color: "#6b7280" }}>
          Your personal AI career coach — ask anything
        </p>
      </div>

      {/* Messages area */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}>

        {/* Suggested questions — only show if just the welcome message */}
        {messages.length === 1 && (
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 8,
          }}>
            {suggestions.map((s, i) => (
              <div
                key={i}
                onClick={() => setInput(s)}
                style={{
                  background: "#0d0d14",
                  border: "1px solid #1e1e2e",
                  borderRadius: 20,
                  padding: "8px 16px",
                  fontSize: 13,
                  color: "#9ca3af",
                  cursor: "pointer",
                }}
              >
                {s}
              </div>
            ))}
          </div>
        )}

        {/* Chat messages */}
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: "flex",
            flexDirection: "column",
            alignItems: msg.role === "user" ? "flex-end" : "flex-start",
          }}>

            {/* Label */}
            <div style={{
              fontSize: 11,
              color: "#4b5563",
              marginBottom: 4,
              textAlign: msg.role === "user" ? "right" : "left",
            }}>
              {msg.role === "user" ? "You" : "AI Coach"}
            </div>

            {/* Bubble */}
            <div style={{
              maxWidth: "75%",
              padding: "12px 16px",
              borderRadius: 14,
              fontSize: 14,
              lineHeight: 1.7,
              background: msg.role === "user" ? "linear-gradient(135deg, #7c3aed, #2563eb)" : "#0d0d14",
              color: msg.role === "user" ? "#fff" : "#d1d5db",
              border: msg.role === "ai" ? "1px solid #1e1e2e" : "none",
              borderBottomRightRadius: msg.role === "user" ? 4 : 14,
              borderBottomLeftRadius: msg.role === "ai" ? 4 : 14,
              whiteSpace: "pre-wrap",
            }}>
              {msg.content}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "#4b5563",
            fontSize: 13,
          }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#7c3aed",
            }} />
            AI Coach is typing...
          </div>
        )}

      </div>

      {/* Input area */}
      <div style={{
        padding: "16px 24px",
        borderTop: "1px solid #1e1e2e",
        background: "#0d0d14",
        display: "flex",
        gap: 12,
      }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask your career coach anything..."
          style={{
            flex: 1,
            background: "#080810",
            border: "1px solid #1e1e2e",
            borderRadius: 12,
            color: "#e8e8f0",
            fontSize: 14,
            padding: "12px 16px",
            outline: "none",
            fontFamily: "inherit",
          }}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          style={{
            padding: "12px 24px",
            background: input.trim() && !loading
              ? "linear-gradient(90deg, #7c3aed, #2563eb)"
              : "#13131f",
            color: input.trim() && !loading ? "#fff" : "#4b5563",
            border: "none",
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 600,
            cursor: input.trim() && !loading ? "pointer" : "not-allowed",
          }}
        >
          Send
        </button>
      </div>

    </div>
  )
}

export default CareerChat