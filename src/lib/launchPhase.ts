export type LaunchPhase = 'prelaunch' | 'active' | 'established'

export function getLaunchPhase(launchDateIso: string, establishedAfterDays = 30): LaunchPhase {
  const launchTime = new Date(launchDateIso).getTime()
  const now = Date.now()

  if (Number.isNaN(launchTime) || now < launchTime) {
    return 'prelaunch'
  }

  const establishedTime = launchTime + establishedAfterDays * 24 * 60 * 60 * 1000
  if (now < establishedTime) {
    return 'active'
  }

  return 'established'
}

export function getDefaultLaunchDate(): string {
  return process.env.NEXT_PUBLIC_LAUNCH_DATE || '2026-07-01T00:00:00.000Z'
}
