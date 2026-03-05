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
