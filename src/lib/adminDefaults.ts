export const FALLBACK_GAMES = [
  'assetto_corsa',
  'assetto_corsa_competizione',
  'f1_2025',
  'forza_motorsport_7',
  'forza_motorsport_2023',
  'forza_horizon_4',
  'forza_horizon_5',
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
const LOCAL_DEFAULT_GAME_CATALOG_KEY = 'kraken_default_game_catalog'

export type GameDefaultsNode = {
  game: string
  tracks: string[]
  cars: string[]
}

type GameBaseDefaults = {
  tracks: string[]
  cars: string[]
}

const normalizeGameKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, '_')

const BASE_DEFAULTS_BY_GAME: Record<string, GameBaseDefaults> = {
  assetto_corsa: {
    tracks: ['Brands Hatch', 'Imola', 'Magione', 'Monza', 'Mugello', 'Nurburgring GP', 'Nurburgring Nordschleife', 'Silverstone', 'Spa-Francorchamps', 'Vallelunga'],
    cars: ['Abarth 500 esseesse', 'Alfa Romeo 4C', 'Audi R8 V10 plus', 'BMW M3 E30', 'Ferrari 458 Italia', 'KTM X-Bow R', 'Lamborghini Huracan LP610-4', 'Lotus Exige S', 'Mazda MX-5 NA', 'Mercedes-Benz SLS AMG', 'Nissan GT-R NISMO', 'Pagani Zonda R', 'Porsche 911 Carrera S'],
  },
  assetto_corsa_competizione: {
    tracks: ['Barcelona', 'Brands Hatch', 'Hungaroring', 'Misano', 'Monza', 'Nurburgring', 'Paul Ricard', 'Silverstone', 'Spa-Francorchamps', 'Zandvoort', 'Zolder'],
    cars: ['Aston Martin V12 Vantage GT3', 'Audi R8 LMS GT3', 'Bentley Continental GT3 2018', 'BMW M6 GT3', 'Emil Frey Jaguar G3', 'Ferrari 488 GT3', 'Honda NSX GT3', 'Lamborghini Huracan GT3', 'Lexus RC F GT3', 'McLaren 650S GT3', 'Mercedes-AMG GT3', 'Nissan GT-R NISMO GT3', 'Porsche 991 GT3 R'],
  },
  f1_2025: {
    tracks: ['Bahrain', 'Jeddah', 'Albert Park', 'Suzuka', 'Shanghai', 'Miami', 'Imola', 'Monaco', 'Montreal', 'Barcelona', 'Red Bull Ring', 'Silverstone', 'Hungaroring', 'Spa-Francorchamps', 'Zandvoort', 'Monza', 'Baku', 'Marina Bay', 'Circuit of the Americas', 'Autodromo Hermanos Rodriguez', 'Interlagos', 'Las Vegas Strip', 'Lusail', 'Yas Marina'],
    cars: ['McLaren MCL39', 'Ferrari SF-25', 'Red Bull RB21', 'Mercedes W16', 'Aston Martin AMR25', 'Alpine A525', 'Williams FW47', 'RB VCARB 02', 'Kick Sauber C45', 'Haas VF-25'],
  },
  forza_motorsport_2023: {
    tracks: [
      'Eaglerock Speedway',
      'Grand Oak Raceway',
      'Hakone',
      'Indianapolis Motor Speedway',
      'Kyalami',
      'Le Mans - Circuit de la Sarthe',
      'Laguna Seca',
      'Maple Valley',
      'Mid-Ohio',
      'Mugello',
      'Nurburgring GP',
      'Road America',
      'Silverstone',
      'Spa-Francorchamps',
      'Suzuka',
      'VIR',
      'Watkins Glen',
    ],
    cars: [
      '2017 Ford GT',
      '2018 Ford Mustang GT',
      '2018 Ford #98 Breathless Pro Racing TA Mustang',
      '2020 Chevrolet Corvette Stingray Coupe',
      '2018 Chevrolet Camaro ZL1 1LE',
      '2020 Toyota GR Supra',
      '2020 Toyota GR Supra #90 Castrol TOMS',
      '2019 Porsche 911 GT3 RS',
      '2018 Porsche 718 Cayman GTS',
      '2017 Nissan GT-R',
      '2018 Nissan 370Z NISMO',
      '2018 BMW M5',
      '2016 BMW M4 GTS',
      '2018 Audi RS 5 Coupe',
      '2016 Audi R8 V10 plus',
      '2018 Mercedes-AMG GT R',
      '2015 Mercedes-AMG C 63 S Coupe',
      '2018 Dodge Challenger SRT Demon',
      '2016 Dodge Viper ACR',
      '2015 Subaru WRX STI',
      '2017 Acura NSX',
      '2016 Lamborghini Aventador Superveloce',
      '2018 Ferrari 488 GTB',
    ],
  },
  forza_motorsport_7: {
    tracks: [
      'Bernese Alps',
      'Brands Hatch',
      'Catalunya',
      'Circuit de Spa-Francorchamps',
      'Daytona International Speedway',
      'Dubai Autodrome',
      'Hockenheimring',
      'Indianapolis Motor Speedway',
      'Laguna Seca',
      'Le Mans - Circuit de la Sarthe',
      'Lime Rock Park',
      'Long Beach',
      'Maple Valley',
      'Mugello',
      'Nurburgring GP',
      'Prague',
      'Road Atlanta',
      'Road America',
      'Sebring',
      'Silverstone',
      'Suzuka',
      'Watkins Glen',
      'Yas Marina',
    ],
    cars: [
      '2017 Ford GT',
      '2017 Acura NSX',
      '2016 Audi R8 V10 plus',
      '2018 BMW M5',
      '2015 Chevrolet Corvette Z06',
      '2018 Dodge Challenger SRT Demon',
      '2018 Ferrari Portofino',
      '2016 Lamborghini Aventador Superveloce',
      '2017 Nissan GT-R',
      '2018 Porsche 911 GT2 RS',
      '2015 Subaru WRX STI',
      '2013 Mercedes-Benz A 45 AMG',
    ],
  },
  forza_horizon_5: {
    tracks: [
      'Horizon Mexico Circuit',
      'Emerald Circuit',
      'Playa Azul Circuit',
      'Estadio Circuit',
      'Bola Ocho Circuit',
      'Arch of Mulege Circuit',
      'Copper Canyon Sprint',
      'Volcan Sprint',
      'Baja California Trail',
      'Tierra Prospera Circuit',
      'Sierra Verde Sprint',
      'The Colossus',
      'Goliath',
      'Marathon',
      'Titan',
      'Gauntlet',
    ],
    cars: [
      '2020 Toyota GR Supra',
      '2021 Ford Bronco',
      '2020 Chevrolet Corvette Stingray Coupe',
      '2018 Porsche 911 GT2 RS',
      '2019 Lamborghini Huracan Performante',
      '2018 McLaren Senna',
      '2019 McLaren Speedtail',
      '2017 Ford Focus RS',
      '2016 Ford Shelby GT350R',
      '2020 Ford Mustang Shelby GT500',
      '1997 Mazda RX-7',
      '1994 Mazda MX-5 Miata',
      '2015 Subaru WRX STI',
      '2019 Porsche 911 Carrera S',
      '2017 Nissan GT-R',
      '2020 Nissan GT-R NISMO',
      '2018 Audi TT RS',
      '2019 Aston Martin Vantage',
      '2018 Mercedes-AMG GT 4-Door Coupe',
      '2018 BMW M5',
      '2018 Dodge Challenger SRT Demon',
      '2016 Dodge Viper ACR',
      '2020 Koenigsegg Jesko',
      '2019 Ferrari 488 Pista',
    ],
  },
  forza_horizon_4: {
    tracks: [
      'Ambleside Circuit',
      'Astmoor Heritage Circuit',
      'Broadway Village Circuit',
      'Derwent Reservoir Sprint',
      'Greendale Club Circuit',
      'Lakehurst Forest Sprint',
      'Moorhead Wind Farm Circuit',
      'Princes Street Gardens Circuit',
      'Rail Yard Cross Country Circuit',
      'The Goliath',
      'The Marathon',
      'The Titan',
      'The Gauntlet',
    ],
    cars: [
      '2017 Ford Focus RS',
      '2018 Ford Mustang GT',
      '2016 Ford Shelby GT350R',
      '2015 Subaru WRX STI',
      '2017 Nissan GT-R',
      '2018 Audi TT RS',
      '2018 BMW M5',
      '2016 Lamborghini Aventador Superveloce',
      '2018 McLaren Senna',
      '2019 Aston Martin Vantage',
      '2018 Porsche 911 GT2 RS',
      '2015 Mercedes-AMG GT S',
    ],
  },
  gran_turismo_7: {
    tracks: [
      'Autodrome Lago Maggiore',
      'Blue Moon Bay Speedway',
      'Brands Hatch',
      'Circuit de Barcelona-Catalunya',
      'Circuit de la Sarthe',
      'Deep Forest Raceway',
      'Dragon Trail',
      'Fuji International Speedway',
      'Goodwood Motor Circuit',
      'High Speed Ring',
      'Kyoto Driving Park',
      'Mount Panorama',
      'Nurburgring',
      'Red Bull Ring',
      'Sardegna Road Track',
      'Special Stage Route X',
      'Spa-Francorchamps',
      'Suzuka Circuit',
      'Tokyo Expressway',
      'Trial Mountain Circuit',
      'Tsukuba Circuit',
      'WeatherTech Raceway Laguna Seca',
      'Willow Springs',
    ],
    cars: [
      'Mazda Demio XD Touring 15',
      'Honda Fit Hybrid 14',
      'Toyota Aqua S 11',
      'Nissan GT-R NISMO 17',
      'Nissan Fairlady Z Version S 07',
      'Toyota GR Supra RZ 20',
      'Toyota 86 GT 15',
      'Toyota GR Yaris RZ High Performance 20',
      'Subaru BRZ S 15',
      'Subaru WRX STI Type S 14',
      'Mazda RX-7 Spirit R Type A FD 02',
      'Mazda Roadster S ND 15',
      'Honda NSX Type R 92',
      'Honda Civic Type R FK8 20',
      'Mitsubishi Lancer Evolution Final 15',
      'BMW M3 Sport Evolution 89',
      'BMW M4 Coupe 14',
      'Mercedes-AMG GT S 15',
      'Mercedes-AMG GT3 20',
      'Porsche 911 GT3 997 09',
      'Porsche 911 RSR 17',
      'Ferrari 458 Italia 09',
      'Ferrari F8 Tributo 19',
      'Lamborghini Aventador LP700-4 11',
      'Lamborghini Huracan LP610-4 15',
      'Aston Martin V12 Vantage S 15',
      'Ford GT 06',
      'Ford Mustang Mach 1 71',
      'Chevrolet Corvette C7 Stingray 14',
      'Dodge Challenger R/T 70',
    ],
  },
  iracing: {
    tracks: [
      'Charlotte Motor Speedway Road Course',
      'Concord Speedway',
      'Lanier National Speedway',
      'Lime Rock Park',
      'Okayama International Circuit',
      'Oulton Park Circuit',
      'Rudskogen Motorsenter',
      'Summit Point Raceway',
      'Tsukuba Circuit',
      'WeatherTech Raceway Laguna Seca',
    ],
    cars: [
      'Mazda MX-5 Cup',
      'Formula Vee',
      'Ray FF1600',
      'Toyota GR86',
      'Street Stock',
      'Legends Ford 34 Coupe',
      'Dirt Street Stock',
      'Dirt Legends Ford 34 Coupe',
      'VW Beetle Lite',
    ],
  },
  mario_kart_wii: {
    tracks: [
      'Luigi Circuit',
      'Moo Moo Meadows',
      'Mushroom Gorge',
      'Toads Factory',
      'Mario Circuit',
      'Coconut Mall',
      'DK Summit',
      'Warios Gold Mine',
      'Daisy Circuit',
      'Koopa Cape',
      'Maple Treeway',
      'Grumble Volcano',
      'Dry Dry Ruins',
      'Moonview Highway',
      'Bowsers Castle',
      'Rainbow Road',
      'GCN Peach Beach',
      'DS Yoshi Falls',
      'SNES Ghost Valley 2',
      'N64 Mario Raceway',
      'N64 Sherbet Land',
      'GBA Shy Guy Beach',
      'DS Delfino Square',
      'GCN Waluigi Stadium',
      'DS Desert Hills',
      'GBA Bowser Castle 3',
      'N64 DKs Jungle Parkway',
      'GCN Mario Circuit',
      'SNES Mario Circuit 3',
      'DS Peach Gardens',
      'GCN DK Mountain',
      'N64 Bowsers Castle',
    ],
    cars: [
      'Standard Kart S',
      'Booster Seat',
      'Mini Beast',
      'Cheep Charger',
      'Tiny Titan',
      'Blue Falcon',
      'Standard Bike S',
      'Bullet Bike',
      'Bit Bike',
      'Quacker',
      'Magikruiser',
      'Jet Bubble',
      'Standard Kart M',
      'Classic Dragster',
      'Wild Wing',
      'Super Blooper',
      'Daytripper',
      'Sprinter',
      'Standard Bike M',
      'Mach Bike',
      'Sugarscoot',
      'Zip Zip',
      'Sneakster',
      'Dolphin Dasher',
      'Standard Kart L',
      'Offroader',
      'Flame Flyer',
      'Piranha Prowler',
      'Jetsetter',
      'Honeycoupe',
      'Standard Bike L',
      'Flame Runner',
      'Wario Bike',
      'Shooting Star',
      'Spear',
      'Phantom',
    ],
  },
}

