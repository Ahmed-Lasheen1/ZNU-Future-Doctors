import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function FilesPage() {
  const [files, setFiles] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchFiles() {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (!error) setFiles(data)
      setLoading(false)
    }
    fetchFiles()
  }, [])

  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) return <div style={{ color: '#38bdf8', textAlign: 'center', padding: 50 }}>جاري التحميل...</div>

  return (
    <div style={{ padding: '20px 16px', maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ color: '#fff', textAlign: 'center', marginBottom: 20, fontSize: 24 }}>📁 مكتبة الملفات</h1>

      <div style={{ position: 'sticky', top: 10, zIndex: 10, marginBottom: 25 }}>
        <input
          type="text"
          placeholder="🔍 ابحث عن مادة أو ملف..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%', padding: '15px 20px', borderRadius: '15px',
            border: '1px solid #334155', background: '#1e293b',
            color: '#fff', fontSize: '16px', outline: 'none'
          }}
        />
      </div>

      <div style={{ display: 'grid', gap: 15 }}>
        {filteredFiles.map((file) => (
          <div key={file.id} style={{
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            borderRadius: '16px', padding: '18px', border: '1px solid #334155',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div>
              <h3 style={{ color: '#f1f5f9', fontSize: '16px', margin: 0 }}>{file.name}</h3>
              <span style={{ color: '#38bdf8', fontSize: '12px' }}>{file.type === 'questions' ? 'أسئلة' : 'شرح'}</span>
            </div>
            <a href={file.url} target="_blank" rel="noreferrer" style={{
              background: '#38bdf8', color: '#0f172a', padding: '10px 15px',
              borderRadius: '10px', textDecoration: 'none', fontWeight: 'bold'
            }}>تحميل</a>
          </div>
        ))}
      </div>
    </div>
  )
}
