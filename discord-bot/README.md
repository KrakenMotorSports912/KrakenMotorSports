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
- `/profile driver_name:<name>`
- `/profile driver_name:<name> game:f1_2025`
- `/season_leaderboard`
- `/season_leaderboard game:f1_2025 track:monza limit:10`
- `/queue_join game:f1_2025 minutes:20 eta:here now`
- `/queue_list`
- `/queue_status`
- `/queue_next` (staff)
- `/queue_done` (staff)
- `/queue_leave`

Leaderboard command supports these optional sort/filter options:

- `game`
- `track`
- `car`
- `event_id`
- `sort_by` (`lap_time`, `submitted_at`, `driver`, `track`, `game`)
- `order` (`asc`, `desc`)

Gamification commands:

- `/profile`
	- Shows a driver's level, points, wins/podiums/top-10 counts, best lap, total lap time, and achievements.
	- Points are based on approved laps with a base completion score + rank bonus.
- `/season_leaderboard`
	- Shows current month (UTC) points standings using approved laps.
	- Supports `game`, `track`, and `car` filters.

On-site simulator queue commands:

- `/queue_join`
	- Adds/updates your place in the physical rig queue.
	- Stores game, requested session minutes, and optional ETA.
- `/queue_list`
	- Shows active sessions and waiting queue.
- `/queue_status`
	- Shows queue health and estimated wait times.
- `/queue_next` (staff)
	- Moves the next waiting driver onto an available rig.
- `/queue_done` (staff)
	- Ends an active session and frees a rig.
- `/queue_leave`
	- Removes yourself from waiting/active queue.

Optional queue environment settings:

- `SIMULATOR_COUNT` (default `1`)
- `DEFAULT_SESSION_MINUTES` (default `20`)
- `QUEUE_STAFF_ROLE_IDS` (comma-separated Discord role IDs allowed to run staff commands)

Autocomplete support:

- `/leaderboard` autocompletes `game`, `track`, `car`, and `event_id`.
- `/profile` autocompletes `driver_name` and `game`.
- `/season_leaderboard` autocompletes `game`, `track`, and `car`.
- `/queue_join`, `/queue_list`, and `/queue_status` autocomplete `game`.
- `game` and `track` suggestions include Admin Hub presets (`default_games` / `default_tracks`) plus live leaderboard data.
- This means updates you make in Admin defaults are reflected in Discord suggestions automatically.
