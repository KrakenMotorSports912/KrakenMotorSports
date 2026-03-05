require('dotenv').config()
const { REST, Routes, SlashCommandBuilder } = require('discord.js')

const token = process.env.DISCORD_TOKEN
const clientId = process.env.DISCORD_CLIENT_ID
const guildId = process.env.DISCORD_GUILD_ID

if (!token || !clientId) {
  console.error('Missing DISCORD_TOKEN or DISCORD_CLIENT_ID in .env')
  process.exit(1)
}

const commands = [
  new SlashCommandBuilder()
    .setName('events')
    .setDescription('Show upcoming Kraken Motorsports events')
    .addStringOption((option) =>
      option
        .setName('game')
        .setDescription('Filter events by game (example: f1_2025)')
        .setRequired(false)
    )
    .addIntegerOption((option) =>
      option
        .setName('limit')
        .setDescription('How many events to show (1-10)')
        .setMinValue(1)
        .setMaxValue(10)
        .setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Show top Kraken Motorsports leaderboard entries')
    .addStringOption((option) =>
      option
        .setName('game')
        .setDescription('Filter by game (example: assetto_corsa_competizione)')
        .setAutocomplete(true)
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName('track')
        .setDescription('Filter by track name')
        .setAutocomplete(true)
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName('car')
        .setDescription('Filter by car name')
        .setAutocomplete(true)
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName('event_id')
        .setDescription('Filter to a specific event ID')
        .setAutocomplete(true)
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName('sort_by')
        .setDescription('How to sort leaderboard rows')
        .setRequired(false)
        .addChoices(
          { name: 'Fastest Time', value: 'lap_time' },
          { name: 'Newest Submission', value: 'submitted_at' },
          { name: 'Driver Name', value: 'driver' },
          { name: 'Track Name', value: 'track' },
          { name: 'Game Name', value: 'game' }
        )
    )
    .addStringOption((option) =>
      option
        .setName('order')
        .setDescription('Sort order')
        .setRequired(false)
        .addChoices(
          { name: 'Ascending', value: 'asc' },
          { name: 'Descending', value: 'desc' }
        )
    )
    .addIntegerOption((option) =>
      option
        .setName('limit')
        .setDescription('How many rows to show (1-10)')
        .setMinValue(1)
        .setMaxValue(10)
        .setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Show a driver profile with points, level, and achievements')
    .addStringOption((option) =>
      option
        .setName('driver_name')
        .setDescription('Driver name to look up')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption((option) =>
      option
        .setName('game')
        .setDescription('Filter profile stats by game')
        .setAutocomplete(true)
        .setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName('season_leaderboard')
    .setDescription('Show points leaderboard for the current season (month)')
    .addStringOption((option) =>
      option
        .setName('game')
        .setDescription('Filter by game')
        .setAutocomplete(true)
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName('track')
        .setDescription('Filter by track')
        .setAutocomplete(true)
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName('car')
        .setDescription('Filter by car')
        .setAutocomplete(true)
        .setRequired(false)
    )
    .addIntegerOption((option) =>
      option
        .setName('limit')
        .setDescription('How many drivers to show (3-10)')
        .setMinValue(3)
        .setMaxValue(10)
        .setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName('queue_join')
    .setDescription('Join the on-site simulator queue')
    .addStringOption((option) =>
      option
        .setName('game')
        .setDescription('Game you want to run on the rig')
        .setAutocomplete(true)
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName('minutes')
        .setDescription('Requested session length (10-60 minutes)')
        .setMinValue(10)
        .setMaxValue(60)
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName('eta')
        .setDescription('When you can arrive (example: here now, 20 min)')
        .setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName('queue_leave')
    .setDescription('Leave the on-site simulator queue'),
  new SlashCommandBuilder()
    .setName('queue_list')
    .setDescription('List waiting and currently active simulator sessions')
    .addStringOption((option) =>
      option
        .setName('game')
        .setDescription('Filter queue by game')
        .setAutocomplete(true)
        .setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName('queue_next')
    .setDescription('Staff: move next driver from waiting queue onto an available rig'),
  new SlashCommandBuilder()
    .setName('queue_done')
    .setDescription('Staff: end an active session and free a rig')
    .addUserOption((option) =>
      option
        .setName('driver')
        .setDescription('Specific active driver to end (optional)')
        .setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName('queue_status')
    .setDescription('Show queue health and estimated wait times')
    .addStringOption((option) =>
      option
        .setName('game')
        .setDescription('Filter status by game')
        .setAutocomplete(true)
        .setRequired(false)
    ),
].map((command) => command.toJSON())

const rest = new REST({ version: '10' }).setToken(token)

async function register() {
  try {
    if (guildId) {
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
      console.log('Registered guild slash commands successfully.')
      return
    }

    await rest.put(Routes.applicationCommands(clientId), { body: commands })
    console.log('Registered global slash commands successfully.')
  } catch (error) {
    console.error('Failed to register slash commands:', error)
    process.exit(1)
  }
}

register()
