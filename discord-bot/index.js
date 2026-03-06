require('dotenv').config()
const { Client, GatewayIntentBits, EmbedBuilder, PermissionFlagsBits } = require('discord.js')
const fs = require('fs/promises')
const path = require('path')

const token = process.env.DISCORD_TOKEN
const apiBaseUrl = process.env.API_BASE_URL || 'https://kraken-motor-sports.vercel.app'
const legacyUpdatesChannelId = process.env.DISCORD_UPDATES_CHANNEL_ID
const eventsUpdatesChannelId = process.env.DISCORD_EVENTS_CHANNEL_ID || legacyUpdatesChannelId
const leaderboardUpdatesChannelId = process.env.DISCORD_LEADERBOARD_CHANNEL_ID || legacyUpdatesChannelId
const nightlyHour = Number(process.env.NIGHTLY_UPDATE_HOUR ?? 21)
const nightlyMinute = Number(process.env.NIGHTLY_UPDATE_MINUTE ?? 0)
const nightlyTimeZone = process.env.NIGHTLY_UPDATE_TIMEZONE || 'UTC'
const stateFilePath = path.join(__dirname, 'nightly-state.json')
const queueStateFilePath = path.join(__dirname, 'sim-queue-state.json')
const siteUrl = 'https://kraken-motor-sports.vercel.app'
const simulatorCount = Math.max(1, Number(process.env.SIMULATOR_COUNT ?? 1))
const defaultSessionMinutes = Math.max(10, Number(process.env.DEFAULT_SESSION_MINUTES ?? 20))
const queueStaffRoleIds = (process.env.QUEUE_STAFF_ROLE_IDS || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean)

if (!token) {
  console.error('Missing DISCORD_TOKEN in .env')
  process.exit(1)
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] })

const normalizeGameKey = (value = '') =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')

const GAME_KEY_ALIASES = {
  mariokart: 'mario_kart_wii',
  mario_kart: 'mario_kart_wii',
  mk_wii: 'mario_kart_wii',
  mkwii: 'mario_kart_wii',
  forza_horizon: 'forza_horizon_5',
  forza_4: 'forza_horizon_4',
  forza_5: 'forza_horizon_5',
  fh4: 'forza_horizon_4',
  fh5: 'forza_horizon_5',
  forza_motorsport: 'forza_motorsport_2023',
  forza_motorsport_8: 'forza_motorsport_2023',
  fm7: 'forza_motorsport_7',
}

const normalizeGameForApi = (value) => {
  const normalized = normalizeGameKey(value)
  return GAME_KEY_ALIASES[normalized] || normalized
}

const toTitleCase = (value) =>
  value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

const toLocalDateTime = (isoString) => new Date(isoString).toLocaleString()

const getTimeZoneParts = (date, timeZone) => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const parts = formatter.formatToParts(date)
  const mapped = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]))

  return {
    year: Number(mapped.year),
    month: Number(mapped.month),
    day: Number(mapped.day),
    hour: Number(mapped.hour),
    minute: Number(mapped.minute),
    dateKey: `${mapped.year}-${mapped.month}-${mapped.day}`,
  }
}

const loadState = async () => {
  try {
    const raw = await fs.readFile(stateFilePath, 'utf8')
    return JSON.parse(raw)
  } catch {
    return {
      lastRunDate: null,
      events: [],
      leaderboard: [],
    }
  }
}

const saveState = async (state) => {
  await fs.writeFile(stateFilePath, JSON.stringify(state, null, 2), 'utf8')
}

const loadQueueState = async () => {
  try {
    const raw = await fs.readFile(queueStateFilePath, 'utf8')
    const parsed = JSON.parse(raw)
    const waiting = Array.isArray(parsed.waiting)
      ? parsed.waiting
      : Array.isArray(parsed.entries)
      ? parsed.entries
      : []
    const active = Array.isArray(parsed.active) ? parsed.active : []
    return { waiting, active }
  } catch {
    return { waiting: [], active: [] }
  }
}

const saveQueueState = async (state) => {
  await fs.writeFile(
    queueStateFilePath,
    JSON.stringify(
      {
        updatedAt: new Date().toISOString(),
        waiting: state.waiting,
        active: state.active,
      },
      null,
      2
    ),
    'utf8'
  )
}

const formatQueueEntry = (entry, index) => {
  const bits = [
    `**${entry.displayName}**`,
    `Game: ${entry.game}`,
    `Session: ${entry.minutes || defaultSessionMinutes}m`,
    entry.eta ? `ETA: ${entry.eta}` : null,
  ].filter(Boolean)

  return `${index + 1}. ${bits.join(' • ')}`
}

