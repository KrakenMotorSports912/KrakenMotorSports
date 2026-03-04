'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getDefaultLaunchDate, getLaunchPhase, type LaunchPhase } from '@/lib/launchPhase'

type LaunchSettings = {
  launchDate: string
  phase: LaunchPhase
  source: 'supabase' | 'env'
}

export function useLaunchSettings() {
  const [settings, setSettings] = useState<LaunchSettings>({
    launchDate: getDefaultLaunchDate(),
    phase: getLaunchPhase(getDefaultLaunchDate()),
    source: 'env',
  })

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('site_settings')
        .select('value_text')
        .eq('key', 'launch_date')
        .single()

      if (!error && data?.value_text) {
        const launchDate = data.value_text
        setSettings({
          launchDate,
          phase: getLaunchPhase(launchDate),
          source: 'supabase',
        })
      }
    }

    load()
  }, [])

  return settings
}
