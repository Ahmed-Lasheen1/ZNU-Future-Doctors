import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth, useModules } from '../contexts'
import { getPulseTheme, pulseFonts, pulseType } from '../premiumTheme'
import PulseBackground from '../components/pulse/PulseBackground'
import PulseGlassRow from '../components/pulse/PulseGlassRow'
import BackButton from '../components/pulse/BackButton'
import { fetchModulesSorted } from '../lib/modules'
import { invalidateSubjectsCache } from '../lib/subjects'
import { invalidateLessonsCache } from '../lib/lessons'
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
// LIST_LIMIT in admin/adminStyles.js.
const LESSONS_LIST_LIMIT = 200

const TABS = ['modules', 'subjects', 'lessons', 'files', 'schedules', 'questions', 'summaries', 'stages', 'analytics', 'settings']
const TAB_LABELS = {
  modules: '📦 Modules', subjects: '📖 Subjects', lessons: '📘 Lessons', files: '🗂 Files',
  schedules: '📅 Schedules', questions: '❓ Questions', summaries: '📝 Summaries',
  stages: '🎯 Stages', analytics: '📊 Analytics', settings: '⚙️ Settings'
}

export default function Admin({ dark }) {
  const { user, profile, authLoaded } = useAuth()
  const { refreshModules } = useModules()
  const navigate = useNavigate()
  const isAuth = profile?.role === 'admin'
  const pt = getPulseTheme(dark)

  const [activeTab, setActiveTab] = useState('modules')

  // Reference data shared by several tabs (ModuleSelect dropdowns,
  // grouping lists by module/subject). Fetched once here and handed
  // down as props + refetch callbacks.
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
    invalidateSubjectsCache()
    const { data } = await supabase.from('subjects').select('*').order('created_at')
    if (data) setSubjects(data)
  }
  async function fetchLessons() {
    invalidateLessonsCache()
    const { data } = await supabase.from('lessons').select('*').order('created_at', { ascending: false }).limit(LESSONS_LIST_LIMIT)
    if (data) setLessons(data)
  }

  // Security-through-obscurity note (unchanged): this only hides that
  // an admin panel exists from casual visitors — real protection is
  // Supabase RLS. While auth is still loading, show a blank state
  // instead of flashing 404.
  if (!authLoaded) {
    return (
      <div style={{ position: 'relative', minHeight: '100vh' }}>
        <PulseBackground />
        <div style={{ position: 'relative', zIndex: 1, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: pt.sub, fontSize: 14, fontWeight: 600 }}>Loading...</div>
        </div>
      </div>
    )
  }

  if (!isAuth) return <NotFound dark={dark} />

  const tabProps = { dark, modules, subjects, lessons, fetchModules, fetchSubjects, fetchLessons }

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <PulseBackground />
      <div className="pulse-wide" style={{ position: 'relative', zIndex: 1, padding: '24px 20px 100px', fontFamily: pulseFonts.body, maxWidth: 900, margin: '0 auto' }}>
        <style>{`
          .admin-tabs {
            display: flex; gap: 8px; overflow-x: auto; padding-bottom: 8px;
            margin-bottom: 20px; -webkit-overflow-scrolling: touch;
          }
          @media (min-width: 720px) {
            .admin-tabs { flex-wrap: wrap; overflow-x: visible; }
          }
          .admin-form-row-2 {
            display: grid; grid-template-columns: 1fr; gap: 0; margin-bottom: 12px;
          }
          @media (min-width: 640px) {
            .admin-form-row-2 { grid-template-columns: 1fr 1fr; gap: 12px; }
          }
        `}</style>

        <div style={{ marginBottom: 8 }}>
          <BackButton dark={dark} fallback="/" />
        </div>

        <div style={{ textAlign: 'center', padding: '48px 0 20px' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>⚙️</div>
          <h1 style={{ ...pulseType.miniPageTitle, color: pt.text }}>Admin Panel</h1>
        </div>

        <div className="admin-tabs">
          {TABS.map(t => {
            const active = activeTab === t
            return (
              <PulseGlassRow
                key={t} dark={dark} radius={999} active={active}
                activeTint={`${pt.cobalt}26`}
                hoverTint={dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.35)'}
                onClick={() => setActiveTab(t)} role="button" tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveTab(t) } }}
                style={{ flexShrink: 0 }}
              >
                <div style={{ padding: '9px 16px', whiteSpace: 'nowrap', ...pulseType.button, color: active ? pt.cobalt : pt.sub }}>
                  {TAB_LABELS[t]}
                </div>
              </PulseGlassRow>
            )
          })}
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
    </div>
  )
}
