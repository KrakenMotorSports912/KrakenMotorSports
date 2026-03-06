require('dotenv').config()

const fs = require('fs')
const path = require('path')
const {
  Client,
  GatewayIntentBits,
  Partials,
  PermissionFlagsBits,
} = require('discord.js')

const token = process.env.COMMUNITY_BOT_TOKEN
if (!token) {
  console.error('Missing COMMUNITY_BOT_TOKEN')
  process.exit(1)
}

const SETTINGS_PATH = path.join(__dirname, 'community-settings.json')
const replyCooldowns = new Map()
const welcomeCooldowns = new Map()
const welcomeDedupeMs = Math.max(30000, Number(process.env.COMMUNITY_BOT_WELCOME_DEDUPE_MS ?? 120000))

const defaultAllowedChannels = (process.env.COMMUNITY_BOT_ALLOWED_CHANNEL_IDS || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean)

const DEFAULT_SETTINGS = {
  mode: process.env.COMMUNITY_BOT_DEFAULT_MODE || 'fun',
  welcomeChannelId: process.env.COMMUNITY_BOT_WELCOME_CHANNEL_ID || null,
  allowedChannelIds: defaultAllowedChannels,
}

function readSettings() {
  try {
    if (!fs.existsSync(SETTINGS_PATH)) {
      return {}
    }
    return JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'))
  } catch {
    return {}
  }
}

function writeSettings(settingsByGuild) {
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settingsByGuild, null, 2), 'utf8')
}

function getGuildSettings(guildId) {
  const all = readSettings()
  return {
    ...DEFAULT_SETTINGS,
    ...(all[guildId] || {}),
  }
}

function setGuildSettings(guildId, updates) {
  const all = readSettings()
  const next = {
    ...DEFAULT_SETTINGS,
    ...(all[guildId] || {}),
    ...updates,
  }
  all[guildId] = next
  writeSettings(all)
  return next
}

function isChannelAllowed(channelId, settings) {
  const allowed = settings.allowedChannelIds || []
  if (allowed.length === 0) return true
  return allowed.includes(channelId)
}

function maybeCanReply(channelId) {
  const now = Date.now()
  const last = replyCooldowns.get(channelId) || 0
  if (now - last < 30000) {
    return false
  }
  replyCooldowns.set(channelId, now)
  return true
}

function shouldSendWelcome(guildId, memberId) {
  const now = Date.now()
  const key = `${guildId}:${memberId}`
  const last = welcomeCooldowns.get(key) || 0

  if (now - last < welcomeDedupeMs) {
    return false
  }

  welcomeCooldowns.set(key, now)

  // Opportunistic cleanup to avoid unbounded map growth.
  if (welcomeCooldowns.size > 5000) {
    const cutoff = now - welcomeDedupeMs
    for (const [entryKey, timestamp] of welcomeCooldowns.entries()) {
      if (timestamp < cutoff) {
        welcomeCooldowns.delete(entryKey)
      }
    }
  }

  return true
}

const WELCOME_LINES = [
  'Welcome to Kraken! Glad you are here.',
  'New racer in the chat! Welcome aboard.',
  'Welcome in! We are hyped to have you here.',
]

const VIBE_LINES = [
  'Energy check: 100%.',
  'Hydrate, focus, and full send.',
  'Fast laps and good vibes only.',
  'Today is a good day to race.',
]

const ICEBREAKERS = [
  'What game got you into sim racing?',
  'What is your favorite track and why?',
  'What is one setup tip you wish you knew earlier?',
  'What car class do you enjoy most right now?',
]

const KEYWORD_REACTIONS = [
  { pattern: /\b(lets go|let\'s go|hype)\b/i, emoji: '🔥' },
  { pattern: /\bgg\b/i, emoji: '👏' },
  { pattern: /\b(welcome|hello|hi)\b/i, emoji: '👋' },
  { pattern: /\b(win|winner|victory)\b/i, emoji: '🏆' },
]

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.Reaction],
})

client.once('clientReady', () => {
  console.log(`Community bot online as ${client.user.tag}`)
})

client.on('guildMemberAdd', async (member) => {
  try {
    if (!shouldSendWelcome(member.guild.id, member.id)) {
      return
    }

    const settings = getGuildSettings(member.guild.id)
    const channelId = settings.welcomeChannelId || member.guild.systemChannelId
    if (!channelId) return

    const channel = await member.guild.channels.fetch(channelId).catch(() => null)
    if (!channel || !channel.isTextBased()) return

    const line = WELCOME_LINES[Math.floor(Math.random() * WELCOME_LINES.length)]
    await channel.send(`Welcome ${member} ${line}`)
  } catch (error) {
    console.error('guildMemberAdd error:', error)
  }
})

