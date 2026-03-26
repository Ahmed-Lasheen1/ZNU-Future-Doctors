import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

function Files() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFiles()
  }, [])

  async function fetchFiles() {
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error) setFiles(data)
    setLoading(false)
  }

  return (
    <div className="page">
      <h1>📁 الملفات والمذكرات</h1>

      {loading && <p style={{ color: '#94a3b8' }}>جاري التحميل...</p>}

      {files.length === 0 && !loading && (
        <div className="card">
          <p style={{ color: '#94a3b8', textAlign: 'center' }}>
            مفيش ملفات لحد دلوقتي
          </p>
        </div>
      )}

      {files.map(file => (
        <div className="card" key={file.id}>
          <h3>{file.name}</h3>
          <p style={{ color: '#94a3b8', marginBottom: '10px' }}>
            {file.description}
          </p>
          <a href={file.url} target="_blank" rel="noreferrer">
            <button className="btn">⬇️ تحميل</button>
          </a>
        </div>
      ))}
    </div>
  )
}

export default Files
