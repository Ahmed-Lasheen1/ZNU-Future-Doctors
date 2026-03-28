import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function FilesPage() {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFiles = async () => {
      const { data } = await supabase.from('files').select('*').order('created_at', { ascending: false });
      if (data) setFiles(data);
      setLoading(false);
    };
    fetchFiles();
  }, []);

  return (
    <div style={{ padding: 20, direction: 'rtl', minHeight: '100vh', color: '#fff' }}>
      <h2 style={{ textAlign: 'center', color: '#38bdf8', marginBottom: 20 }}>📚 المكتبة الإلكترونية</h2>

      {/* مشغل الملفات والتسجيلات الداخلي */}
      {selectedFile && (
        <div style={overlayStyle}>
          <div style={playerHeader}>
            <span style={{ fontWeight: 'bold' }}>{selectedFile.name}</span>
            <button onClick={() => setSelectedFile(null)} style={closeBtn}>إغلاق ❌</button>
          </div>
          <iframe src={selectedFile.url} style={iframeStyle} allow="autoplay" title="Viewer"></iframe>
        </div>
      )}

      {/* القائمة */}
      <div style={{ display: 'grid', gap: 12 }}>
        {loading ? <p style={{textAlign:'center'}}>جاري تحميل الملفات...</p> : 
          files.map(file => (
          <div key={file.id} onClick={() => setSelectedFile(file)} style={fileCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={iconCircle}>{getFileIcon(file.type)}</div>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: 15 }}>{file.name}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>{getFileTypeText(file.type)}</div>
              </div>
            </div>
            <span style={{ color: '#38bdf8', fontSize: 18 }}>←</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// دوال مساعدة للشكل
const getFileIcon = (type) => {
  if (type === 'records') return '🎙️';
  if (type === 'lectures') return '🎥';
  if (type === 'sharah') return '📖';
  return '📄';
};

const getFileTypeText = (type) => {
  if (type === 'records') return 'تسجيل صوتي';
  if (type === 'lectures') return 'محاضرة كلية';
  if (type === 'sharah') return 'ملف شرح';
  return 'ملف';
};

// التنسيقات
const overlayStyle = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: '#000', zIndex: 9999, display: 'flex', flexDirection: 'column' };
const playerHeader = { padding: 15, background: '#1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155' };
const closeBtn = { background: '#ef4444', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' };
const iframeStyle = { width: '100%', flex: 1, border: 'none' };
const fileCard = { background: '#1e293b', padding: 15, borderRadius: 15, border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' };
const iconCircle = { width: 45, height: 45, borderRadius: '50%', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 };
