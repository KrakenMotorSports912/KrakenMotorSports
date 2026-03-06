'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  FALLBACK_CARS,
  FALLBACK_GAMES,
  FALLBACK_TRACKS,
  GameDefaultsNode,
  buildCatalogFromFlatDefaults,
  flattenGameCatalog,
  fillCatalogWithBaseDefaults,
  getBaseDefaultsForGame,
  isMissingSiteSettingsTableError,
  parseDefaultGameCatalog,
  parseOptionsInput,
  readLocalDefaultGameCatalog,
  readLocalDefaultOptions,
  saveLocalDefaultGameCatalog,
  saveLocalDefaultOptions,
  serializeDefaultGameCatalog,
} from '@/lib/adminDefaults'

type SiteSettingRow = {
  key: string
  value_text: string | null
}

const createEmptyNode = (game: string): GameDefaultsNode => ({
  game,
  tracks: getBaseDefaultsForGame(game).tracks,
  cars: getBaseDefaultsForGame(game).cars,
})

const uniqueOrdered = (values: string[]) => {
  const seen = new Set<string>()
  const result: string[] = []

  values.forEach((value) => {
    const normalized = value.trim()
    if (!normalized || seen.has(normalized)) return
    seen.add(normalized)
    result.push(normalized)
  })

  return result
}

