import { supabase } from '../supabase'

// نفس منطق تحميل وترتيب الموديولز اللي كان مكرر في App.jsx و Admin.jsx
// (الأكتيف الأول، بعدين الكومبليتد)، دلوقتي في مكان واحد بس.
export async function fetchModulesSorted() {
  const { data, error } = await supabase
    .from('modules')
    .select('*')
    .order('status')
    .order('created_at')

  if (error || !data) return { modules: [], error }

  const sorted = [
    ...data.filter(m => m.status === 'active'),
    ...data.filter(m => m.status !== 'active')
  ]
  return { modules: sorted, error: null }
}
