# Kraken Community Discord Bot

This is a separate bot process focused on member interaction and community energy.

## Features in this v1

- Welcomes new members automatically
- Reacts to common hype/community keywords
- Optional lightweight chat replies in `fun` mode
- Slash commands:
  - `/vibe`
  - `/icebreaker`
  - `/cheer`
  - `/community_settings` (Manage Server required)

## Setup

1. Open folder:

```bash
cd discord-community-bot
```

2. Install packages:

```bash
npm install
```

3. Create `.env` from `.env.example` and fill:

- `COMMUNITY_BOT_TOKEN`
- `COMMUNITY_BOT_CLIENT_ID`
- `COMMUNITY_BOT_GUILD_ID`

Optional:

- `COMMUNITY_BOT_DEFAULT_MODE` (`off`, `light`, `fun`)
- `COMMUNITY_BOT_WELCOME_CHANNEL_ID`
- `COMMUNITY_BOT_ALLOWED_CHANNEL_IDS` (comma-separated)

4. Register commands:

```bash
npm run register
```

5. Start bot:

```bash
npm start
```

## Config commands

Use `/community_settings` subcommands:

- `view`
- `set_mode`
- `set_welcome`
- `add_channel`
- `remove_channel`
- `clear_channels`

## Notes

- This bot is separate from your existing `discord-bot` app.
- It stores guild settings in `discord-community-bot/community-settings.json`.
- Message responses require the Message Content intent enabled in the Discord Developer Portal.