const GAME_KEY_ALIASES: Record<string, string> = {
  forza_motorsport: 'forza_motorsport_2023',
  forza_horizon: 'forza_horizon_5',
  forza_4: 'forza_horizon_4',
  forza_5: 'forza_horizon_5',
  fh4: 'forza_horizon_4',
  fh5: 'forza_horizon_5',
  fm7: 'forza_motorsport_7',
  forza_motorsport7: 'forza_motorsport_7',
  forza_motorsport_8: 'forza_motorsport_2023',
}

const uniqueOrdered = (values: string[]) => {
  const seen = new Set<string>()
  const result: string[] = []

  values.forEach((value) => {
    const normalized = value.trim()
    if (!normalized || seen.has(normalized)) {
      return
    }
    seen.add(normalized)
    result.push(normalized)
  })

  return result
}

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
  const gameCatalogRaw = window.localStorage.getItem(LOCAL_DEFAULT_GAME_CATALOG_KEY) || ''

  const catalogFromLocalStorage = parseDefaultGameCatalog(gameCatalogRaw)
  const flattenedFromCatalog = flattenGameCatalog(catalogFromLocalStorage)
  const games = uniqueOrdered([...parseOptionsInput(gamesRaw), ...flattenedFromCatalog.games])
  const tracks = uniqueOrdered([...parseOptionsInput(tracksRaw), ...flattenedFromCatalog.tracks])
  const cars = uniqueOrdered([...parseOptionsInput(carsRaw), ...flattenedFromCatalog.cars])

  return {
    games,
    tracks,
    cars,
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

export const parseDefaultGameCatalog = (value: string | null | undefined): GameDefaultsNode[] => {
  if (!value) {
    return []
  }

  try {
    const parsed = JSON.parse(value)
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
      .map((item) => {
        const game = typeof item?.game === 'string' ? item.game.trim() : ''
        const tracks = Array.isArray(item?.tracks) ? uniqueOrdered(item.tracks.map((track: unknown) => String(track || '').trim())) : []
        const cars = Array.isArray(item?.cars) ? uniqueOrdered(item.cars.map((car: unknown) => String(car || '').trim())) : []

        return {
          game,
          tracks,
          cars,
        }
      })
      .filter((item) => item.game)
  } catch {
    return []
  }
}

export const serializeDefaultGameCatalog = (catalog: GameDefaultsNode[]) => JSON.stringify(catalog, null, 2)

export const flattenGameCatalog = (catalog: GameDefaultsNode[]) => {
  return {
    games: uniqueOrdered(catalog.map((item) => item.game)),
    tracks: uniqueOrdered(catalog.flatMap((item) => item.tracks)),
    cars: uniqueOrdered(catalog.flatMap((item) => item.cars)),
  }
}

export const readLocalDefaultGameCatalog = (): GameDefaultsNode[] => {
  if (typeof window === 'undefined') {
    return []
  }

  const raw = window.localStorage.getItem(LOCAL_DEFAULT_GAME_CATALOG_KEY) || ''
  return parseDefaultGameCatalog(raw)
}

export const saveLocalDefaultGameCatalog = (catalog: GameDefaultsNode[]) => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(LOCAL_DEFAULT_GAME_CATALOG_KEY, serializeDefaultGameCatalog(catalog))
}

