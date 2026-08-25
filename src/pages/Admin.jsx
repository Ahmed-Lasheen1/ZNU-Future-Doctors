import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth, useModules } from '../App'
import { getTheme } from '../theme'
import { fetchModulesSorted } from '../lib/modules'
import NotFound from './NotFound'

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
  const { user, profile, authLoaded } = useAuth()
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

  // Security-through-obscurity note: this only hides that an admin
  // panel exists from casual visitors/curious students. It is NOT a
  // substitute for real access control — the actual protection is (and
  // must remain) Supabase's row-level security policies, which already
  // gate every read/write an admin-only action performs. This just
  // stops /admin from advertising itself to someone without access.
  //
  // While the session/profile is still loading, we don't know yet
  // whether this person is an admin — show a blank loading state
  // instead of flashing the 404 page for a moment on every visit
  // (including the real admin's own visits).
  if (!authLoaded) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: c.sub, fontSize: 14, fontWeight: 600 }}>Loading...</div>
      </div>
    )
  }

  // Not an admin (whether signed out entirely or signed in with a
  // regular account) — render the exact same "page not found" page any
  // unknown URL gets, so /admin looks like it simply doesn't exist.
  if (!isAuth) return <NotFound dark={dark} />

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
