'use client';

import { useKonamiCode, activateKrakenMode } from '@/hooks/useKonamiCode';

export function KonamiCodeListener() {
  useKonamiCode(() => {
    activateKrakenMode();
  });

  return null;
}