const getAverageSessionMinutes = (entries) => {
  const values = entries
    .map((entry) => Number(entry.minutes || defaultSessionMinutes))
    .filter((value) => Number.isFinite(value) && value > 0)

  if (values.length === 0) return defaultSessionMinutes
  const total = values.reduce((sum, value) => sum + value, 0)
  return Math.round(total / values.length)
}

const estimateQueueWait = (position, averageSessionMins) => Math.max(0, Math.floor((position / simulatorCount) * averageSessionMins))

const isQueueStaff = (interaction) => {
  const hasStaffPermission =
    interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) ||
    interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)

  if (hasStaffPermission) return true
  if (!interaction.inGuild() || queueStaffRoleIds.length === 0) return false

  const memberRoleIds = interaction.member?.roles?.cache ? [...interaction.member.roles.cache.keys()] : []
  return memberRoleIds.some((roleId) => queueStaffRoleIds.includes(roleId))
}

const fetchEvents = async (limit = 5, game) => {
  const url = new URL('/api/public/events', apiBaseUrl)
  url.searchParams.set('limit', String(limit))
  if (game) url.searchParams.set('game', normalizeGameForApi(game))

  const response = await fetch(url)
  if (!response.ok) throw new Error(`Events API returned ${response.status}`)

  const payload = await response.json()
  return payload.events || []
}

const fetchLeaderboardOptions = async (type, queryText, game, defaultsOnly = false) => {
  const url = new URL('/api/public/leaderboard/options', apiBaseUrl)
  url.searchParams.set('type', type)
  url.searchParams.set('limit', '25')
  if (queryText) url.searchParams.set('q', queryText)
  if (game) url.searchParams.set('game', normalizeGameForApi(game))
  if (defaultsOnly) url.searchParams.set('defaults_only', 'true')

  const response = await fetch(url)
  if (!response.ok) throw new Error(`Leaderboard options API returned ${response.status}`)

  const payload = await response.json()
  return payload.options || []
}

const fetchLeaderboard = async ({ limit = 5, game, track, car, eventId } = {}) => {
  const url = new URL('/api/public/leaderboard', apiBaseUrl)
  url.searchParams.set('limit', String(limit))
  if (game) url.searchParams.set('game', normalizeGameForApi(game))
  if (track) url.searchParams.set('track', track)
  if (car) url.searchParams.set('car', car)
  if (eventId) url.searchParams.set('event_id', eventId)

  const response = await fetch(url)
  if (!response.ok) throw new Error(`Leaderboard API returned ${response.status}`)

  const payload = await response.json()
  return {
    leaderboard: payload.leaderboard || [],
    eventFilter: payload.event_filter || null,
  }
}

const sortLeaderboardEntries = (entries, sortBy = 'lap_time', order = 'asc') => {
  const direction = order === 'desc' ? -1 : 1

  const sorted = [...entries].sort((left, right) => {
    if (sortBy === 'submitted_at') {
      const leftTs = new Date(left.created_at).getTime()
      const rightTs = new Date(right.created_at).getTime()
      return (leftTs - rightTs) * direction
    }

    if (sortBy === 'driver') {
      return left.driver_name.localeCompare(right.driver_name) * direction
    }

    if (sortBy === 'track') {
      return left.track.localeCompare(right.track) * direction
    }

    if (sortBy === 'game') {
      return left.game.localeCompare(right.game) * direction
    }

    const leftTime = Number(left.lap_time_ms || 0)
    const rightTime = Number(right.lap_time_ms || 0)
    return (leftTime - rightTime) * direction
  })

  return sorted.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }))
}

const getSortLabel = (sortBy = 'lap_time', order = 'asc') => {
  const fieldLabel =
    sortBy === 'submitted_at'
      ? 'Submitted Time'
      : sortBy === 'driver'
      ? 'Driver'
      : sortBy === 'track'
      ? 'Track'
      : sortBy === 'game'
      ? 'Game'
      : 'Lap Time'

  return `${fieldLabel} (${order.toUpperCase()})`
}

const normalizeDriverName = (value = '') => value.trim().toLowerCase()

const getRankBonus = (rank) => {
  if (rank === 1) return 25
  if (rank === 2) return 18
  if (rank === 3) return 15
  if (rank <= 5) return 10
  if (rank <= 10) return 5
  return 2
}

const getEntryPoints = (entry) => {
  const completionPoints = 10
  const rankBonus = getRankBonus(Number(entry.rank || 999))
  return completionPoints + rankBonus
}

const getLevelForPoints = (points) => Math.floor(Math.sqrt(Math.max(points, 0) / 50)) + 1

