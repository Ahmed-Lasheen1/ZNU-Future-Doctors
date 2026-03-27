import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../supabase'

const labels = {
  ar: {
    sharah: 'ملفات الشرح',
    questions: 'ملفات الأسئلة',
    lectures: 'تسجيلات المحاضرات',
    courses: 'تسجيلات الكورسات',
    current: 'الموديول الحالي',
    professional_practice: 'Professional Practice',
    download: 'تحميل',
    empty: 'مفيش ملفات لحد دلوقتي',
    loading: 'جاري التحميل...',
  },
  en: {
    sharah: 'Explanation Files',
    questions: 'Question Files',
    lectures: 'Lecture Recordings',
    courses: 'Course Recordings',
    current: 'Current Module',
    professional_practice: 'Professional Practice',
    download: 'Download',
    empty: 'No files yet',
    loading: 'Loading...',
  }
}

function FilesPage({ lang }) {
  const { type } = useParams()
  const [module, setModule] = useState('current')
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const t = labels[lang]

  useEffect(() => {
    fetchFiles()
  }, [type, module])

  async function fetchFiles() {
    setLoading(true)
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('type', type)
      .eq('module', module)
      .order('created_at', { ascending: false })
    if (!error) setFiles(data)
    setLoading(false)
  }

  return (
    <div style={{ padding: 20, maxWidth: 700, margin: '0 auto' }}>
      <h1 style={{ color: '#38bdf8', textAlign: 'center', marginBottom: 20 }}>
        {t[type]}
      </h1>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 24 }}>
        {['current', 'professional_practice'].map(m => (
          <button key={m} onClick={() => setModule(m)} style={{
            padding: '8px 16px', borderRadius: 10,
            border: '1px solid #38bdf8',
            background: module === m ? '#38bdf8' : 'transparent',
            color: module === m ? '#0f172a' : '#38bdf8',
            cursor: 'pointer', fontWeight: 700,
            fontSize: 13, fontFamily: 'inherit'
          }}>
            {t[m]}
          </button>
        ))}
      </div>

      {loading && <p style={{ color: '#94a3b8', textAlign: 'center' }}>{t.loading}</p>}

      {!loading && files.length === 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #1e293b, #0f2540)',
          border: '2px solid #1e3a5f',
          borderRadius: 16, padding: 40, textAlign: 'center'
        }}>
          <p style={{ color: '#94a3b8' }}>{t.empty}</p>
        </div>
      )}

      {files.map(file => (
        <div key={file.id} style={{
          background: 'linear-gradient(135deg, #1e293b, #0f2540)',
          border: '2px solid #1e3a5f',
          borderRadius: 16, padding: 20, marginBottom: 12,
        }}>
          <h3 style={{ color: '#e2e8f0', marginBottom: 8 }}>{file.name}</h3>
          <p style={{ color: '#94a3b8', marginBottom: 12 }}>{file.description}</p>
          <a href={file.url} target="_blank" rel="noreferrer">
            <button style={{
              background: '#38bdf8', color: '#0f172a',
              border: 'none', padding: '10px 20px',
              borderRadius: 10, cursor: 'pointer',
              fontWeight: 700, width: '100%',
              fontFamily: 'inherit', fontSize: 14
            }}>
              ⬇️ {t.download}
            </button>
          </a>
        </div>
      ))}
    </div>
  )
}

export default FilesPage
