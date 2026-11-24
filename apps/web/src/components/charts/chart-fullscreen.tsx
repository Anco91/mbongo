/**
 * Chart Fullscreen — fullscreen chart viewer: zoom buttons + wheel zoom,
 * drag to pan, reset, close. Per the maquette.
 *
 * @module Components/Common/ChartFullscreen
 */

'use client';

import { useRef, useState, JSX } from 'react';

interface ChartFullscreenProps {
  title: string;
  onClose: () => void;
  /** Rendered between header and pan area, unaffected by zoom/pan. */
  toolbar?: React.ReactNode;
  children: React.ReactNode;
}

export function ChartFullscreen({
  title,
  onClose,
  toolbar,
  children,
}: ChartFullscreenProps): JSX.Element {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<{ px: number; py: number; x: number; y: number } | null>(
    null
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-slate-400">
            Plein écran
          </p>
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(1, z - 0.25))}
            className="h-8 w-8 rounded-full bg-slate-100 text-base font-semibold text-slate-700"
            aria-label="Zoom arrière"
          >
            −
          </button>
          <span className="w-10 text-center text-xs text-slate-500">
            {Math.round(zoom * 100)} %
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(4, z + 0.25))}
            className="h-8 w-8 rounded-full bg-slate-100 text-base font-semibold text-slate-700"
            aria-label="Zoom avant"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            className="rounded-full bg-slate-100 px-2.5 py-1.5 text-[11px] font-medium text-slate-600"
          >
            Réinitialiser
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-slate-900 text-sm text-white"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>
      </div>

      {toolbar}

      <div
        className="flex-1 cursor-grab touch-none overflow-hidden active:cursor-grabbing"
        onWheel={(e) =>
          setZoom((z) =>
            Math.min(4, Math.max(1, z * (e.deltaY < 0 ? 1.08 : 0.93)))
          )
        }
        onPointerDown={(e) => {
          drag.current = { px: pan.x, py: pan.y, x: e.clientX, y: e.clientY };
        }}
        onPointerMove={(e) => {
          if (drag.current)
            setPan({
              x: drag.current.px + (e.clientX - drag.current.x),
              y: drag.current.py + (e.clientY - drag.current.y),
            });
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerLeave={() => {
          drag.current = null;
        }}
      >
        <div
          className="h-full w-full"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
          }}
        >
          {children}
        </div>
      </div>

      <p className="border-t border-slate-100 px-4 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] text-center text-[11px] text-slate-400">
        Glisser pour naviguer · boutons ou molette pour zoomer
      </p>
    </div>
  );
}
