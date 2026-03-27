import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useLocation } from 'react-router-dom' // عشان نقرأ النوع من الرابط

export default function FilesPage() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const location = useLocation()
  
  // استخراج النوع من الرابط (مثلاً sharah أو questions)
  const queryParams = new URLSearchParams(location.search)
  const fileType = queryParams.get('type')

  useEffect(() => {
    async function fetchFiles() {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('type', fileType) // 🔥 هنا السحر: بيجيب النوع ده بس من الداتا بيز
        .order('created_at', { ascending: false })
      
      if (!error) setFiles(data)
      setLoading(false)
    }
    fetchFiles()
  }, [fileType]) // لو النوع اتغير، يحدث البيانات

  if (loading) return <div style={{ color: '#38bdf8', textAlign: 'center', padding: 50 }}>جاري تحميل الملفات... ⏳</div>

  return (
    <div style={{ padding: '20px 16px', maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ color: '#fff', textAlign: 'center', marginBottom: 20 }}>
        {fileType === 'sharah' ? '📖 ملفات الشرح' : 
         fileType === 'questions' ? '❓ ملفات الأسئلة' : 
         fileType === 'lectures' ? '🎥 تسجيلات المحاضرات' : '🎓 تسجيلات الكورسات'}
      </h1>

      <div style={{ display: 'grid', gap: 15 }}>
        {files.length === 0 ? (
          <p style={{ color: '#64748b', textAlign: 'center' }}>مفيش ملفات هنا لسه.. 🚧</p>
        ) : (
          files.map(file => (
            <div key={file.id} style={cardStyle}>
              <h3 style={{ color: '#f1f5f9' }}>{file.name}</h3>
              <a href={file.url} target="_blank" rel="noreferrer" style={btnStyle}>تحميل ⬇️</a>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

const cardStyle = { background: '#1e293b', padding: 18, borderRadius: 16, border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
const btnStyle = { background: '#38bdf8', color: '#0f172a', padding: '10px 15px', borderRadius: 10, textDecoration: 'none', fontWeight: 'bold' }
