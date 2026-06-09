import { useState, useRef, useCallback, useEffect } from 'react';
import { Box, Typography, Stack, useTheme } from '@mui/material';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { ClockWidget } from '../components/dashboard/ClockWidget';
import { PrayerWidget } from '../components/dashboard/PrayerWidget';
import { WeatherWidget } from '../components/dashboard/WeatherWidget';
import { TransitWidget } from '../components/dashboard/TransitWidget';
import { TodayWidget } from '../components/dashboard/TodayWidget';
import { TodosWidget } from '../components/dashboard/TodosWidget';
import { PointsWidget } from '../components/dashboard/PointsWidget';

// ─── Tile ─────────────────────────────────────────────────────────────────────
function Tile({ children, sx = {}, accent, label }: { children: React.ReactNode; sx?: object; accent?: string; label?: string }) {
  const theme = useTheme();
  const dark = theme.palette.mode === 'dark';
  return (
    <Box sx={{
      background: theme.palette.background.paper,
      border: `1px solid ${accent ? accent + '35' : theme.palette.divider}`,
      borderRadius: '14px',
      overflow: 'hidden',
      height: '100%',
      position: 'relative',
      boxShadow: dark ? '0 2px 16px rgba(0,0,0,0.25)' : '0 2px 12px rgba(0,0,0,0.06)',
      ...(accent ? { borderTop: `2.5px solid ${accent}` } : {}),
      ...sx,
    }}>
      {label && (
        <Typography variant="caption" color="text.secondary" sx={{
          position: 'absolute', top: 8, left: 10, zIndex: 1,
          textTransform: 'uppercase', letterSpacing: '0.07em', fontSize: '0.58rem', fontWeight: 700,
        }}>{label}</Typography>
      )}
      <Box sx={{ p: label ? '22px 10px 8px' : '10px', height: '100%' }}>
        {children}
      </Box>
    </Box>
  );
}

// ─── View 1: Command Center ────────────────────────────────────────────────────
// Unique layout for 800×440:
//  ┌──────────────────┬─────────────┐
//  │   WETTER (25%)   │ GEBET (38%) │ ROW 1 - 38%
//  │                  │             │
//  ├──────┬───────────┤             │
//  │      │  UHR +    │             │
//  │  ÖPN │  DATUM    ├─────────────┤
//  │  V   │  (Mitte)  │             │ ROW 2 - 34%
//  │      │           │ AUFGABEN    │
//  ├──────┴───────────┤             │
//  │   HEUTE  (37%)   │             │ ROW 3 - 28%
//  │  Termine         │             │
//  └──────────────────┴─────────────┘
function MainView() {
  return (
    <Box sx={{
      display: 'grid',
      gridTemplateColumns: '28% 34% 38%',
      gridTemplateRows: '38% 34% 28%',
      gap: '7px',
      p: '7px',
      height: '100%',
    }}>
      {/* Wetter — top left */}
      <Tile sx={{ gridColumn: '1/2', gridRow: '1/2' }} accent="#5b8dee" label="Wetter">
        <WeatherWidget />
      </Tile>

      {/* Uhr — center, spans row 1+2 */}
      <Tile sx={{ gridColumn: '2/3', gridRow: '1/3', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }} accent="#5b8dee">
        <ClockWidget />
      </Tile>

      {/* Gebetszeiten — right, spans all rows */}
      <Tile sx={{ gridColumn: '3/4', gridRow: '1/4' }} accent="#f5a623" label="Gebetszeiten · Stuttgart">
        <PrayerWidget />
      </Tile>

      {/* ÖPNV — left row 2 */}
      <Tile sx={{ gridColumn: '1/2', gridRow: '2/3' }} accent="#3ecf8e" label="ÖPNV · Bernsteinstr.">
        <TransitWidget />
      </Tile>

      {/* Aufgaben — center row 2+3 */}
      <Tile sx={{ gridColumn: '2/3', gridRow: '3/4' }} accent="#a855f7" label="Aufgaben">
        <TodosWidget />
      </Tile>

      {/* Heute / Termine — bottom left */}
      <Tile sx={{ gridColumn: '1/2', gridRow: '3/4' }} accent="#f56565" label="Heute">
        <TodayWidget />
      </Tile>
    </Box>
  );
}

// ─── View 2: Familie ──────────────────────────────────────────────────────────
function FamilyView() {
  return (
    <Box sx={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gridTemplateRows: '1fr 1fr',
      gap: '7px',
      p: '7px',
      height: '100%',
    }}>
      <Tile sx={{ gridColumn: '1/3' }} accent="#f5a623" label="Punkte & Rangliste">
        <PointsWidget />
      </Tile>
      <Tile accent="#5b8dee" label="ÖPNV">
        <TransitWidget />
      </Tile>
      <Tile accent="#3ecf8e" label="Wetter">
        <WeatherWidget />
      </Tile>
    </Box>
  );
}

const VIEWS = [
  { id: 'main',   label: 'Übersicht', component: <MainView /> },
  { id: 'family', label: 'Familie',   component: <FamilyView /> },
];

// ─── DashboardPage ────────────────────────────────────────────────────────────
export function DashboardPage() {
  const [active, setActive] = useState(0);
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const theme = useTheme();
  const dark = theme.palette.mode === 'dark';

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (startX.current === null) return;
    const dx = e.changedTouches[0].clientX - startX.current!;
    const dy = e.changedTouches[0].clientY - startY.current!;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 45) {
      if (dx < 0 && active < VIEWS.length - 1) setActive(v => v + 1);
      if (dx > 0 && active > 0) setActive(v => v - 1);
    }
    startX.current = null;
  }, [active]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: theme.palette.background.default }}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>

      <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {VIEWS.map((v, i) => (
          <Box key={v.id} className="view-slide" sx={{ transform: `translateX(${(i - active) * 100}%)` }}>
            {v.component}
          </Box>
        ))}
      </Box>

      {/* Indicator bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, py: '5px', background: dark ? '#0d0f18' : '#f4f6fc', borderTop: `1px solid ${theme.palette.divider}` }}>
        {VIEWS.map((v, i) => (
          <Box key={v.id} onClick={() => setActive(i)} sx={{ display: 'flex', alignItems: 'center', gap: 0.7, cursor: 'pointer', px: 1, py: '3px', borderRadius: 2, background: active === i ? 'rgba(91,141,238,0.12)' : 'transparent', border: active === i ? '1px solid rgba(91,141,238,0.25)' : '1px solid transparent', transition: 'all 0.2s' }}>
            <Box sx={{ width: active === i ? 14 : 5, height: 5, borderRadius: 3, background: active === i ? '#5b8dee' : (dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'), transition: 'all 0.2s' }} />
            {active === i && <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color: '#5b8dee' }}>{v.label}</Typography>}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

