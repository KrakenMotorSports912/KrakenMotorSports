require('dotenv').config()
const { REST, Routes, SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js')

const token = process.env.COMMUNITY_BOT_TOKEN
const clientId = process.env.COMMUNITY_BOT_CLIENT_ID
const guildId = process.env.COMMUNITY_BOT_GUILD_ID

if (!token || !clientId || !guildId) {
  console.error('Missing COMMUNITY_BOT_TOKEN, COMMUNITY_BOT_CLIENT_ID, or COMMUNITY_BOT_GUILD_ID')
  process.exit(1)
}

const commands = [
  new SlashCommandBuilder()
    .setName('vibe')
    .setDescription('Get a hype community message'),

  new SlashCommandBuilder()
    .setName('icebreaker')
    .setDescription('Post a fun icebreaker prompt'),

  new SlashCommandBuilder()
    .setName('cheer')
    .setDescription('Cheer for someone in chat')
    .addUserOption((option) => option.setName('member').setDescription('Who to cheer for').setRequired(true))
    .addStringOption((option) => option.setName('reason').setDescription('Optional reason').setRequired(false)),

  new SlashCommandBuilder()
    .setName('community_settings')
    .setDescription('Manage community bot behavior')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((subcommand) =>
      subcommand
        .setName('view')
        .setDescription('View current settings')
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('set_mode')
        .setDescription('Set reaction mode')
        .addStringOption((option) =>
          option
            .setName('mode')
            .setDescription('off/light/fun')
            .setRequired(true)
            .addChoices(
              { name: 'off', value: 'off' },
              { name: 'light', value: 'light' },
              { name: 'fun', value: 'fun' }
            )
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('set_welcome')
        .setDescription('Set welcome channel')
        .addChannelOption((option) =>
          option
            .setName('channel')
            .setDescription('Channel for welcome messages')
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('add_channel')
        .setDescription('Add an allowed channel')
        .addChannelOption((option) =>
          option
            .setName('channel')
            .setDescription('Channel to allow')
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('remove_channel')
        .setDescription('Remove an allowed channel')
        .addChannelOption((option) =>
          option
            .setName('channel')
            .setDescription('Channel to remove')
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('clear_channels')
        .setDescription('Allow all channels again')
    ),
].map((command) => command.toJSON())

const rest = new REST({ version: '10' }).setToken(token)

async function main() {
  try {
    console.log(`Registering ${commands.length} community commands...`)
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
    console.log('Community commands registered successfully.')
  } catch (error) {
    console.error('Failed to register commands:', error)
    process.exit(1)
  }
}

main()
