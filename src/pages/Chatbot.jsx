import { useState } from 'react'

const GEMINI_API_KEY = 'AIzaSyDEX3yWdDTmxpo52vJ0TGqG3bSCCWgYGms'

function Chatbot() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  async function sendMessage() {
    if (!input.trim()) return

    const userMsg = { role: 'user', text: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `أنت مساعد طبي لطلاب كلية الطب في ZNU. أجب باللغة العربية بشكل مختصر ومفيد. السؤال: ${input}`
              }]
            }]
          })
        }
      )

      const data = await response.json()
      const botText = data.candidates[0].content.parts[0].text

      setMessages(prev => [...prev, { role: 'bot', text: botText }])
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', text: 'حصل خطأ، حاول تاني!' }])
    }

    setLoading(false)
  }

  return (
    <div className="page">
      <h1>🤖 المساعد الذكي</h1>

      <div className="card" style={{ minHeight: '400px', marginBottom: '10px' }}>
        {messages.length === 0 && (
          <p style={{ color: '#94a3b8', textAlign: 'center' }}>
            اسأل أي سؤال في الطب أو الدراسة!
          </p>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{
            marginBottom: '12px',
            textAlign: msg.role === 'user' ? 'left' : 'right'
          }}>
            <span style={{
              background: msg.role === 'user' ? '#3b82f6' : '#1e293b',
              padding: '10px 14px',
              borderRadius: '12px',
              display: 'inline-block',
              maxWidth: '80%',
              border: '1px solid #334155'
            }}>
              {msg.text}
            </span>
          </div>
        ))}

        {loading && (
          <p style={{ color: '#94a3b8', textAlign: 'right' }}>
            جاري الرد...
          </p>
        )}
      </div>

      <input
        type="text"
        placeholder="اكتب سؤالك هنا..."
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && sendMessage()}
      />
      <button className="btn" onClick={sendMessage}>إرسال ✉️</button>
    </div>
  )
}

export default Chatbot
