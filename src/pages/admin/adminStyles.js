// Shared across every admin tab — was previously duplicated at the
// bottom of the single Admin.jsx file. Cap on list queries (files,
// schedules, questions, summaries) so tabs stay fast as content grows;
// bump this if a tab genuinely needs more rows listed at once.
export const LIST_LIMIT = 200

export const btnStyle = { width: '100%', padding: '12px', background: '#38bdf8', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', color: '#0f172a', fontFamily: 'inherit', fontSize: 14 }
export const miniBtn = { background: 'transparent', border: '1px solid', padding: '4px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700 }
export const cancelBtnStyle = (c) => ({ padding: '12px 20px', background: 'transparent', border: `1px solid ${c.border}`, borderRadius: 10, cursor: 'pointer', color: c.sub, fontFamily: 'inherit', fontSize: 14, fontWeight: 700 })
