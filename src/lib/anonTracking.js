// Lets someone who submitted an anonymous question later check whether
// it's been answered — without any account or revealing who they are
// to anyone else (including the admin). A random token is generated
// client-side at submit time, saved once in the `anonymous_questions`
// row itself and once here in this browser's localStorage. Nobody
// else ever sees the token (it's never rendered in the UI), so only
// this specific browser can match its own saved tokens back to the
// question list and recognize "this one is mine".
const KEY = 'my_anon_questions'
const NOTIFIED_KEY = 'anon_notified_tokens'

export function getMyAnonTokens() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}

export function addMyAnonToken(token) {
  const list = getMyAnonTokens()
  list.push(token)
  localStorage.setItem(KEY, JSON.stringify(list))
}

export function getNotifiedTokens() {
  try { return JSON.parse(localStorage.getItem(NOTIFIED_KEY) || '[]') } catch { return [] }
}

export function markTokensNotified(tokens) {
  const existing = getNotifiedTokens()
  localStorage.setItem(NOTIFIED_KEY, JSON.stringify([...existing, ...tokens]))
}
