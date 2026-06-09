import { useState, useRef, useCallback } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { ClockWidget } from '../components/dashboard/ClockWidget';
import { PrayerWidget } from '../components/dashboard/PrayerWidget';
import { TrafficWidget } from '../components/dashboard/TrafficWidget';
import { TransitWidget } from '../components/dashboard/TransitWidget';
import { TodayWidget } from '../components/dashboard/TodayWidget';
import { TodosWidget } from '../components/dashboard/TodosWidget';
import { MealWidget } from '../components/dashboard/MealWidget';
import { PointsWidget } from '../components/dashboard/PointsWidget';

const CARD_BG = 'rgba(255,255,255,0.035)';
const CARD_BORDER = '1px solid rgba(255,255,255,0.07)';
const CARD_SHADOW = '0 4px 24px rgba(0,0,0,0.35)';

function Card({ children, sx = {} }: { children: React.ReactNode; sx?: object }) {
  return (
    <Box sx={{
      background: CARD_BG,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: CARD_BORDER,
      borderRadius: '14px',
      boxShadow: CARD_SHADOW,
      p: '10px 12px',
      overflow: 'hidden',
      ...sx,
    }}>
      {children}
    </Box>
  );
}

// View 1: Clock + Prayer | Transit + Traffic | Todos + Today
function MainView() {
  return (
    <Box sx={{
      display: 'grid',
      gridTemplateRows: '1fr 1fr 1fr',
      gridTemplateColumns: '1fr 1fr',
      gap: '8px',
      p: '8px',
      height: '100%',
      // Row 1: Clock (wide) | Prayer
      // Row 2: Transit | Traffic
      // Row 3: Todos | Today
    }}>
      {/* Clock — spans full width top */}
      <Card sx={{ gridColumn: '1 / 2', gridRow: '1 / 2', display: 'flex', alignItems: 'center' }}>
        <ClockWidget />
      </Card>

      {/* Prayer */}
      <Card sx={{ gridColumn: '2 / 3', gridRow: '1 / 3', overflow: 'hidden' }}>
        <PrayerWidget />
      </Card>

      {/* Transit */}
      <Card sx={{ gridColumn: '1 / 2', gridRow: '2 / 3' }}>
        <TransitWidget />
      </Card>

      {/* Todos */}
      <Card sx={{ gridColumn: '1 / 2', gridRow: '3 / 4' }}>
        <TodosWidget />
      </Card>

      {/* Today */}
      <Card sx={{ gridColumn: '2 / 3', gridRow: '3 / 4' }}>
        <TodayWidget />
      </Card>
    </Box>
  );
}

// View 2: Traffic + Meals + Points
function FamilyView() {
  return (
    <Box sx={{
      display: 'grid',
      gridTemplateRows: '1fr 1fr',
      gridTemplateColumns: '1fr 1fr',
      gap: '8px',
      p: '8px',
      height: '100%',
    }}>
      {/* Traffic — top full width */}
      <Card sx={{ gridColumn: '1 / 3', gridRow: '1 / 2' }}>
        <TrafficWidget />
      </Card>

      {/* Meals */}
      <Card sx={{ gridColumn: '1 / 2', gridRow: '2 / 3' }}>
        <MealWidget />
      </Card>

      {/* Points */}
      <Card sx={{ gridColumn: '2 / 3', gridRow: '2 / 3' }}>
        <PointsWidget />
      </Card>
    </Box>
  );
}

const VIEWS = [
  { id: 'main', label: 'Übersicht', component: <MainView /> },
  { id: 'family', label: 'Familie', component: <FamilyView /> },
];

export function DashboardPage() {
  const [activeView, setActiveView] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx < 0 && activeView < VIEWS.length - 1) setActiveView(v => v + 1);
      if (dx > 0 && activeView > 0) setActiveView(v => v - 1);
    }
    touchStartX.current = null;
    touchStartY.current = null;
  }, [activeView]);

  return (
    <Box
      sx={{ height: '100%', overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Views */}
      <Box sx={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {VIEWS.map((view, i) => (
          <Box key={view.id} sx={{
            position: 'absolute',
            inset: 0,
            transform: `translateX(${(i - activeView) * 100}%)`,
            transition: 'transform 0.32s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            willChange: 'transform',
          }}>
            {view.component}
          </Box>
        ))}
      </Box>

      {/* Bottom nav dots */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        py: 0.6,
        background: 'rgba(0,0,0,0.3)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
      }}>
        {VIEWS.map((view, i) => (
          <Box
            key={view.id}
            onClick={() => setActiveView(i)}
            sx={{
              display: 'flex', alignItems: 'center', gap: 0.8, cursor: 'pointer',
              px: 1.2, py: 0.4, borderRadius: 2,
              background: activeView === i ? 'rgba(77,144,254,0.2)' : 'transparent',
              border: activeView === i ? '1px solid rgba(77,144,254,0.3)' : '1px solid transparent',
              transition: 'all 0.25s',
            }}
          >
            <Box sx={{
              width: activeView === i ? 18 : 6,
              height: 6,
              borderRadius: 3,
              background: activeView === i ? '#4d90fe' : 'rgba(255,255,255,0.25)',
              transition: 'all 0.25s',
            }} />
            {activeView === i && (
              <Typography sx={{ fontSize: '0.62rem', color: '#80b0ff', fontWeight: 600, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                {view.label}
              </Typography>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

