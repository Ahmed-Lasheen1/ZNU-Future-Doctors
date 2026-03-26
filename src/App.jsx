import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Files from './pages/Files'
import Schedule from './pages/Schedule'
import Chatbot from './pages/Chatbot'
import Admin from './pages/Admin'
import Navbar from './components/Navbar'

function App() {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/files" element={<Files />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/chatbot" element={<Chatbot />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
