import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

function Schedule() {
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSchedules()
  }, [])

  async function fetchSchedules() {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .order('date', { ascending: true })

    if (!error) setSchedules(data)
    setLoading(false)
  }

  return (
    <div className="page">
      <h1>📅 جداول الامتحانات</h1>

      {loading && <p style={{ color: '#94a3b8' }}>جاري التحميل...</p>}

      {schedules.length === 0 && !loading && (
        <div className="card">
          <p style={{ color: '#94a3b8', textAlign: 'center' }}>
            مفيش جداول لحد دلوقتي
          </p>
        </div>
      )}

      {schedules.map(item => (
        <div className="card" key={item.id}>
          <h3>{item.subject}</h3>
          <p style={{ color: '#94a3b8' }}>📆 {item.date}</p>
          <p style={{ color: '#94a3b8' }}>🕐 {item.time}</p>
          <p style={{ color: '#94a3b8' }}>📍 {item.location}</p>
        </div>
      ))}
    </div>
  )
}

export default Schedule
