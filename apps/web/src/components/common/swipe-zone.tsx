/**
 * Swipe Zone — horizontal swipe gesture for the dashboard month
 * (M4, design D3). `touch-pan-y` keeps vertical scrolling native;
 * the direction decision is the pure `swipeDirection` helper.
 *
 * @module Components/Common/SwipeZone
 */

'use client';

import { useRef, type JSX, type ReactNode } from 'react';
import { swipeDirection } from '@/lib/month-navigation';

interface SwipeZoneProps {
  children: ReactNode;
  /** +1 = mois suivant (swipe gauche), -1 = précédent. */
  onSwipe: (direction: number) => void;
}

export function SwipeZone({ children, onSwipe }: SwipeZoneProps): JSX.Element {
  const start = useRef<{ x: number; y: number } | null>(null);

  return (
    <div
      className="touch-pan-y"
      onPointerDown={(e) => {
        start.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerUp={(e) => {
        const origin = start.current;
        start.current = null;
        if (!origin) return;
        const direction = swipeDirection(
          e.clientX - origin.x,
          e.clientY - origin.y
        );
        if (direction !== 0) onSwipe(direction);
      }}
    >
      {children}
    </div>
  );
}
