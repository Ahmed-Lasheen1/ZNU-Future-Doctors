import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useLocation } from 'react-router-dom'

export default function FilesPage() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const location = useLocation()
  
  const queryParams = new URLSearchParams(location.search)
  const fileType = queryParams.get('type')

  useEffect(() => {
    async function fetchFiles() {
      setLoading(true)
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('type', fileType)
        .order('created_at', { ascending: false })
      
      if (!error) setFiles(data)
      setLoading(false)
    }
    fetchFiles()
  }, [fileType])

  const titles = {
    sharah: '📖 ملفات الشرح',
    questions: '❓ ملفات الأسئلة',
    lectures: '🎥 تسجيلات المحاضرات',
    courses: '🎓 تسجيلات الكورسات',
    summaries: '📝 الملخصات'
  }

  if (loading) return <div style={{ color: '#38bdf8', textAlign: 'center', padding: 50 }}>جاري التحميل... ⏳</div>

  return (
    <div style={{ padding: '20px 16px', maxWidth: 800, margin: '0 auto', direction: 'rtl' }}>
      <h1 style={{ color: '#fff', textAlign: 'center', marginBottom: 25 }}>{titles[fileType] || '📁 المكتبة'}</h1>

      <div style={{ display: 'grid', gap: 15 }}>
        {files.length === 0 ? (
          <p style={{ color: '#64748b', textAlign: 'center', marginTop: 50 }}>مفيش ملفات هنا لسه.. 🚧</p>
        ) : (
          files.map(file => (
            <div key={file.id} style={{ background: '#1e293b', padding: 20, borderRadius: 16, border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ color: '#f1f5f9', fontSize: 16, margin: 0 }}>{file.name}</h3>
              <a href={file.url} target="_blank" rel="noreferrer" style={{ background: '#38bdf8', color: '#0f172a', padding: '10px 18px', borderRadius: 10, textDecoration: 'none', fontWeight: 'bold' }}>تحميل</a>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