const formatMsDuration = (milliseconds) => {
  const safeMs = Math.max(0, Number(milliseconds || 0))
  const totalSeconds = Math.floor(safeMs / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`
  }

  return `${minutes}m ${seconds}s`
}

const buildAchievements = ({ lapsCount, wins, podiums, topTenCount, uniqueTracksCount, points }) => {
  const achievements = []

  if (lapsCount >= 1) achievements.push('First Blood')
  if (topTenCount >= 1) achievements.push('Top 10 Driver')
  if (podiums >= 1) achievements.push('Podium Finisher')
  if (wins >= 1) achievements.push('Race Winner')
  if (lapsCount >= 5) achievements.push('Consistent Racer')
  if (lapsCount >= 20) achievements.push('Season Veteran')
  if (uniqueTracksCount >= 5) achievements.push('Track Explorer')
  if (points >= 500) achievements.push('Point Grinder')

  return achievements
}

const getCurrentSeasonKey = () => {
  const now = new Date()
  const year = now.getUTCFullYear()
  const month = String(now.getUTCMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

const isEntryInSeason = (entry, seasonKey) => {
  const createdAt = entry.created_at
  if (!createdAt) return false
  return String(createdAt).slice(0, 7) === seasonKey
}

const buildDriverProfile = (entries, driverName) => {
  const normalizedTarget = normalizeDriverName(driverName)
  const driverEntries = entries.filter((entry) => normalizeDriverName(entry.driver_name) === normalizedTarget)

  if (driverEntries.length === 0) {
    return null
  }

  const lapsCount = driverEntries.length
  const points = driverEntries.reduce((sum, entry) => sum + getEntryPoints(entry), 0)
  const level = getLevelForPoints(points)
  const topTenCount = driverEntries.filter((entry) => Number(entry.rank) <= 10).length
  const podiums = driverEntries.filter((entry) => Number(entry.rank) <= 3).length
  const wins = driverEntries.filter((entry) => Number(entry.rank) === 1).length
  const uniqueTracksCount = new Set(driverEntries.map((entry) => entry.track)).size
  const bestLapMs = Math.min(...driverEntries.map((entry) => Number(entry.lap_time_ms || Number.MAX_SAFE_INTEGER)))
  const totalLapMs = driverEntries.reduce((sum, entry) => sum + Number(entry.lap_time_ms || 0), 0)
  const achievements = buildAchievements({
    lapsCount,
    wins,
    podiums,
    topTenCount,
    uniqueTracksCount,
    points,
  })

  return {
    displayName: driverEntries[0].driver_name,
    points,
    level,
    lapsCount,
    topTenCount,
    podiums,
    wins,
    uniqueTracksCount,
    bestLapMs,
    totalLapMs,
    achievements,
  }
}

const buildSeasonLeaderboard = (entries, seasonKey) => {
  const seasonEntries = entries.filter((entry) => isEntryInSeason(entry, seasonKey))
  const rankedSeasonEntries = sortLeaderboardEntries(seasonEntries, 'lap_time', 'asc')
  const aggregates = new Map()

  rankedSeasonEntries.forEach((entry) => {
    const key = normalizeDriverName(entry.driver_name)
    const existing = aggregates.get(key) || {
      driverName: entry.driver_name,
      points: 0,
      lapsCount: 0,
      wins: 0,
      podiums: 0,
      topTenCount: 0,
      bestLapMs: Number.MAX_SAFE_INTEGER,
    }

    const rank = Number(entry.rank || 999)
    existing.points += getEntryPoints(entry)
    existing.lapsCount += 1
    if (rank === 1) existing.wins += 1
    if (rank <= 3) existing.podiums += 1
    if (rank <= 10) existing.topTenCount += 1
    existing.bestLapMs = Math.min(existing.bestLapMs, Number(entry.lap_time_ms || Number.MAX_SAFE_INTEGER))

    aggregates.set(key, existing)
  })

  return [...aggregates.values()]
    .sort((left, right) => {
      if (right.points !== left.points) return right.points - left.points
      if (right.wins !== left.wins) return right.wins - left.wins
      return left.bestLapMs - right.bestLapMs
    })
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
      level: getLevelForPoints(entry.points),
    }))
}

const getEventChanges = (previousEvents, latestEvents) => {
  const previousIds = new Set(previousEvents.map((event) => event.id))
  return latestEvents.filter((event) => !previousIds.has(event.id))
}

const getLeaderboardChanges = (previousLeaderboard, latestLeaderboard) => {
  const previousById = new Map(previousLeaderboard.map((entry) => [entry.id, entry]))

  const newEntries = latestLeaderboard.filter((entry) => !previousById.has(entry.id))
  const rankMovements = latestLeaderboard
    .map((entry) => {
      const previous = previousById.get(entry.id)
      if (!previous || previous.rank === entry.rank) return null
      return {
        id: entry.id,
        driver_name: entry.driver_name,
        game: entry.game,
        from: previous.rank,
        to: entry.rank,
        lap_time_display: entry.lap_time_display,
      }
    })
    .filter(Boolean)

  return {
    newEntries,
    rankMovements,
  }
}

const postEventsNightlyUpdate = async (newEvents) => {
  if (!eventsUpdatesChannelId || newEvents.length === 0) {
    return
  }

  const channel = await client.channels.fetch(eventsUpdatesChannelId)
  if (!channel || !channel.isTextBased()) {
    throw new Error('DISCORD_EVENTS_CHANNEL_ID is not a text channel')
  }

  const embed = new EmbedBuilder()
    .setTitle('Kraken Motorsports - Nightly Events Update')
    .setColor(0x00ffff)
    .setURL(siteUrl)
    .setTimestamp(new Date())

  const eventLines = newEvents
    .slice(0, 5)
    .map((event) => `• **${event.title}** (${event.game}) — ${toLocalDateTime(event.start_date)}`)
    .join('\n')

  embed.addFields({
    name: `New Events (${newEvents.length})`,
    value: eventLines,
    inline: false,
  })

  await channel.send({ embeds: [embed] })
}

const postLeaderboardNightlyUpdate = async (leaderboardChanges) => {
  const hasLeaderboardChanges = leaderboardChanges.newEntries.length > 0 || leaderboardChanges.rankMovements.length > 0
  if (!leaderboardUpdatesChannelId || !hasLeaderboardChanges) {
    return
  }

  const channel = await client.channels.fetch(leaderboardUpdatesChannelId)
  if (!channel || !channel.isTextBased()) {
    throw new Error('DISCORD_LEADERBOARD_CHANNEL_ID is not a text channel')
  }

  const embed = new EmbedBuilder()
    .setTitle('Kraken Motorsports - Nightly Leaderboard Update')
    .setColor(0xff00ff)
    .setURL(siteUrl)
    .setTimestamp(new Date())

  if (leaderboardChanges.newEntries.length > 0) {
    const newEntryLines = leaderboardChanges.newEntries
      .slice(0, 5)
      .map((entry) => `• #${entry.rank} **${entry.driver_name}** (${entry.game}) — ${entry.lap_time_display}`)
      .join('\n')

    embed.addFields({
      name: `New Leaderboard Entries (${leaderboardChanges.newEntries.length})`,
      value: newEntryLines,
      inline: false,
    })
  }

  if (leaderboardChanges.rankMovements.length > 0) {
    const movementLines = leaderboardChanges.rankMovements
      .slice(0, 7)
      .map((entry) => `• **${entry.driver_name}** moved #${entry.from} → #${entry.to} (${entry.game})`)
      .join('\n')

    embed.addFields({
      name: `Leaderboard Position Changes (${leaderboardChanges.rankMovements.length})`,
      value: movementLines,
      inline: false,
    })
  }

  await channel.send({ embeds: [embed] })
}

