import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Suspense, lazy } from 'react';

// استيراد الصفحات - تأكد إن الأسماء دي هي اللي عندك في فولدر pages بالظبط
import Home from './pages/Home';
import Checklist from './pages/Checklist';
import Schedule from './pages/Schedule';
import FilesPage from './pages/FilesPage';
import Admin from './pages/Admin';
import MCQ from './pages/MCQ';

function SmartHeader() {
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname === '/') return null;

  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '12px 18px', background: 'rgba(15, 23, 42, 0.9)',
      backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 1000,
      borderBottom: '1px solid #1e3a5f'
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
      <div style={{ background: '#0f172a', minHeight: '100vh', direction: 'rtl' }}>
        <SmartHeader />
        <div style={{ paddingBottom: '50px' }}> {/* مساحة أمان تحت الهيدر */}
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/checklist" element={<Checklist />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/files" element={<FilesPage />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/mcq" element={<MCQ />} />
            {/* لو كتب أي مسار غلط يرجعه للرئيسية بدل ما الشاشة تبقى فاضية */}
            <Route path="*" element={<Home />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
