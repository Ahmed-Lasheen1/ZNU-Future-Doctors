import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import FilesPage from './pages/FilesPage';
import Schedule from './pages/Schedule';
import Admin from './pages/Admin';
import Summaries from './pages/Summaries';

export default function App() {
  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', color: '#fff' }}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/files" element={<FilesPage />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/summaries" element={<Summaries />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </div>
  );
}
