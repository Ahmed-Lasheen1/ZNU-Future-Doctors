// src/lib/subjects.js
import { supabase } from '../supabase'

// Shared subjects cache — subjects change rarely (only via Admin's
// Subjects tab), but ModulePage, StagePage, SubjectPage, and
// LessonPage were each independently querying `subjects` on every
// navigation. This caches the full table in memory for the lifetime
// of the tab and lets any page ask for "subjects for this module" or
// "one subject by id" without a fresh round trip each time.
//
// Deliberately in-memory only (not localStorage) — unlike MCQ's
// offline cache, there's no offline-browsing need here, and an
// in-memory cache automatically clears itself on full page reload,
// so there's no staleness risk beyond "within this same browser tab
// session." Admin edits are reflected on the admin's own next reload
// (Admin.jsx already refetches its own copy directly) and for
// students on their next full page load.
let cache = null
let inFlight = null

async function ensureLoaded() {
  if (cache) return { subjects: cache, error: null }
  if (!inFlight) {
    inFlight = supabase.from('subjects').select('*').order('name').then(res => {
      inFlight = null
      return res
    })
  }
  const { data, error } = await inFlight
  if (error) return { subjects: [], error }
  cache = data || []
  return { subjects: cache, error: null }
}

export async function fetchSubjectsForModule(moduleId) {
  const { subjects, error } = await ensureLoaded()
  return { subjects: subjects.filter(s => s.module_id === moduleId), error }
}

export async function fetchSubjectById(subjectId) {
  const { subjects, error } = await ensureLoaded()
  if (error) return { subject: null, error }
  return { subject: subjects.find(s => s.id === subjectId) || null, error: null }
}

// Called by Admin after any subject create/update/delete so students
// who navigate right after an edit get fresh data instead of a stale
// in-memory copy for the rest of their session.
export function invalidateSubjectsCache() {
  cache = null
}
