import { useState } from 'react'

const GEMINI_API_KEY = 'AIzaSyDGi5UQi1cCD8Y88gnJo7SkTojKpPJV1N8'

const labels = {
  ar: {
    title: 'المساعد الذكي',
    placeholder: 'اكتب سؤالك هنا...',
    send: 'إرسال',
    welcome: 'اسأل أي سؤال في الطب أو الدراسة!',
    loading: 'جاري الرد...',
    error: 'حصل خطأ، حاول تاني!',
  },
  en: {
    title: 'AI Assistant',
    placeholder: 'Type your question here...',
    send: 'Send',
    welcome: 'Ask any medical or study question!',
    loading: 'Thinking...',
    error: 'An error occurred, try again!',
  }
}

function Chatbot({ lang }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const t = labels[lang]

  async function sendMessage() {
    if (!input.trim()) return
    const userMsg = { role: 'user', text: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ 
                text: `أنت مساعد طبي لطلاب كلية الطب في ZNU. أجب بشكل مختصر ومفيد. السؤال: ${input}` 
              }]
            }]
          })
        }
      )
      const data = await response.json()
      console.log(data)
      const botText = data.candidates[0].content.parts[0].text
      setMessages(prev => [...prev, { role: 'bot', text: botText }])
    } catch (err) {
      console.log(err)
      setMessages(prev => [...prev, { role: 'bot', text: t.error }])
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #0c2340 100%)',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <h1 style={{ color: '#38bdf8', textAlign: 'center', marginBottom: '20px' }}>
        🤖 {t.title}
      </h1>

      <div style={{
        flex: 1,
        background: '#1e293b',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '16px',
        border: '1px solid #1e3a5f',
        minHeight: '400px'
      }}>
        {messages.length === 0 && (
          <p style={{ color: '#94a3b8', textAlign: 'center' }}>{t.welcome}</p>
        )}
        {messages.map((msg, i) => (
          <div key={i} style={{
            marginBottom: '12px',
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-start' : 'flex-end'
          }}>
            <span style={{
              background: msg.role === 'user' ? '#38bdf8' : '#0f2540',
              color: msg.role === 'user' ? '#0f172a' : '#e2e8f0',
              padding: '10px 14px',
              borderRadius: '12px',
              maxWidth: '80%',
              display: 'inline-block',
              border: '1px solid #1e3a5f'
            }}>
              {msg.text}
            </span>
          </div>
        ))}
        {loading && (
          <p style={{ color: '#94a3b8', textAlign: 'center' }}>{t.loading}</p>
        )}
      </div>

      <input
        type="text"
        placeholder={t.placeholder}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && sendMessage()}
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: '10px',
          border: '1px solid #1e3a5f',
          background: '#1e293b',
          color: '#e2e8f0',
          fontSize: '16px',
          marginBottom: '10px'
        }}
      />
      <button onClick={sendMessage} style={{
        background: '#38bdf8',
        color: '#0f172a',
        border: 'none',
        padding: '12px',
        borderRadius: '10px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '16px',
        width: '100%'
      }}>
        {t.send} ✉️
      </button>
    </div>
  )
}

export default Chatbot
