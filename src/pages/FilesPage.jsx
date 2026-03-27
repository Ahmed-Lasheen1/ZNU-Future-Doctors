import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useLocation } from 'react-router-dom'

export default function FilesPage() {
  const [files, setFiles] = useState([])
  const [mainCat, setMainCat] = useState('module') 
  const [activeSub, setActiveSub] = useState('All')
  const [loading, setLoading] = useState(true)
  const location = useLocation()
  const fileType = new URLSearchParams(location.search).get('type')

  useEffect(() => {
    async function fetch() {
      setLoading(true)
      const { data } = await supabase.from('files').select('*').eq('type', fileType)
      if (data) setFiles(data)
      setLoading(false)
    }
    fetch()
  }, [fileType])

  const subjects = mainCat === 'module' 
    ? ['Anatomy', 'Histology', 'Physiology', 'Biochemistry'] 
    : ['Ethics', 'Professionalism', 'Research']

  const filtered = files.filter(f => f.category === mainCat && (activeSub === 'All' || f.subject === activeSub))

  return (
    <div style={{ padding: 20, direction: 'rtl' }}>
      {/* زراير الاختيار الكبير */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button onClick={() => {setMainCat('module'); setActiveSub('All')}} style={{...btn, background: mainCat === 'module' ? '#38bdf8' : '#1e293b'}}>Current Module</button>
        <button onClick={() => {setMainCat('professional'); setActiveSub('All')}} style={{...btn, background: mainCat === 'professional' ? '#38bdf8' : '#1e293b'}}>Professional Practice</button>
      </div>

      {/* شريط المواد */}
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 10 }}>
        <button onClick={() => setActiveSub('All')} style={{...sBtn, borderColor: activeSub === 'All' ? '#38bdf8' : '#334155'}}>الكل</button>
        {subjects.map(s => (
          <button key={s} onClick={() => setActiveSub(s)} style={{...sBtn, borderColor: activeSub === s ? '#38bdf8' : '#334155'}}>{s}</button>
        ))}
      </div>

      <div style={{ marginTop: 20 }}>
        {loading ? <p>جاري التحميل...</p> : filtered.map(f => (
          <div key={f.id} style={card}>
            <span style={{color: '#fff'}}>{f.name}</span>
            <a href={f.url} target="_blank" rel="noreferrer" style={dl}>تحميل</a>
          </div>
        ))}
      </div>
    </div>
  )
}
const btn = { flex: 1, padding: 12, borderRadius: 12, border: 'none', color: '#fff', fontWeight: 'bold' }
const sBtn = { padding: '5px 15px', borderRadius: 20, background: 'transparent', color: '#fff', border: '1px solid', whiteSpace: 'nowrap' }
const card = { background: '#1e293b', padding: 15, borderRadius: 12, marginBottom: 10, display: 'flex', justifyContent: 'space-between' }
const dl = { color: '#38bdf8', textDecoration: 'none', fontWeight: 'bold' }
