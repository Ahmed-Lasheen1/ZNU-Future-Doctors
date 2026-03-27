import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Checklist from './pages/Checklist';
import Schedule from './pages/Schedule';
import FilesPage from './pages/FilesPage';
import Admin from './pages/Admin';
import MCQ from './pages/MCQ';
import Summaries from './pages/Summaries'; // تأكد من وجود الملف ده في فولدر pages

function SmartHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  if (location.pathname === '/') return null;

  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '12px 18px', background: 'rgba(15, 23, 42, 0.9)',
      backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 1000,
      borderBottom: '1px solid #1e3a5f', direction: 'rtl'
    }}>
      <button onClick={() => navigate(-1)} style={navBtnStyle}>🔙 رجوع</button>
      <button onClick={() => navigate('/')} style={navBtnStyle}>🏠 الرئيسية</button>
    </div>
  );
}

const navBtnStyle = {
  background: '#1e293b', color: '#38bdf8', border: '1px solid #334155',
  padding: '8px 16px', borderRadius: '12px', fontSize: '14px', fontWeight: '800', cursor: 'pointer'
};

function App() {
  return (
    <Router>
      <div style={{ background: '#0f172a', minHeight: '100vh', color: '#fff' }}>
        <SmartHeader />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/checklist" element={<Checklist />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/files" element={<FilesPage />} />
          <Route path="/summaries" element={<Summaries />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/mcq" element={<MCQ />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
