import { supabase } from '../supabase'
import { getGuestActiveExam, saveGuestActiveExam, clearGuestActiveExam } from './reviewStorage'

// Shared paused-exam persistence (Supabase for signed-in users,
// localStorage for guests). Used by MCQ.jsx to save/resume a
// mid-quiz, and by Home.jsx to show a "continue where you left off"
// card without duplicating this logic in two places.
export async function loadSavedActiveExam(user) {
  if (user) {
    const { data } = await supabase.from('active_exams').select('exam_data').eq('user_id', user.id).maybeSingle()
    return data?.exam_data || null
  }
  return getGuestActiveExam()
}

export async function persistActiveExam(user, payload) {
  if (user) {
    await supabase.from('active_exams').upsert(
      { user_id: user.id, exam_data: payload, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
  } else {
    saveGuestActiveExam(payload)
  }
}

export async function clearActiveExam(user) {
  if (user) await supabase.from('active_exams').delete().eq('user_id', user.id)
  else clearGuestActiveExam()
}
