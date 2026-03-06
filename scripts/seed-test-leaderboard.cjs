const fs = require('fs')
const path = require('path')

const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const equalIndex = trimmed.indexOf('=')
    if (equalIndex <= 0) continue
    const key = trimmed.slice(0, equalIndex).trim()
    let value = trimmed.slice(equalIndex + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!(key in process.env)) {
      process.env[key] = value
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const restBase = `${supabaseUrl.replace(/\/$/, '')}/rest/v1`

const restHeaders = {
  apikey: serviceRoleKey,
  Authorization: `Bearer ${serviceRoleKey}`,
}

const restGet = async (pathAndQuery) => {
  const response = await fetch(`${restBase}${pathAndQuery}`, {
    method: 'GET',
    headers: {
      ...restHeaders,
    },
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`GET ${pathAndQuery} failed (${response.status}): ${body}`)
  }

  return response.json()
}

const restDelete = async (pathAndQuery) => {
  const response = await fetch(`${restBase}${pathAndQuery}`, {
    method: 'DELETE',
    headers: {
      ...restHeaders,
      Prefer: 'return=minimal',
    },
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`DELETE ${pathAndQuery} failed (${response.status}): ${body}`)
  }
}

const restInsert = async (table, rows) => {
  const response = await fetch(`${restBase}/${table}`, {
    method: 'POST',
    headers: {
      ...restHeaders,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(rows),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`POST /${table} failed (${response.status}): ${body}`)
  }
}

const normalizeGameKey = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')

const slug = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 32)

const msToDisplay = (ms) => {
  const safeMs = Math.max(0, Number(ms || 0))
  const minutes = Math.floor(safeMs / 60000)
  const seconds = Math.floor((safeMs % 60000) / 1000)
  const millis = safeMs % 1000
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`
}

const hashString = (text) => {
  let hash = 0
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0
  }
  return hash
}

const unique = (values) => {
  const seen = new Set()
  const out = []
  for (const value of values) {
    const trimmed = String(value || '').trim()
    if (!trimmed || seen.has(trimmed)) continue
    seen.add(trimmed)
    out.push(trimmed)
  }
  return out
}

const loadCatalog = async () => {
  const data = await restGet('/site_settings?select=key,value_text&key=in.(default_game_catalog,default_games,default_tracks,default_cars)')

  const byKey = new Map((data || []).map((row) => [row.key, row.value_text || '']))

  const catalogRaw = byKey.get('default_game_catalog') || ''
  if (catalogRaw) {
    try {
      const parsed = JSON.parse(catalogRaw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        const cleaned = parsed
          .map((node) => ({
            game: normalizeGameKey(node?.game),
            tracks: unique(Array.isArray(node?.tracks) ? node.tracks : []),
            cars: unique(Array.isArray(node?.cars) ? node.cars : []),
          }))
          .filter((node) => node.game && node.tracks.length > 0)

        if (cleaned.length > 0) return cleaned
      }
    } catch (parseError) {
      throw new Error(`Invalid default_game_catalog JSON: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`)
    }
  }

  const defaultGames = unique((byKey.get('default_games') || '').split(/\r?\n|,/))
    .map((item) => normalizeGameKey(item))
    .filter(Boolean)
  const defaultTracks = unique((byKey.get('default_tracks') || '').split(/\r?\n|,/))
  const defaultCars = unique((byKey.get('default_cars') || '').split(/\r?\n|,/))

  if (defaultGames.length === 0 || defaultTracks.length === 0) {
    throw new Error('No default_game_catalog found and flat defaults are empty. Configure defaults first in Admin.')
  }

  return defaultGames.map((game) => ({
    game,
    tracks: [...defaultTracks],
    cars: defaultCars,
  }))
}

const buildEntries = (catalog) => {
  const now = Date.now()
  const entries = []

  for (const node of catalog) {
    const cars = node.cars.length > 0 ? node.cars : ['Test Car Alpha', 'Test Car Beta']

    for (const track of node.tracks) {
      const key = `${node.game}|${track}`
      const seed = hashString(key)
      const baseMs = 58000 + (seed % 48000)

      const names = [
        `TEST_SEED_${node.game}_${slug(track)}_A`,
        `TEST_SEED_${node.game}_${slug(track)}_B`,
      ]

      for (let i = 0; i < 2; i += 1) {
        const lapTimeMs = baseMs + i * 777
        const createdAt = new Date(now - (seed % 86400000) - i * 60000).toISOString()

        entries.push({
          user_id: null,
          driver_name: names[i],
          game: node.game,
          track,
          car: cars[i % cars.length],
          lap_time_ms: lapTimeMs,
          lap_time_display: msToDisplay(lapTimeMs),
          screenshot_url: null,
          video_url: null,
          status: 'approved',
          rejection_reason: null,
          verified_by: null,
          verified_at: createdAt,
          created_at: createdAt,
          updated_at: createdAt,
        })
      }
    }
  }

  return entries
}

const insertInChunks = async (rows, chunkSize = 250) => {
  let inserted = 0
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize)
    await restInsert('leaderboard_entries', chunk)
    inserted += chunk.length
  }
  return inserted
}

async function main() {
  console.log('Loading defaults catalog...')
  const catalog = await loadCatalog()

  const trackCount = catalog.reduce((sum, node) => sum + node.tracks.length, 0)
  const gameCount = catalog.length

  console.log(`Found ${gameCount} games and ${trackCount} tracks in defaults.`)

  console.log('Cleaning previous seeded entries...')
  await restDelete('/leaderboard_entries?driver_name=like.TEST_SEED_*')

  const rows = buildEntries(catalog)
  console.log(`Prepared ${rows.length} rows (2 per track).`)

  const inserted = await insertInChunks(rows)
  console.log(`Inserted ${inserted} approved leaderboard rows.`)

  console.log('Seed complete.')
}

main().catch((error) => {
  console.error(error.message || error)
  process.exit(1)
})
