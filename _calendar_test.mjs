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
  if (expired) console.log('>>> TOKEN EXPIRED — grab a fresh one and pass it: node _calendar_test.mjs <TOKEN>\n')
} catch {}

// Window: today 00:00 → +180d (same shape the app uses).
const startTime = new Date(new Date().setHours(0, 0, 0, 0)).getTime()
const endTime = startTime + 180 * 86400_000

async function call(path, params) {
  const qs = new URLSearchParams({ locationId: LOCATION, startTime: String(startTime), endTime: String(endTime), ...params })
  const res = await fetch(`${BASE}${path}?${qs}`, {
    headers: { accept: 'application/json, text/plain, */*', 'content-type': 'application/json',
      channel: 'APP', source: 'WEB_USER', version: '2021-07-28', 'token-id': TOKEN },
  })
  const text = await res.text()
  if (!res.ok) return { ok: false, status: res.status, body: text.slice(0, 300) }
  let json; try { json = JSON.parse(text) } catch { json = {} }
  return { ok: true, events: json.events ?? [] }
}

async function probe(path, label) {
  console.log(`\n===== ${label} (${path}) =====`)
  const byCal = await call(path, { calendarId: CALENDAR_ID })
  if (!byCal.ok) { console.log(`calendarId call FAILED: ${byCal.status} ${byCal.body}`); return }
  const users = [...new Set(byCal.events.map(e => e.assignedUserId).filter(Boolean))]
  console.log(`by calendarId: count=${byCal.events.length}, uniqueAssignedUserIds=${users.length}`, users)
  let sum = 0
  for (const u of users) {
    const r = await call(path, { userId: u })
    if (!r.ok) { console.log(`  userId=${u} FAILED ${r.status}`); continue }
    console.log(`  by userId=${u}: count=${r.events.length}`); sum += r.events.length
  }
  console.log(`SUM per-user=${sum}  vs  byCalendar=${byCal.events.length}  → ${sum === byCal.events.length ? 'MATCH ✅' : 'DIFF ⚠️'}`)
}

await probe('calendars/events', 'EVENTS')
await probe('calendars/blocked-slots', 'BLOCKED-SLOTS')
