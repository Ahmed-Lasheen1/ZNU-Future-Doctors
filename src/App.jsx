import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
// استيراد الصفحات - تأكد إن الأسماء دي مطابقة لملفاتك في فولدر pages
import Home from './pages/Home';
import Checklist from './pages/Checklist';
import Schedule from './pages/Schedule';
import FilesPage from './pages/FilesPage';
import Admin from './pages/Admin';
import MCQ from './pages/MCQ';

// مكون الشريط العلوي الذكي (بيظهر بره الصفحة الرئيسية بس)
function SmartHeader() {
  const navigate = useNavigate();
  const location = useLocation();

  // لو إحنا في الصفحة الرئيسية (/) مش هنظهر الشريط
  if (location.pathname === '/') return null;

  return (
    <div style={{
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      padding: '12px 18px', 
      background: 'rgba(15, 23, 42, 0.9)', // شفافية شيك
      backdropFilter: 'blur(8px)', 
      position: 'sticky', 
      top: 0, 
      zIndex: 1000,
      borderBottom: '1px solid #1e3a5f'
    }}>
      {/* زرار الرجوع */}
      <button onClick={() => navigate(-1)} style={navBtnStyle}>
        <span style={{ marginLeft: '5px' }}>🔙</span> رجوع
      </button>

      {/* زرار الرئيسية */}
      <button onClick={() => navigate('/')} style={navBtnStyle}>
        <span style={{ marginLeft: '5px' }}>🏠</span> الرئيسية
      </button>
    </div>
  );
}

// ستايل الأزرار عشان تبان كأنها في أبلكيشن
const navBtnStyle = {
  background: '#1e293b',
  color: '#38bdf8',
  border: '1px solid #334155',
  padding: '8px 16px',
  borderRadius: '12px',
  fontSize: '14px',
  fontWeight: '800',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  fontFamily: 'inherit'
};

function App() {
  return (
    <Router>
      {/* الحاوية الرئيسية للموقع */}
      <div style={{ 
        background: '#0f172a', 
        minHeight: '100vh', 
        direction: 'rtl', // عشان الموقع عربي
        fontFamily: 'sans-serif' 
      }}>
        
        <SmartHeader />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/checklist" element={<Checklist />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/files" element={<FilesPage />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/mcq" element={<MCQ />} />
        </Routes>
        
      </div>
    </Router>
  );
}

export default App;
