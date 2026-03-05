# Kraken Discord Bot Setup

This folder is the bot app. Keep it at:

- [discord-bot](discord-bot)

## 1) Install dependencies

From project root:

```bash
cd discord-bot
npm install
```

## 2) Add environment variables

Create a file named `.env` inside this folder (`discord-bot/.env`) using `.env.example` as a template.

Required:

- `DISCORD_TOKEN`
- `DISCORD_CLIENT_ID`
- `DISCORD_GUILD_ID` (recommended for instant command updates while testing)
- `API_BASE_URL` (already defaults to your live site)

Nightly auto-update settings:

- `DISCORD_EVENTS_CHANNEL_ID` (channel for new events updates)
- `DISCORD_LEADERBOARD_CHANNEL_ID` (channel for leaderboard movement/new entries)
- `NIGHTLY_UPDATE_HOUR` (0-23)
- `NIGHTLY_UPDATE_MINUTE` (0-59)
- `NIGHTLY_UPDATE_TIMEZONE` (IANA timezone, example: `America/Toronto`)

Optional fallback:

- `DISCORD_UPDATES_CHANNEL_ID` (if set, used for both when one of the specific channel IDs is missing)

The bot checks once per minute and posts at your configured night time only if either:

- New events were added
- Leaderboard positions changed
- New leaderboard entries appeared

## 3) Register slash commands

```bash
npm run register
```

## 4) Start the bot

```bash
npm start
```

## 5) Test in Discord

Use these slash commands in your server:

- `/events`
- `/events game:assetto_corsa_competizione limit:5`
- `/leaderboard`
- `/leaderboard game:f1_2025 limit:10`
- `/leaderboard game:f1_2025 track:monza car:mercedes-amg gt3 limit:10`
- `/leaderboard event_id:<event_uuid> sort_by:submitted_at order:desc`

Leaderboard command supports these optional sort/filter options:

- `game`
- `track`
- `car`
- `event_id`
- `sort_by` (`lap_time`, `submitted_at`, `driver`, `track`, `game`)
- `order` (`asc`, `desc`)

Autocomplete support:

- `/leaderboard` now autocompletes `game`, `track`, `car`, and `event_id`.
- `game` and `track` suggestions include Admin Hub presets (`default_games` / `default_tracks`) plus live leaderboard data.
- This means updates you make in Admin defaults are reflected in Discord suggestions automatically.