const runNightlyCheck = async () => {
  const state = await loadState()
  const latestEvents = await fetchEvents(25)
  const latestLeaderboardResponse = await fetchLeaderboard({ limit: 25 })
  const latestLeaderboard = latestLeaderboardResponse.leaderboard

  if ((state.events?.length ?? 0) === 0 && (state.leaderboard?.length ?? 0) === 0) {
    await saveState({
      ...state,
      events: latestEvents,
      leaderboard: latestLeaderboard,
    })
    return
  }

  const newEvents = getEventChanges(state.events || [], latestEvents)
  const leaderboardChanges = getLeaderboardChanges(state.leaderboard || [], latestLeaderboard)

  await postEventsNightlyUpdate(newEvents)
  await postLeaderboardNightlyUpdate(leaderboardChanges)

  await saveState({
    ...state,
    events: latestEvents,
    leaderboard: latestLeaderboard,
  })
}

const startNightlyScheduler = () => {
  if (!eventsUpdatesChannelId && !leaderboardUpdatesChannelId) {
    console.log('Nightly updates disabled: set DISCORD_EVENTS_CHANNEL_ID and/or DISCORD_LEADERBOARD_CHANNEL_ID in .env')
    return
  }

  console.log(
    `Nightly updates enabled at ${String(nightlyHour).padStart(2, '0')}:${String(nightlyMinute).padStart(2, '0')} (${nightlyTimeZone}) | events channel: ${eventsUpdatesChannelId || 'not set'} | leaderboard channel: ${leaderboardUpdatesChannelId || 'not set'}`
  )

  setInterval(async () => {
    try {
      const state = await loadState()
      const nowParts = getTimeZoneParts(new Date(), nightlyTimeZone)
      const alreadyRanToday = state.lastRunDate === nowParts.dateKey

      if (alreadyRanToday) {
        return
      }

      if (nowParts.hour === nightlyHour && nowParts.minute === nightlyMinute) {
        await runNightlyCheck()
        await saveState({
          ...(await loadState()),
          lastRunDate: nowParts.dateKey,
        })
      }
    } catch (error) {
      console.error('Nightly update check failed:', error)
    }
  }, 60 * 1000)
}

