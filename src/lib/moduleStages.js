import { supabase } from '../supabase'
import { EXAM_STAGES as DEFAULT_STAGES } from './examStages'

// A module with no rows in module_exam_stages just uses the 4 global
// defaults — nothing to set up, nothing that can break. Once an admin
// saves a custom set for a module (see Admin.jsx "Stages" tab), that
// module always uses its own set from then on.
export async function fetchModuleStages(moduleId) {
  if (!moduleId) return DEFAULT_STAGES
  const { data, error } = await supabase
    .from('module_exam_stages')
    .select('value, title, emoji, color')
    .eq('module_id', moduleId)
    .order('position')

  if (error || !data || data.length === 0) return DEFAULT_STAGES
  return data
}

const FALLBACK_STAGE = { value: 'general', title: 'General', emoji: '📌', color: '#64748b' }

export function stageMetaFrom(stages, value) {
  return stages.find(s => s.value === value) || FALLBACK_STAGE
}
