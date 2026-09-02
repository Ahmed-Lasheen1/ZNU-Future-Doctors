import { supabase } from '../supabase'

// Shared lessons cache, same pattern as src/lib/subjects.js —
// SubjectPage and LessonPage were each independently querying
// `lessons` on every navigation with no caching at all. (MCQ.tsx has
// its own separate localStorage-based lessons cache for its offline
// story with a leaner column selection — left untouched here rather
// than risking that page's offline behavior.)
let cache = null
let inFlight = null

async function ensureLoaded() {
  if (cache) return { lessons: cache, error: null }
  if (!inFlight) {
    inFlight = supabase.from('lessons').select('*').then(res => {
      inFlight = null
      return res
    })
  }
  const { data, error } = await inFlight
  if (error) return { lessons: [], error }
  cache = data || []
  return { lessons: cache, error: null }
}

export async function fetchLessonsForSubject(subjectId) {
  const { lessons, error } = await ensureLoaded()
  if (error) return { lessons: [], error }
  const filtered = lessons
    .filter(l => l.subject_id === subjectId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  return { lessons: filtered, error: null }
}

export async function fetchLessonById(lessonId) {
  const { lessons, error } = await ensureLoaded()
  if (error) return { lesson: null, error }
  return { lesson: lessons.find(l => l.id === lessonId) || null, error: null }
}

// Called by Admin after any lesson create/update/delete so students
// who navigate right after an edit get fresh data instead of a stale
// in-memory copy for the rest of their session.
export function invalidateLessonsCache() {
  cache = null
}
