import { readFileSync } from 'node:fs'

// Token: CLI arg wins, else .env. Location + base from .env.
const env = Object.fromEntries(
  readFileSync('.env', 'utf8').split(/\r?\n/).filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)
const TOKEN = process.argv[2] || env.VITE_GHL_DEV_TOKEN
const LOCATION = env.VITE_GHL_LOCATION_ID
const BASE = (env.VITE_GHL_API_BASE || 'https://services.leadconnectorhq.com/').replace(/\/?$/, '/')
const CALENDAR_ID = process.argv[3] || '3bv9lEsicKha1s9e4HJc'

try {
  const p = JSON.parse(Buffer.from(TOKEN.split('.')[1], 'base64').toString())
  const expired = p.exp * 1000 < Date.now()
  console.log(`token exp: ${new Date(p.exp * 1000).toISOString()}  expired=${expired}`)
  if (expired) console.log('>>> TOKEN EXPIRED — pass a fresh one: node _calendar_test.mjs <TOKEN>\n')
} catch {}

const startTime = new Date(new Date().setHours(0, 0, 0, 0)).getTime()
const endTime = startTime + 180 * 86400_000

async function api(path, params) {
  const qs = new URLSearchParams({ locationId: LOCATION, ...params })
  const res = await fetch(`${BASE}${path}?${qs}`, {
    headers: { accept: 'application/json, text/plain, */*', 'content-type': 'application/json',
      channel: 'APP', source: 'WEB_USER', version: '2021-07-28', 'token-id': TOKEN },
  })
  const text = await res.text()
  if (!res.ok) return { ok: false, status: res.status, body: text.slice(0, 300) }
  let json; try { json = JSON.parse(text) } catch { json = {} }
  return { ok: true, json }
}

// 1) Enumerate ALL calendars — reveals whether reps could be spread across several.
async function listCalendars() {
  console.log('\n===== CALENDARS in this location =====')
  const r = await api('calendars/', {})
  if (!r.ok) return console.log(`calendars list FAILED: ${r.status} ${r.body}`)
  const cals = r.json.calendars ?? r.json.data ?? []
  console.log(`count=${cals.length}`)
  for (const c of cals) console.log(`  - ${c.id ?? c._id}  "${c.name ?? ''}"  active=${c.isActive ?? c.active ?? '?'}`)
  console.log('response keys:', Object.keys(r.json))
}

// 2) For an endpoint: fetch by calendarId, then re-fetch per assignedUserId and compare.
async function probe(path, label) {
  console.log(`\n===== ${label} (${path}) =====`)
  const cal = await api(path, { calendarId: CALENDAR_ID, startTime: String(startTime), endTime: String(endTime) })
  if (!cal.ok) return console.log(`calendarId call FAILED: ${cal.status} ${cal.body}`)
  const events = cal.json.events ?? []
  const users = [...new Set(events.map(e => e.assignedUserId).filter(Boolean))]
  console.log(`by calendarId: count=${events.length}, uniqueAssignedUserIds=${users.length}`, users)
  console.log('response keys (look for total/meta/next):', Object.keys(cal.json))
  let sum = 0
  for (const u of users) {
    const r = await api(path, { userId: u, startTime: String(startTime), endTime: String(endTime) })
    const n = r.ok ? (r.json.events ?? []).length : `FAIL ${r.status}`
    console.log(`  by userId=${u}: count=${n}`); if (typeof n === 'number') sum += n
  }
  console.log(`SUM per-user=${sum}  vs  byCalendar=${events.length}  → ${sum === events.length ? 'MATCH ✅' : 'DIFF ⚠️'}`)
}

await listCalendars()
await probe('calendars/events', 'EVENTS')
await probe('calendars/blocked-slots', 'BLOCKED-SLOTS')
