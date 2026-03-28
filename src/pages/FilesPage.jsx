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
    async function fetchFiles() {
      setLoading(true)
      const { data } = await supabase.from('files').select('*').eq('type', fileType)
      if (data) setFiles(data)
      setLoading(false)
    }
    fetchFiles()
  }, [fileType])

  const subjects = mainCat === 'module' 
    ? ['Anatomy', 'Histology', 'Physiology', 'Biochemistry'] 
    : ['Ethics', 'Professionalism', 'Research']

  const filtered = files.filter(f => f.category === mainCat && (activeSub === 'All' || f.subject === activeSub))

  return (
    <div style={{ padding: '20px', direction: 'rtl' }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button onClick={() => {setMainCat('module'); setActiveSub('All')}} style={{...tab, background: mainCat === 'module' ? '#38bdf8' : '#1e293b'}}>Current Module</button>
        <button onClick={() => {setMainCat('professional'); setActiveSub('All')}} style={{...tab, background: mainCat === 'professional' ? '#38bdf8' : '#1e293b'}}>Professional Practice</button>
      </div>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12 }}>
        <button onClick={() => setActiveSub('All')} style={{...subTab, borderColor: activeSub === 'All' ? '#38bdf8' : '#334155'}}>الكل</button>
        {subjects.map(s => (
          <button key={s} onClick={() => setActiveSub(s)} style={{...subTab, borderColor: activeSub === s ? '#38bdf8' : '#334155'}}>{s}</button>
        ))}
      </div>

      <div style={{ marginTop: 20 }}>
        {loading ? <p style={{textAlign:'center'}}>جاري التحميل...</p> : 
         filtered.length === 0 ? <p style={{textAlign:'center', color:'#64748b'}}>مفيش ملفات هنا حالياً 🚧</p> :
         filtered.map(f => (
          <div key={f.id} style={fileCard}>
            <span style={{fontWeight:'bold'}}>{f.name}</span>
            <a href={f.url} target="_blank" rel="noreferrer" style={dlBtn}>تحميل 📥</a>
          </div>
        ))}
      </div>
    </div>
  )
}

const tab = { flex: 1, padding: '14px', borderRadius: '12px', border: 'none', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }
const subTab = { padding: '6px 15px', borderRadius: '20px', background: 'transparent', color: '#fff', border: '1px solid', whiteSpace: 'nowrap', fontSize: '13px' }
const fileCard = { background: '#1e293b', padding: '18px', borderRadius: '15px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #334155' }
const dlBtn = { color: '#38bdf8', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px' }
