import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth, useModules } from '../App'
import { getTheme } from '../theme'
import { fetchModulesSorted } from '../lib/modules'

import ModulesTab from './admin/ModulesTab'
import SubjectsTab from './admin/SubjectsTab'
import LessonsTab from './admin/LessonsTab'
import FilesTab from './admin/FilesTab'
import SchedulesTab from './admin/SchedulesTab'
import QuestionsTab from './admin/QuestionsTab'
import SummariesTab from './admin/SummariesTab'
import StagesTab from './admin/StagesTab'
import AnalyticsTab from './admin/AnalyticsTab'
import SettingsTab from './admin/SettingsTab'

// Cap on the lessons list fetched here for cross-tab use — matches
// LIST_LIMIT in admin/adminStyles.js (files/schedules/questions/
// summaries each fetch their own copy at that same limit).
const LESSONS_LIST_LIMIT = 200

const TABS = ['modules', 'subjects', 'lessons', 'files', 'schedules', 'questions', 'summaries', 'stages', 'analytics', 'settings']

export default function Admin({ dark }) {
  const { user, profile } = useAuth()
  const { refreshModules } = useModules()
  const navigate = useNavigate()
  const isAuth = profile?.role === 'admin'
  const c = getTheme(dark)

  const [activeTab, setActiveTab] = useState('modules')

  // Reference data shared by several tabs (ModuleSelect dropdowns,
  // grouping lists by module/subject). Fetched once here and handed
  // down as props + refetch callbacks, so e.g. adding a subject in
  // SubjectsTab is immediately reflected if the admin switches to
  // FilesTab without a full page reload.
  const [modules, setModules] = useState([])
  const [subjects, setSubjects] = useState([])
  const [lessons, setLessons] = useState([])

  useEffect(() => {
    if (isAuth) {
      fetchModules(); fetchSubjects(); fetchLessons()
    }
  }, [isAuth])

  async function fetchModules() {
    const { modules: sorted } = await fetchModulesSorted()
    setModules(sorted)
    refreshModules()
  }
  async function fetchSubjects() {
    const { data } = await supabase.from('subjects').select('*').order('created_at')
    if (data) setSubjects(data)
  }
  async function fetchLessons() {
    const { data } = await supabase.from('lessons').select('*').order('created_at', { ascending: false }).limit(LESSONS_LIST_LIMIT)
    if (data) setLessons(data)
  }

  if (!isAuth) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: c.card, padding: 30, borderRadius: 20, width: '90%', maxWidth: 400, border: `1px solid ${c.border}`, textAlign: 'center' }}>
        <h3 style={{ color: '#38bdf8', marginBottom: 12 }}>🔐 Admin Panel</h3>
        <p style={{ color: c.sub, fontSize: 13, marginBottom: 20 }}>
          {user
            ? "Your account doesn't have admin access."
            : 'Sign in with your admin account to continue.'}
        </p>
        <button onClick={() => navigate(user ? '/' : '/auth')} style={{
          width: '100%', padding: '12px', background: '#38bdf8', border: 'none',
          borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer',
          color: '#0f172a', fontFamily: 'inherit', fontSize: 14
        }}>
          {user ? '← Back to Home' : 'Sign In'}
        </button>
      </div>
    </div>
  )

  const tabProps = { dark, modules, subjects, lessons, fetchModules, fetchSubjects, fetchLessons }

  return (
    <div className="page-container" style={{ padding: '20px', maxWidth: '650px' }}>
      <h2 style={{ color: '#38bdf8', textAlign: 'center', marginBottom: 20 }}>⚙️ Admin Panel</h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 8 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{
            padding: '8px 16px', borderRadius: '10px', cursor: 'pointer',
            fontWeight: 700, whiteSpace: 'nowrap', fontFamily: 'inherit', fontSize: 12,
            background: activeTab === t ? '#38bdf8' : c.card,
            color: activeTab === t ? '#0f172a' : c.sub,
            border: `1px solid ${activeTab === t ? '#38bdf8' : c.border}`
          }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      {activeTab === 'modules' && <ModulesTab {...tabProps} />}
      {activeTab === 'subjects' && <SubjectsTab {...tabProps} />}
      {activeTab === 'lessons' && <LessonsTab {...tabProps} />}
      {activeTab === 'files' && <FilesTab {...tabProps} />}
      {activeTab === 'schedules' && <SchedulesTab {...tabProps} />}
      {activeTab === 'questions' && <QuestionsTab {...tabProps} />}
      {activeTab === 'summaries' && <SummariesTab {...tabProps} />}
      {activeTab === 'stages' && <StagesTab {...tabProps} />}
      {activeTab === 'analytics' && <AnalyticsTab {...tabProps} />}
      {activeTab === 'settings' && <SettingsTab {...tabProps} />}
    </div>
  )
}