export default function AdminDefaultsPage() {
  const supabase = createClient()
  const [catalog, setCatalog] = useState<GameDefaultsNode[]>([])
  const [selectedGame, setSelectedGame] = useState('')
  const [carSortMode, setCarSortMode] = useState<'none' | 'brand' | 'alphabetical'>('none')
  const [gamesDraft, setGamesDraft] = useState('')
  const [tracksDraft, setTracksDraft] = useState('')
  const [carsDraft, setCarsDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const selectedNode = useMemo(
    () => catalog.find((item) => item.game === selectedGame) || null,
    [catalog, selectedGame]
  )

  useEffect(() => {
    fetchDefaults()
  }, [])

  useEffect(() => {
    if (!selectedNode) {
      setTracksDraft('')
      setCarsDraft('')
      return
    }

    setTracksDraft(selectedNode.tracks.join('\n'))
    setCarsDraft(selectedNode.cars.join('\n'))
  }, [selectedNode])

  const fetchDefaults = async () => {
    setLoading(true)

    const localCatalog = readLocalDefaultGameCatalog()
    const localFlat = readLocalDefaultOptions()
    const localSeed =
      localCatalog.length > 0
        ? localCatalog
        : buildCatalogFromFlatDefaults(localFlat.games, localFlat.tracks, localFlat.cars)

    if (localSeed.length > 0) {
      setCatalog(localSeed)
      setSelectedGame(localSeed[0].game)
      setGamesDraft(localSeed.map((item) => item.game).join('\n'))
    }

    const { data, error } = await supabase
      .from('site_settings')
      .select('key, value_text')
      .in('key', ['default_game_catalog', 'default_games', 'default_tracks', 'default_cars'])

    if (!error && data) {
      const settings = data as SiteSettingRow[]
      const catalogSetting = settings.find((item) => item.key === 'default_game_catalog')?.value_text
      const parsedCatalog = parseDefaultGameCatalog(catalogSetting)

      const nextCatalog =
        parsedCatalog.length > 0
          ? parsedCatalog
          : buildCatalogFromFlatDefaults(
              parseOptionsInput(settings.find((item) => item.key === 'default_games')?.value_text || ''),
              parseOptionsInput(settings.find((item) => item.key === 'default_tracks')?.value_text || ''),
              parseOptionsInput(settings.find((item) => item.key === 'default_cars')?.value_text || '')
            )

      if (nextCatalog.length > 0) {
        setCatalog(nextCatalog)
        setSelectedGame(nextCatalog[0].game)
        setGamesDraft(nextCatalog.map((item) => item.game).join('\n'))
      }
    }

    setCatalog((previous) => {
      if (previous.length > 0) {
        return previous
      }

      const fallbackCatalog = buildCatalogFromFlatDefaults(FALLBACK_GAMES, FALLBACK_TRACKS, FALLBACK_CARS)
      setSelectedGame(fallbackCatalog[0]?.game || '')
      setGamesDraft(fallbackCatalog.map((item) => item.game).join('\n'))
      return fallbackCatalog
    })

    setLoading(false)
  }

  const updateSelectedNode = (updates: Partial<GameDefaultsNode>) => {
    if (!selectedNode) return

    setCatalog((previous) =>
      previous.map((item) =>
        item.game === selectedNode.game
          ? {
              ...item,
              ...updates,
            }
          : item
      )
    )
  }

  const commitDraftsForGame = (gameKey: string) => {
    if (!gameKey) return

    const nextTracks = parseOptionsInput(tracksDraft)
    const nextCars = parseOptionsInput(carsDraft)

    setCatalog((previous) =>
      previous.map((item) =>
        item.game === gameKey
          ? {
              ...item,
              tracks: nextTracks,
              cars: nextCars,
            }
          : item
      )
    )
  }

  const handleSelectGame = (nextGame: string) => {
    commitDraftsForGame(selectedGame)
    setSelectedGame(nextGame)
  }

  const getCarBrand = (carName: string) => {
    const value = carName.trim()
    if (!value) return ''

    const lower = value.toLowerCase()
    const knownBrands = [
      'aston martin',
      'alfa romeo',
      'mercedes-amg',
      'mercedes benz',
      'land rover',
      'range rover',
    ]

    const matched = knownBrands.find((brand) => lower.startsWith(brand))
    if (matched) {
      return matched
        .split(' ')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
    }

    return value.split(/\s+/)[0]
  }

  const applyCarSortForMode = (mode: 'none' | 'brand' | 'alphabetical') => {
    if (!selectedNode) return
    if (mode === 'none') {
      setMessage('None selected. Keeping current order.')
      return
    }

    const currentCars = parseOptionsInput(carsDraft)
    const sortedCars =
      mode === 'alphabetical'
        ? [...currentCars].sort((a, b) => a.localeCompare(b))
        : [...currentCars].sort((a, b) => {
            const brandA = getCarBrand(a)
            const brandB = getCarBrand(b)
            const brandCompare = brandA.localeCompare(brandB)
            if (brandCompare !== 0) return brandCompare
            return a.localeCompare(b)
          })

    setCarsDraft(sortedCars.join('\n'))
    updateSelectedNode({ cars: sortedCars })
    setMessage(mode === 'brand' ? 'Cars sorted by brand.' : 'Cars sorted alphabetically.')
  }

  const handleCarSortModeChange = (mode: 'none' | 'brand' | 'alphabetical') => {
    setCarSortMode(mode)
    applyCarSortForMode(mode)
  }

  const commitGamesFromText = (value: string, baseCatalog: GameDefaultsNode[] = catalog) => {
    const nextGames = uniqueOrdered(parseOptionsInput(value))

    if (nextGames.length === 0) {
      return [] as GameDefaultsNode[]
    }

    const byGame = new Map(baseCatalog.map((item) => [item.game, item]))
    return nextGames.map((game) => byGame.get(game) || createEmptyNode(game))
  }

  const applyGamesDraftToCatalog = () => {
    const nextCatalog = commitGamesFromText(gamesDraft)

    setCatalog(nextCatalog)
    if (nextCatalog.length === 0) {
      setSelectedGame('')
    } else if (!nextCatalog.some((item) => item.game === selectedGame)) {
      setSelectedGame(nextCatalog[0].game)
    }

    setMessage('')
  }

  const fillWithBaseDefaults = () => {
    const catalogWithGames = commitGamesFromText(gamesDraft)

    if (catalogWithGames.length === 0) {
      setMessage('Add at least one game before filling defaults.')
      return
    }

    const nextCatalog = fillCatalogWithBaseDefaults(catalogWithGames)
    setCatalog(nextCatalog)
    setGamesDraft(nextCatalog.map((item) => item.game).join('\n'))
    if (!nextCatalog.some((item) => item.game === selectedGame)) {
      setSelectedGame(nextCatalog[0]?.game || '')
    }
    setMessage('Filled known games with base (non-DLC) tracks and cars. Save to persist.')
  }

  const saveDefaults = async () => {
    setSaving(true)
    setMessage('')

    const catalogWithGames = commitGamesFromText(gamesDraft)

    const catalogForSave = catalogWithGames.map((item) =>
      item.game === selectedGame
        ? {
            ...item,
            tracks: parseOptionsInput(tracksDraft),
            cars: parseOptionsInput(carsDraft),
          }
        : item
    )

    const normalized = catalogForSave.map((item) => ({
      game: item.game.trim(),
      tracks: parseOptionsInput(item.tracks.join('\n')),
      cars: parseOptionsInput(item.cars.join('\n')),
    }))

    if (normalized.some((item) => !item.game)) {
      setMessage('Every game row needs a valid game key.')
      setSaving(false)
      return
    }

    if (normalized.some((item) => item.tracks.length === 0)) {
      setMessage('Every game needs at least one track.')
      setSaving(false)
      return
    }

    if (normalized.some((item) => item.cars.length === 0)) {
      setMessage('Every game needs at least one car.')
      setSaving(false)
      return
    }

    const flattened = flattenGameCatalog(normalized)

    const { error } = await supabase
      .from('site_settings')
      .upsert(
        [
          { key: 'default_game_catalog', value_text: serializeDefaultGameCatalog(normalized) },
          { key: 'default_games', value_text: flattened.games.join('\n') },
          { key: 'default_tracks', value_text: flattened.tracks.join('\n') },
          { key: 'default_cars', value_text: flattened.cars.join('\n') },
        ],
        { onConflict: 'key' }
      )

    if (error) {
      if (isMissingSiteSettingsTableError(error.message)) {
        saveLocalDefaultGameCatalog(normalized)
        saveLocalDefaultOptions(flattened.games, flattened.tracks, flattened.cars)
        setMessage('Saved defaults locally in this browser. To sync across devices, create the site_settings table in Supabase.')
      } else {
        setMessage(`Could not save defaults: ${error.message}`)
        setSaving(false)
        return
      }
    } else {
      saveLocalDefaultGameCatalog(normalized)
      saveLocalDefaultOptions(flattened.games, flattened.tracks, flattened.cars)
      setMessage('Game hierarchy defaults saved successfully.')
    }

    setCatalog(normalized)
    setGamesDraft(normalized.map((item) => item.game).join('\n'))
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl sm:text-4xl font-display tracking-wider text-kraken-cyan mb-2">DEFAULTS HIERARCHY</h2>
        <p className="text-gray-400">
          Manage defaults as <span className="text-white">Game -&gt; Tracks + Cars</span>. These values power form and Discord autofill.
        </p>
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-6">
        <div className="card space-y-4">
          <h3 className="text-xl font-display text-kraken-cyan">GAMES</h3>
          <p className="text-gray-400 text-sm">One game key per line (or comma separated).</p>
          <textarea
            value={gamesDraft}
            onChange={(event) => setGamesDraft(event.target.value)}
            onBlur={applyGamesDraftToCatalog}
            className="input-field min-h-[360px]"
            placeholder="assetto_corsa_competizione\nf1_2025\nforza_horizon_4\nforza_horizon_5\nmario_kart_wii"
          />
          <button type="button" onClick={fillWithBaseDefaults} className="btn-secondary w-full">
            FILL BASE DEFAULTS (NO DLC)
          </button>
        </div>

        <div className="card space-y-5">
          {!selectedNode ? (
            <p className="text-gray-400">Add at least one game to edit tracks and cars.</p>
          ) : (
            <>
              <div>
                <label className="block text-kraken-cyan mb-2 font-display">SELECT GAME</label>
                <select
                  value={selectedGame}
                  onChange={(event) => handleSelectGame(event.target.value)}
                  className="input-field"
                >
                  {catalog.map((item) => (
                    <option key={item.game} value={item.game}>
                      {item.game}
                    </option>
                  ))}
                </select>
                <p className="text-gray-400 text-sm">One value per line (comma also supported).</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-kraken-cyan mb-2 font-display">TRACKS FOR THIS GAME</label>
                  <textarea
                    value={tracksDraft}
                    onChange={(event) => setTracksDraft(event.target.value)}
                    onBlur={() => commitDraftsForGame(selectedGame)}
                    className="input-field min-h-[240px]"
                    placeholder="Monza\nSpa-Francorchamps"
                  />
                </div>
                <div>
                  <label className="block text-kraken-cyan mb-2 font-display">CARS FOR THIS GAME</label>
                  <div className="flex flex-col sm:flex-row gap-2 mb-2">
                    <select
                      value={carSortMode}
                      onChange={(event) => handleCarSortModeChange(event.target.value as 'none' | 'brand' | 'alphabetical')}
                      className="input-field"
                    >
                      <option value="none">Sort: None</option>
                      <option value="brand">Sort: Brand (A-Z)</option>
                      <option value="alphabetical">Sort: Car Name (A-Z)</option>
                    </select>
                  </div>
                  <textarea
                    value={carsDraft}
                    onChange={(event) => setCarsDraft(event.target.value)}
                    onBlur={() => commitDraftsForGame(selectedGame)}
                    className="input-field min-h-[240px]"
                    placeholder="Porsche 911 GT3\nFerrari 296 GT3"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <button type="button" onClick={saveDefaults} disabled={saving} className="btn-primary w-full md:w-auto">
              {saving ? 'SAVING...' : 'SAVE DEFAULT HIERARCHY'}
            </button>
          </div>
          {message && <p className="text-sm text-gray-300">{message}</p>}
          <p className="text-xs text-gray-500">
            Saves to <span className="text-gray-400">site_settings</span> keys: default_game_catalog, default_games, default_tracks, default_cars.
          </p>
        </div>
      </div>
    </div>
  )
}
