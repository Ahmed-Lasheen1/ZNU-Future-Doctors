import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import FilesPage from './pages/FilesPage'
import Chatbot from './pages/Chatbot'
import Admin from './pages/Admin'
import Navbar from './components/Navbar'

function App() {
  const [lang, setLang] = useState('ar')

  return (
    <Router>
      <div className="app" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <Navbar lang={lang} setLang={setLang} />
        <Routes>
          <Route path="/" element={<Home lang={lang} />} />
          <Route path="/sharah" element={<FilesPage type="sharah" lang={lang} />} />
          <Route path="/questions" element={<FilesPage type="questions" lang={lang} />} />
          <Route path="/lectures" element={<FilesPage type="lectures" lang={lang} />} />
          <Route path="/courses" element={<FilesPage type="courses" lang={lang} />} />
          <Route path="/summaries" element={<FilesPage type="summaries" lang={lang} />} />
          <Route path="/chatbot" element={<Chatbot lang={lang} />} />
          <Route path="/admin" element={<Admin lang={lang} />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
