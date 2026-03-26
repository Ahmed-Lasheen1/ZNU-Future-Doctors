import { useState, useEffect, useRef } from 'react'

const GEMINI_API_KEY = 'AIzaSyDEX3yWdDTmxpo52vJ0TGqG3bSCCWgYGms'

const labels = {
  ar: {
    title: 'المساعد الذكي - ZNU',
    placeholder: 'اكتب سؤالك هنا...',
    send: 'إرسال',
    welcome: 'أهلاً بك! اسأل أي سؤال طبي أو دراسي خاص بكلية الطب.',
    loading: 'جاري التفكير...',
    error: 'عذراً، حدث خطأ. تأكد من اتصالك بالإنترنت وحاول مجدداً.',
  },
  en: {
    title: 'AI Assistant - ZNU',
    placeholder: 'Type your question here...',
    send: 'Send',
    welcome: 'Welcome! Ask any medical or study question.',
    loading: 'Thinking...',
    error: 'An error occurred, please try again!',
  }
}

function Chatbot({ lang = 'ar' }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const chatEndRef = useRef(null) // مرجع للنزول التلقائي
  const t = labels[lang]

  // وظيفة للنزول لآخر رسالة تلقائياً
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  async function sendMessage() {
    if (!input.trim() || loading) return
    
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
                text: `أنت مساعد طبي ذكي لطلاب كلية الطب بجامعة ZNU. أجب باحترافية واختصار باللغة ${lang === 'ar' ? 'العربية' : 'الإنجليزية'}. السؤال: ${input}` 
              }]
            }]
          })
        }
      )
      
      const data = await response.json()
      
      if (data.candidates && data.candidates[0]) {
        const botText = data.candidates[0].content.parts[0].text
        setMessages(prev => [...prev, { role: 'bot', text: botText }])
      } else {
        throw new Error('Invalid Response')
      }

    } catch (err) {
      console.error(err)
      setMessages(prev => [...prev, { role: 'bot', text: t.error }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      height: '100vh',
      background: '#0f172a',
      padding: '10px',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'sans-serif'
    }}>
      <h2 style={{ color: '#38bdf8', textAlign: 'center', fontSize: '1.2rem' }}>
         {t.title}
      </h2>

      <div style={{
        flex: 1,
        background: '#1e293b',
        borderRadius: '12px',
        padding: '15px',
        overflowY: 'auto',
        marginBottom: '10px',
        border: '1px solid #334155'
      }}>
        {messages.length === 0 && (
          <div style={{ color: '#94a3b8', textAlign: 'center', marginTop: '20px' }}>{t.welcome}</div>
        )}
        
        {messages.map((msg, i) => (
          <div key={i} style={{
            marginBottom: '15px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start'
          }}>
            <div style={{
              background: msg.role === 'user' ? '#38bdf8' : '#334155',
              color: msg.role === 'user' ? '#0f172a' : '#f8fafc',
              padding: '10px 15px',
              borderRadius: '15px',
              borderBottomRightRadius: msg.role === 'user' ? '2px' : '15px',
              borderBottomLeftRadius: msg.role === 'bot' ? '2px' : '15px',
              maxWidth: '85%',
              wordWrap: 'break-word',
              direction: lang === 'ar' ? 'rtl' : 'ltr'
            }}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && <div style={{ color: '#38bdf8', fontSize: '14px' }}>{t.loading}</div>}
        <div ref={chatEndRef} /> 
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          placeholder={t.placeholder}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #334155',
            background: '#0f172a',
            color: '#fff',
            outline: 'none'
          }}
        />
        <button onClick={sendMessage} disabled={loading} style={{
          background: '#38bdf8',
          border: 'none',
          padding: '0 20px',
          borderRadius: '8px',
          cursor: 'pointer',
          opacity: loading ? 0.5 : 1
        }}>
          {t.send}
        </button>
      </div>
    </div>
  )
}

export default Chatbot