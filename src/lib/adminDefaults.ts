export const FALLBACK_GAMES = [
  'assetto_corsa',
  'assetto_corsa_competizione',
  'f1_2025',
  'forza_motorsport',
  'forza_horizon',
  'gran_turismo_7',
  'iracing',
]

export const FALLBACK_TRACKS = [
  'Monza',
  'Spa-Francorchamps',
  'Silverstone',
  'Suzuka',
  'Imola',
  'Laguna Seca',
]

export const FALLBACK_CARS = [
  'Porsche 911 GT3',
  'Ferrari 296 GT3',
  'Mercedes-AMG GT3',
  'Lamborghini Huracán GT3',
]

const LOCAL_DEFAULT_GAMES_KEY = 'kraken_default_games'
const LOCAL_DEFAULT_TRACKS_KEY = 'kraken_default_tracks'
const LOCAL_DEFAULT_CARS_KEY = 'kraken_default_cars'

export const parseOptionsInput = (value: string) =>
  value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)

export const readLocalDefaultOptions = () => {
  if (typeof window === 'undefined') {
    return { games: [] as string[], tracks: [] as string[], cars: [] as string[] }
  }

  const gamesRaw = window.localStorage.getItem(LOCAL_DEFAULT_GAMES_KEY) || ''
  const tracksRaw = window.localStorage.getItem(LOCAL_DEFAULT_TRACKS_KEY) || ''
  const carsRaw = window.localStorage.getItem(LOCAL_DEFAULT_CARS_KEY) || ''

  return {
    games: parseOptionsInput(gamesRaw),
    tracks: parseOptionsInput(tracksRaw),
    cars: parseOptionsInput(carsRaw),
  }
}

export const saveLocalDefaultOptions = (games: string[], tracks: string[], cars: string[] = []) => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(LOCAL_DEFAULT_GAMES_KEY, games.join('\n'))
  window.localStorage.setItem(LOCAL_DEFAULT_TRACKS_KEY, tracks.join('\n'))
  window.localStorage.setItem(LOCAL_DEFAULT_CARS_KEY, cars.join('\n'))
}

export const isMissingSiteSettingsTableError = (message: string) =>
  /could not find the table 'public\.site_settings'/i.test(message)