export const getBaseDefaultsForGame = (game: string): GameBaseDefaults => {
  const normalized = normalizeGameKey(game)
  const resolvedKey = GAME_KEY_ALIASES[normalized] || normalized
  const base = BASE_DEFAULTS_BY_GAME[resolvedKey]
  return {
    tracks: [...(base?.tracks || [])],
    cars: [...(base?.cars || [])],
  }
}

export const fillCatalogWithBaseDefaults = (catalog: GameDefaultsNode[]): GameDefaultsNode[] => {
  return catalog.map((node) => {
    const base = getBaseDefaultsForGame(node.game)
    if (base.tracks.length === 0 && base.cars.length === 0) {
      return {
        game: node.game,
        tracks: uniqueOrdered(node.tracks),
        cars: uniqueOrdered(node.cars),
      }
    }

    return {
      game: node.game,
      tracks: uniqueOrdered(base.tracks),
      cars: uniqueOrdered(base.cars),
    }
  })
}

export const buildCatalogFromFlatDefaults = (games: string[], tracks: string[], cars: string[]): GameDefaultsNode[] => {
  const baseCatalog = uniqueOrdered(games).map((game) => ({
    game,
    tracks: uniqueOrdered(tracks),
    cars: uniqueOrdered(cars),
  }))

  return fillCatalogWithBaseDefaults(baseCatalog)
}

export const isMissingSiteSettingsTableError = (message: string) =>
  /could not find the table 'public\.site_settings'/i.test(message)