client.on('messageCreate', async (message) => {
  try {
    if (!message.guild || message.author.bot) return

    const settings = getGuildSettings(message.guild.id)
    if (settings.mode === 'off') return
    if (!isChannelAllowed(message.channelId, settings)) return

    const text = message.content || ''
    const normalized = text.toLowerCase()

    for (const item of KEYWORD_REACTIONS) {
      if (item.pattern.test(text)) {
        await message.react(item.emoji).catch(() => null)
        break
      }
    }

    if (settings.mode === 'fun' && maybeCanReply(message.channelId)) {
      const mentionBot = client.user && normalized.includes(`<@${client.user.id}>`)
      const askForVibes = /\b(vibe|energy|hype)\b/i.test(text)

      if (mentionBot || askForVibes) {
        const line = VIBE_LINES[Math.floor(Math.random() * VIBE_LINES.length)]
        await message.reply(line).catch(() => null)
      }
    }
  } catch (error) {
    console.error('messageCreate error:', error)
  }
})

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return

  try {
    const guildId = interaction.guildId
    if (!guildId) {
      await interaction.reply({ content: 'Use this command inside a server.', ephemeral: true })
      return
    }

    if (interaction.commandName === 'vibe') {
      const line = VIBE_LINES[Math.floor(Math.random() * VIBE_LINES.length)]
      await interaction.reply(line)
      return
    }

    if (interaction.commandName === 'icebreaker') {
      const line = ICEBREAKERS[Math.floor(Math.random() * ICEBREAKERS.length)]
      await interaction.reply(`Icebreaker: ${line}`)
      return
    }

    if (interaction.commandName === 'cheer') {
      const member = interaction.options.getUser('member', true)
      const reason = interaction.options.getString('reason')
      const suffix = reason ? ` for ${reason}` : ''
      await interaction.reply(`Lets go ${member} ${suffix}!`)
      return
    }

    if (interaction.commandName === 'community_settings') {
      const isManager = interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)
      if (!isManager) {
        await interaction.reply({ content: 'You need Manage Server to use this.', ephemeral: true })
        return
      }

      const subcommand = interaction.options.getSubcommand()
      const current = getGuildSettings(guildId)

      if (subcommand === 'view') {
        const channels = current.allowedChannelIds.length > 0 ? current.allowedChannelIds.map((id) => `<#${id}>`).join(', ') : 'All channels'
        await interaction.reply({
          content: `Mode: ${current.mode}\nWelcome channel: ${current.welcomeChannelId ? `<#${current.welcomeChannelId}>` : 'System channel'}\nAllowed channels: ${channels}`,
          ephemeral: true,
        })
        return
      }

      if (subcommand === 'set_mode') {
        const mode = interaction.options.getString('mode', true)
        const next = setGuildSettings(guildId, { mode })
        await interaction.reply({ content: `Mode updated to ${next.mode}.`, ephemeral: true })
        return
      }

      if (subcommand === 'set_welcome') {
        const channel = interaction.options.getChannel('channel', true)
        const next = setGuildSettings(guildId, { welcomeChannelId: channel.id })
        await interaction.reply({ content: `Welcome channel set to <#${next.welcomeChannelId}>.`, ephemeral: true })
        return
      }

      if (subcommand === 'add_channel') {
        const channel = interaction.options.getChannel('channel', true)
        const set = new Set(current.allowedChannelIds || [])
        set.add(channel.id)
        const next = setGuildSettings(guildId, { allowedChannelIds: Array.from(set) })
        await interaction.reply({ content: `Allowed channels now: ${next.allowedChannelIds.map((id) => `<#${id}>`).join(', ')}`, ephemeral: true })
        return
      }

      if (subcommand === 'remove_channel') {
        const channel = interaction.options.getChannel('channel', true)
        const nextIds = (current.allowedChannelIds || []).filter((id) => id !== channel.id)
        const next = setGuildSettings(guildId, { allowedChannelIds: nextIds })
        const message = next.allowedChannelIds.length > 0 ? next.allowedChannelIds.map((id) => `<#${id}>`).join(', ') : 'All channels'
        await interaction.reply({ content: `Allowed channels now: ${message}`, ephemeral: true })
        return
      }

      if (subcommand === 'clear_channels') {
        setGuildSettings(guildId, { allowedChannelIds: [] })
        await interaction.reply({ content: 'Allowed channels cleared. Bot can run in all channels.', ephemeral: true })
        return
      }
    }
  } catch (error) {
    console.error('interactionCreate error:', error)
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({ content: 'Something went wrong.', ephemeral: true }).catch(() => null)
    } else {
      await interaction.reply({ content: 'Something went wrong.', ephemeral: true }).catch(() => null)
    }
  }
})

client.login(token)
