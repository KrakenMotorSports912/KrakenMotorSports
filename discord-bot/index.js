require('dotenv').config()
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js')
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
const siteUrl = 'https://kraken-motor-sports.vercel.app'

if (!token) {
  console.error('Missing DISCORD_TOKEN in .env')
  process.exit(1)
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] })

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

const fetchEvents = async (limit = 5, game) => {
  const url = new URL('/api/public/events', apiBaseUrl)
  url.searchParams.set('limit', String(limit))
  if (game) url.searchParams.set('game', game)

  const response = await fetch(url)
  if (!response.ok) throw new Error(`Events API returned ${response.status}`)

  const payload = await response.json()
  return payload.events || []
}

const fetchLeaderboardOptions = async (type, queryText) => {
  const url = new URL('/api/public/leaderboard/options', apiBaseUrl)
  url.searchParams.set('type', type)
  url.searchParams.set('limit', '25')
  if (queryText) url.searchParams.set('q', queryText)

  const response = await fetch(url)
  if (!response.ok) throw new Error(`Leaderboard options API returned ${response.status}`)

  const payload = await response.json()
  return payload.options || []
}

const fetchLeaderboard = async ({ limit = 5, game, track, car, eventId } = {}) => {
  const url = new URL('/api/public/leaderboard', apiBaseUrl)
  url.searchParams.set('limit', String(limit))
  if (game) url.searchParams.set('game', game)
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
      if (interaction.commandName !== 'leaderboard') {
        await interaction.respond([])
        return
      }

      const focused = interaction.options.getFocused(true)
      const optionTypeByName = {
        game: 'games',
        track: 'tracks',
        car: 'cars',
        event_id: 'events',
      }

      const mappedType = optionTypeByName[focused.name]
      if (!mappedType) {
        await interaction.respond([])
        return
      }

      const options = await fetchLeaderboardOptions(mappedType, focused.value)
      const choices = options.slice(0, 25).map((option) => ({ name: option.name, value: option.value }))
      await interaction.respond(choices)
      return
    } catch (error) {
      console.error('Autocomplete failed:', error)
      await interaction.respond([])
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

      const game = interaction.options.getString('game')
      const track = interaction.options.getString('track')
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
