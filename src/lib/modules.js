import { supabase } from '../supabase'

// Same load-and-sort logic that used to be duplicated in App.jsx and
// Admin.jsx (active modules first, then completed), now lives in one place.
export async function fetchModulesSorted() {
  const { data, error } = await supabase
    .from('modules')
    .select('*')
    .order('status')
    .order('created_at', { ascending: false })

  if (error || !data) return { modules: [], error }

  const sorted = [
    ...data.filter(m => m.status === 'active'),
    ...data.filter(m => m.status !== 'active')
  ]
  return { modules: sorted, error: null }
}
