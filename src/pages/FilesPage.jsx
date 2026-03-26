import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const labels = {
  ar: {
    sharah: 'ملفات الشرح',
    questions: 'ملفات الأسئلة',
    lectures: 'تسجيلات المحاضرات',
    courses: 'تسجيلات الكورسات',
    summaries: 'ملخصات',
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
    summaries: 'Summaries',
    current: 'Current Module',
    professional_practice: 'Professional Practice',
    download: 'Download',
    empty: 'No files yet',
    loading: 'Loading...',
  }
}

function FilesPage({ type, lang }) {
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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #0c2340 100%)',
      padding: '20px'
    }}>
      <h1 style={{ color: '#38bdf8', marginBottom: '20px', textAlign: 'center' }}>
        {t[type]}
      </h1>

      <div style={{
        display: 'flex',
        gap: '10px',
        justifyContent: 'center',
        marginBottom: '24px'
      }}>
        {['current', 'professional_practice'].map(m => (
          <button
            key={m}
            onClick={() => setModule(m)}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              border: '1px solid #38bdf8',
              background: module === m ? '#38bdf8' : 'transparent',
              color: module === m ? '#0f172a' : '#38bdf8',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '13px'
            }}>
            {t[m]}
          </button>
        ))}
      </div>

      {loading && (
        <p style={{ color: '#94a3b8', textAlign: 'center' }}>{t.loading}</p>
      )}

      {!loading && files.length === 0 && (
        <div style={{
          background: '#1e293b',
          borderRadius: '16px',
          padding: '40px',
          textAlign: 'center',
          border: '1px solid #1e3a5f'
        }}>
          <p style={{ color: '#94a3b8' }}>{t.empty}</p>
        </div>
      )}

      {files.map(file => (
        <div key={file.id} style={{
          background: 'linear-gradient(135deg, #1e293b, #0f2540)',
          border: '1px solid #1e3a5f',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '12px',
        }}>
          <h3 style={{ color: '#e2e8f0', marginBottom: '8px' }}>{file.name}</h3>
          <p style={{ color: '#94a3b8', marginBottom: '12px' }}>{file.description}</p>
          <a href={file.url} target="_blank" rel="noreferrer">
            <button style={{
              background: '#38bdf8',
              color: '#0f172a',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: '600',
              width: '100%'
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