client.once('clientReady', () => {
  console.log(`Logged in as ${client.user.tag}`)
  startNightlyScheduler()
})

client.on('interactionCreate', async (interaction) => {
  if (interaction.isAutocomplete()) {
    try {
      const focused = interaction.options.getFocused(true)
      const commandOptionTypeMap = {
        events: {
          game: 'games',
        },
        leaderboard: {
          game: 'games',
          track: 'tracks',
          car: 'cars',
          event_id: 'events',
        },
        season_leaderboard: {
          game: 'games',
          track: 'tracks',
          car: 'cars',
        },
        profile: {
          game: 'games',
        },
        queue_join: {
          game: 'games',
        },
        queue_list: {
          game: 'games',
        },
        queue_status: {
          game: 'games',
        },
      }

      if (interaction.commandName === 'profile' && focused.name === 'driver_name') {
        const game = interaction.options.getString('game')
        const response = await fetchLeaderboard({ limit: 100, game })
        const query = String(focused.value || '').toLowerCase()
        const names = [...new Set(response.leaderboard.map((entry) => entry.driver_name).filter(Boolean))]
          .filter((name) => name.toLowerCase().includes(query))
          .slice(0, 25)
          .map((name) => ({ name, value: name }))

        await interaction.respond(names)
        return
      }

      const mappedType = commandOptionTypeMap[interaction.commandName]?.[focused.name]
      if (!mappedType) {
        await interaction.respond([])
        return
      }

      const selectedGameRaw = interaction.options.getString('game') || undefined
      const selectedGame = selectedGameRaw ? normalizeGameForApi(selectedGameRaw) : undefined
      const shouldScopeByGame = focused.name === 'track' || focused.name === 'car'
      const defaultsOnly = mappedType === 'games' || mappedType === 'tracks' || mappedType === 'cars'
      const options = await fetchLeaderboardOptions(
        mappedType,
        focused.value,
        shouldScopeByGame ? selectedGame : undefined,
        defaultsOnly
      )
      const choices = options.slice(0, 25).map((option) => ({ name: option.name, value: option.value }))
      await interaction.respond(choices)
      return
    } catch (error) {
      console.error('Autocomplete failed:', error)
      const alreadyAcknowledged =
        Boolean(interaction.responded) ||
        (typeof error === 'object' && error !== null && 'code' in error && Number(error.code) === 40060)

      if (!alreadyAcknowledged) {
        try {
          await interaction.respond([])
        } catch (respondError) {
          const isDuplicateAck =
            typeof respondError === 'object' &&
            respondError !== null &&
            'code' in respondError &&
            Number(respondError.code) === 40060

          if (!isDuplicateAck) {
            console.error('Autocomplete fallback response failed:', respondError)
          }
        }
      }
      return
    }
  }

  if (!interaction.isChatInputCommand()) {
    return
  }

  try {
    if (interaction.commandName === 'events') {
      await interaction.deferReply()

      const game = interaction.options.getString('game')
      const limit = interaction.options.getInteger('limit') || 5
      const events = await fetchEvents(limit, game)

      if (events.length === 0) {
        await interaction.editReply('No upcoming events found right now.')
        return
      }

      const embed = new EmbedBuilder()
        .setTitle('Kraken Motorsports - Upcoming Events')
        .setColor(0x00ffff)
        .setURL(siteUrl)
        .setTimestamp(new Date())

      events.forEach((event, index) => {
        const start = toLocalDateTime(event.start_date)
        const eventType = event.event_type ? toTitleCase(event.event_type) : 'Event'

        embed.addFields({
          name: `${index + 1}. ${event.title}`,
          value: `**Type:** ${eventType}\n**Game:** ${event.game}\n**Track:** ${event.track}\n**Start:** ${start}`,
          inline: false,
        })
      })

      await interaction.editReply({ embeds: [embed] })
      return
    }

    if (interaction.commandName === 'leaderboard') {
      await interaction.deferReply()

      const game = normalizeGameForApi(interaction.options.getString('game', true))
      const track = interaction.options.getString('track', true)
      const car = interaction.options.getString('car')
      const eventId = interaction.options.getString('event_id')
      const sortBy = interaction.options.getString('sort_by') || 'lap_time'
      const order = interaction.options.getString('order') || 'asc'
      const limit = interaction.options.getInteger('limit') || 5

      const response = await fetchLeaderboard({
        limit,
        game,
        track,
        car,
        eventId,
      })

      const sortedLeaderboard = sortLeaderboardEntries(response.leaderboard, sortBy, order)
      const leaderboard = sortedLeaderboard.slice(0, limit)

      if (leaderboard.length === 0) {
        await interaction.editReply('No approved leaderboard entries found yet.')
        return
      }

      const lines = leaderboard.map(
        (entry) =>
          `#${entry.rank} - **${entry.driver_name}** (${entry.game}) • ${entry.lap_time_display} • ${entry.track}`
      )

      const embed = new EmbedBuilder()
        .setTitle('Kraken Motorsports - Leaderboard')
        .setColor(0xff00ff)
        .setDescription(lines.join('\n'))
        .setURL(siteUrl)
        .setTimestamp(new Date())

      embed.addFields({
        name: 'Sort',
        value: getSortLabel(sortBy, order),
        inline: true,
      })

      const filterBits = [
        game ? `Game: ${game}` : null,
        track ? `Track: ${track}` : null,
        car ? `Car: ${car}` : null,
        response.eventFilter ? `Event: ${response.eventFilter.title}` : eventId ? `Event ID: ${eventId}` : null,
      ].filter(Boolean)

      if (filterBits.length > 0) {
        embed.addFields({
          name: 'Filters',
          value: filterBits.join(' | '),
          inline: false,
        })
      }

      await interaction.editReply({ embeds: [embed] })
      return
    }

    if (interaction.commandName === 'profile') {
      await interaction.deferReply()

      const driverName = interaction.options.getString('driver_name', true)
      const game = interaction.options.getString('game')
      const response = await fetchLeaderboard({
        limit: 100,
        game: game ? normalizeGameForApi(game) : undefined,
      })

      const rankedEntries = sortLeaderboardEntries(response.leaderboard, 'lap_time', 'asc')
      const profile = buildDriverProfile(rankedEntries, driverName)

      if (!profile) {
        await interaction.editReply(`No approved laps found for **${driverName}** yet.`)
        return
      }

      const embed = new EmbedBuilder()
        .setTitle(`Driver Profile - ${profile.displayName}`)
        .setColor(0x22c55e)
        .setURL(siteUrl)
        .setTimestamp(new Date())
        .setDescription(`Level **${profile.level}** • **${profile.points}** pts`)

      embed.addFields(
        {
          name: 'Performance',
          value: `Laps: **${profile.lapsCount}**\nWins: **${profile.wins}**\nPodiums: **${profile.podiums}**\nTop 10: **${profile.topTenCount}**`,
          inline: true,
        },
        {
          name: 'Stats',
          value: `Best Lap: **${formatMsDuration(profile.bestLapMs)}**\nTotal Lap Time: **${formatMsDuration(profile.totalLapMs)}**\nTracks: **${profile.uniqueTracksCount}**`,
          inline: true,
        },
        {
          name: 'Achievements',
          value: profile.achievements.length > 0 ? profile.achievements.join(' • ') : 'No achievements yet',
          inline: false,
        }
      )

      if (game) {
        embed.setFooter({ text: `Filtered by game: ${game}` })
      }

      await interaction.editReply({ embeds: [embed] })
      return
    }

    if (interaction.commandName === 'season_leaderboard') {
      await interaction.deferReply()

      const game = interaction.options.getString('game')
      const track = interaction.options.getString('track')
      const car = interaction.options.getString('car')
      const limit = interaction.options.getInteger('limit') || 5
      const seasonKey = getCurrentSeasonKey()

      const response = await fetchLeaderboard({
        limit: 100,
        game: game ? normalizeGameForApi(game) : undefined,
        track,
        car,
      })

      const seasonLeaderboard = buildSeasonLeaderboard(response.leaderboard, seasonKey).slice(0, limit)

      if (seasonLeaderboard.length === 0) {
        await interaction.editReply(`No approved laps found for season **${seasonKey}** with these filters.`)
        return
      }

      const lines = seasonLeaderboard.map(
        (entry) =>
          `#${entry.rank} - **${entry.driverName}** • ${entry.points} pts • L${entry.level} • ${entry.lapsCount} laps • ${entry.wins} wins`
      )

      const embed = new EmbedBuilder()
        .setTitle(`Season Leaderboard - ${seasonKey}`)
        .setColor(0xf59e0b)
        .setURL(siteUrl)
        .setDescription(lines.join('\n'))
        .setTimestamp(new Date())

      const filterBits = [
        game ? `Game: ${game}` : null,
        track ? `Track: ${track}` : null,
        car ? `Car: ${car}` : null,
      ].filter(Boolean)

      if (filterBits.length > 0) {
        embed.addFields({
          name: 'Filters',
          value: filterBits.join(' | '),
          inline: false,
        })
      }

      await interaction.editReply({ embeds: [embed] })
      return
    }

    if (interaction.commandName === 'queue_join') {
      await interaction.deferReply()

      const game = interaction.options.getString('game', true)
      const minutes = interaction.options.getInteger('minutes') || defaultSessionMinutes
      const eta = interaction.options.getString('eta') || null

      const queueState = await loadQueueState()
      const now = new Date().toISOString()
      const existingWaitingIndex = queueState.waiting.findIndex((entry) => entry.userId === interaction.user.id)
      const existingActiveIndex = queueState.active.findIndex((entry) => entry.userId === interaction.user.id)

      const nextEntry = {
        userId: interaction.user.id,
        displayName: interaction.user.globalName || interaction.user.username,
        game,
        minutes,
        eta,
        updatedAt: now,
      }

      if (existingWaitingIndex >= 0) {
        queueState.waiting[existingWaitingIndex] = nextEntry
      } else if (existingActiveIndex >= 0) {
        queueState.active[existingActiveIndex] = {
          ...queueState.active[existingActiveIndex],
          ...nextEntry,
          startedAt: queueState.active[existingActiveIndex].startedAt,
        }
      } else {
        queueState.waiting.push(nextEntry)
      }

      await saveQueueState(queueState)

      const position = queueState.waiting.findIndex((entry) => entry.userId === interaction.user.id)
      const queueAhead = position >= 0 ? position : 0
      const avgMinutes = getAverageSessionMinutes(queueState.waiting)
      const estimatedWait = estimateQueueWait(queueAhead, avgMinutes)

      const embed = new EmbedBuilder()
        .setTitle('Simulator Queue Updated')
        .setColor(0x38bdf8)
        .setDescription(
          `You're in the queue.\nGame: **${game}**\nSession: **${minutes}m**${eta ? `\nETA: **${eta}**` : ''}\nPosition: **${queueAhead + 1}**${
            queueAhead > 0 ? `\nEstimated Wait: **~${estimatedWait}m**` : '\nEstimated Wait: **Up next**'
          }`
        )
        .setTimestamp(new Date())

      await interaction.editReply({ embeds: [embed] })
      return
    }

    if (interaction.commandName === 'queue_leave') {
      await interaction.deferReply({ ephemeral: true })

      const queueState = await loadQueueState()
      const waitingNext = queueState.waiting.filter((entry) => entry.userId !== interaction.user.id)
      const activeNext = queueState.active.filter((entry) => entry.userId !== interaction.user.id)

      if (waitingNext.length === queueState.waiting.length && activeNext.length === queueState.active.length) {
        await interaction.editReply('You are not currently in the simulator queue.')
        return
      }

      await saveQueueState({ waiting: waitingNext, active: activeNext })
      await interaction.editReply('You have been removed from the simulator queue.')
      return
    }

    if (interaction.commandName === 'queue_list') {
      await interaction.deferReply()

      const game = interaction.options.getString('game')
      const queueState = await loadQueueState()
      const waitingFiltered = game ? queueState.waiting.filter((entry) => entry.game === game) : queueState.waiting
      const activeFiltered = game ? queueState.active.filter((entry) => entry.game === game) : queueState.active

      if (waitingFiltered.length === 0 && activeFiltered.length === 0) {
        await interaction.editReply(game ? `No queue activity for **${game}** right now.` : 'No queue activity right now.')
        return
      }

      const waitingSorted = [...waitingFiltered].sort((a, b) => String(a.updatedAt).localeCompare(String(b.updatedAt)))
      const activeSorted = [...activeFiltered].sort((a, b) => String(a.startedAt || a.updatedAt).localeCompare(String(b.startedAt || b.updatedAt)))
      const waitingLines = waitingSorted.slice(0, 20).map((entry, index) => formatQueueEntry(entry, index))
      const activeLines = activeSorted
        .slice(0, 10)
        .map((entry, index) => `${index + 1}. **${entry.displayName}** • ${entry.game} • ${entry.minutes || defaultSessionMinutes}m`)

      const embed = new EmbedBuilder()
        .setTitle(game ? `Simulator Queue • ${game}` : 'Simulator Queue')
        .setColor(0xa78bfa)
        .setTimestamp(new Date())

      embed.addFields({
        name: `Active Rigs (${activeSorted.length}/${simulatorCount})`,
        value: activeLines.length > 0 ? activeLines.join('\n') : 'No active sessions',
        inline: false,
      })

      embed.addFields({
        name: `Waiting (${waitingSorted.length})`,
        value: waitingLines.length > 0 ? waitingLines.join('\n') : 'No one waiting',
        inline: false,
      })

      await interaction.editReply({ embeds: [embed] })
      return
    }

    if (interaction.commandName === 'queue_next') {
      await interaction.deferReply()

      if (!isQueueStaff(interaction)) {
        await interaction.editReply('Only staff can run this command.')
        return
      }

      const queueState = await loadQueueState()

      if (queueState.active.length >= simulatorCount) {
        await interaction.editReply(
          `All rigs are currently occupied (${queueState.active.length}/${simulatorCount}). Run /queue_done first.`
        )
        return
      }

      if (queueState.waiting.length === 0) {
        await interaction.editReply('No one is waiting in queue right now.')
        return
      }

      const nextEntry = queueState.waiting.shift()
      const activeEntry = {
        ...nextEntry,
        startedAt: new Date().toISOString(),
      }
      queueState.active.push(activeEntry)
      await saveQueueState(queueState)

      await interaction.editReply(
        `Next up: <@${activeEntry.userId}> • **${activeEntry.game}** • **${activeEntry.minutes || defaultSessionMinutes}m** session.\nActive rigs: ${queueState.active.length}/${simulatorCount}`
      )
      return
    }

    if (interaction.commandName === 'queue_done') {
      await interaction.deferReply({ ephemeral: true })

      if (!isQueueStaff(interaction)) {
        await interaction.editReply('Only staff can run this command.')
        return
      }

      const selectedUser = interaction.options.getUser('driver')
      const queueState = await loadQueueState()

      if (queueState.active.length === 0) {
        await interaction.editReply('There are no active sessions right now.')
        return
      }

      let removedEntry = null
      if (selectedUser) {
        const index = queueState.active.findIndex((entry) => entry.userId === selectedUser.id)
        if (index < 0) {
          await interaction.editReply('That driver is not currently marked as active.')
          return
        }
        removedEntry = queueState.active.splice(index, 1)[0]
      } else {
        removedEntry = queueState.active.shift()
      }

      await saveQueueState(queueState)
      await interaction.editReply(
        `Session ended for **${removedEntry.displayName}**. Active rigs: ${queueState.active.length}/${simulatorCount}.`
      )
      return
    }

    if (interaction.commandName === 'queue_status') {
      await interaction.deferReply()

      const game = interaction.options.getString('game')
      const queueState = await loadQueueState()
      const waitingFiltered = game ? queueState.waiting.filter((entry) => entry.game === game) : queueState.waiting
      const activeFiltered = game ? queueState.active.filter((entry) => entry.game === game) : queueState.active
      const avgSessionMins = getAverageSessionMinutes(waitingFiltered.length > 0 ? waitingFiltered : queueState.waiting)

      const nextUp = waitingFiltered[0]
      const forNewJoinEstimate = estimateQueueWait(waitingFiltered.length, avgSessionMins)

      const embed = new EmbedBuilder()
        .setTitle(game ? `Queue Status • ${game}` : 'Queue Status')
        .setColor(0x22c55e)
        .setTimestamp(new Date())

      embed.addFields(
        {
          name: 'Capacity',
          value: `Rigs: **${simulatorCount}**\nActive: **${activeFiltered.length}**\nWaiting: **${waitingFiltered.length}**`,
          inline: true,
        },
        {
          name: 'Timing',
          value: `Average Session: **${avgSessionMins}m**\nNew Join Wait: **~${forNewJoinEstimate}m**`,
          inline: true,
        },
        {
          name: 'Next Up',
          value: nextUp
            ? `<@${nextUp.userId}> • ${nextUp.game} • ${nextUp.minutes || defaultSessionMinutes}m${nextUp.eta ? ` • ETA ${nextUp.eta}` : ''}`
            : 'No one waiting',
          inline: false,
        }
      )

      await interaction.editReply({ embeds: [embed] })
      return
    }
  } catch (error) {
    const message = `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(message)
    } else {
      await interaction.reply({ content: message, ephemeral: true })
    }
  }
})

client.login(token)
