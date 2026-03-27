import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import FilesPage from './pages/FilesPage';
import Schedule from './pages/Schedule';
import MCQ from './pages/MCQ';
import Checklist from './pages/Checklist';
import Admin from './pages/Admin';
import Summaries from './pages/Summaries';

// تأكد أنك تمسح كل شيء وتضع هذا الكود
export default function App() {
  return (
    <div style={{ 
      background: '#0f172a', // اللون الداكن الموحد للخلفية
      minHeight: '100vh', 
      color: '#fff',
      fontFamily: 'system-ui, -apple-system, sans-serif' 
    }}>
      <Routes>
        {/* الصفحة الرئيسية */}
        <Route path="/" element={<Home />} />
        
        {/* صفحة الملفات الذكية (شرح، أسئلة، محاضرات، كورسات) */}
        <Route path="/files" element={<FilesPage />} />
        
        {/* صفحة الجداول (دراسي وامتحانات) */}
        <Route path="/schedule" element={<Schedule />} />
        
        {/* صفحة بنك الأسئلة */}
        <Route path="/mcq" element={<MCQ />} />
        
        {/* صفحة التحديدات (Checklist) */}
        <Route path="/checklist" element={<Checklist />} />
        
        {/* صفحة الملخصات التفاعلية الجديدة */}
        <Route path="/summaries" element={<Summaries />} />
        
        {/* لوحة التحكم (مخفية) */}
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </div>
  );
}
