'use client';

import { useCallback } from 'react';
import { useKonamiCode, activateKrakenMode } from '@/hooks/useKonamiCode';

export function KonamiCodeListener() {
  const handleKonami = useCallback(() => {
    activateKrakenMode();
  }, []);

  useKonamiCode(handleKonami);

  return null;
}
