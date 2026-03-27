import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function Checklist() {
  const [tasks, setTasks] = useState([])
  const subjects = ['Anatomy', 'Biochemistry', 'Physiology', 'Histology']

  useEffect(() => {
    async function fetchTasks() {
      const { data } = await supabase.from('checklist').select('*')
      if (data) setTasks(data)
    }
    fetchTasks()
  }, [])

  return (
    <div style={{ padding: '20px', direction: 'rtl' }}>
      <h2 style={{ textAlign: 'center', color: '#38bdf8', fontSize: '24px', marginBottom: '5px' }}>🎯 تحديدات الامتحان</h2>
      <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px', marginBottom: '30px' }}>علم على اللي خلصته (بيتحفظ على جهازك)</p>

      {subjects.map(sub => (
        <div key={sub} style={{ marginBottom: '25px' }}>
          <h3 style={{ color: '#9d8df1', fontSize: '18px', marginBottom: '15px', paddingRight: '10px' }}>{sub} 📚</h3>
          
          {tasks.filter(t => t.subject === sub).map(task => (
            <div key={task.id} style={cardStyle}>
              <span style={{ color: '#fff' }}>{task.text}</span>
              <div style={checkCircle}></div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

const cardStyle = {
  background: 'rgba(30, 41, 59, 0.5)', 
  padding: '20px', 
  borderRadius: '15px', 
  marginBottom: '10px', 
  display: 'flex', 
  justifyContent: 'space-between', 
  alignItems: 'center',
  border: '1px solid #334155'
}

const checkCircle = {
  width: '24px', 
  height: '24px', 
  borderRadius: '8px', 
  border: '2px solid #059669', 
  cursor: 'pointer'
}
