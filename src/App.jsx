import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import FilesPage from './pages/FilesPage'
import Summaries from './pages/Summaries'
import MCQ from './pages/MCQ'
import Schedule from './pages/Schedule'
import Admin from './pages/Admin'
import Checklist from './pages/Checklist' // 1. استيراد الصفحة الجديدة
import Footer from './components/Footer'

function App() {
  const [lang, setLang] = useState('ar')
  
  return (
    <Router>
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1a2e 50%, #0a1628 100%)',
        fontFamily: "'Cairo', 'Segoe UI', sans-serif",
        direction: lang === 'ar' ? 'rtl' : 'ltr',
        display: 'flex',
        flexDirection: 'column',
        color: '#fff' // لضمان وضوح الخط في كل الصفحات
      }}>
        <Navbar lang={lang} setLang={setLang} />
        
        <div style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Home lang={lang} />} />
            <Route path="/files/:type" element={<FilesPage lang={lang} />} />
            <Route path="/summaries" element={<Summaries lang={lang} />} />
            <Route path="/mcq" element={<MCQ lang={lang} />} />
            <Route path="/schedule" element={<Schedule lang={lang} />} />
            <Route path="/admin" element={<Admin lang={lang} />} />
            
            {/* 2. تسجيل عنوان صفحة التحديدات */}
            <Route path="/checklist" element={<Checklist lang={lang} />} />
          </Routes>
        </div>
        
        <Footer />
      </div>
    </Router>
  )
}

export default App
