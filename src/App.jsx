import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import FilesPage from './pages/FilesPage';
import Schedule from './pages/Schedule';
import Admin from './pages/Admin';

// لو لسه معملتش الملفات دي، ممكن تقفل السطور بتاعتها بـ // لحد ما تعملها
import MCQ from './pages/MCQ';
import Checklist from './pages/Checklist';
import Summaries from './pages/Summaries';

export default function App() {
  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', color: '#fff' }}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/files" element={<FilesPage />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/mcq" element={<MCQ />} />
        <Route path="/checklist" element={<Checklist />} />
        <Route path="/summaries" element={<Summaries />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </div>
  );
}
