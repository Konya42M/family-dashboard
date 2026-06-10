import { useState, useCallback, useMemo } from 'react';
import { Box, Typography, IconButton, useTheme } from '@mui/material';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

import RGL from 'react-grid-layout';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const GridLayout = (RGL as any).default || RGL;
type RGLLayout = { i: string; x: number; y: number; w: number; h: number; minW?: number; minH?: number; isDraggable?: boolean; isResizable?: boolean; };
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// ── Kiosk-Display-Zonen ────────────────────────────────────────────────────
import { HeroZone }     from '../components/display/HeroZone';
import { TimelineZone } from '../components/display/TimelineZone';
import { LiveInfoZone } from '../components/display/LiveInfoZone';

// ── Widget-System (Eltern-Modus) ───────────────────────────────────────────
import { ClockWidget }   from '../components/dashboard/ClockWidget';
import { PrayerWidget }  from '../components/dashboard/PrayerWidget';
import { WeatherWidget } from '../components/dashboard/WeatherWidget';
import { TransitWidget } from '../components/dashboard/TransitWidget';
import { TodayWidget }   from '../components/dashboard/TodayWidget';
import { TodosWidget }   from '../components/dashboard/TodosWidget';
import { PointsWidget }  from '../components/dashboard/PointsWidget';
import { TrafficWidget } from '../components/dashboard/TrafficWidget';
import {
  WidgetId, LayoutItem, WIDGET_REGISTRY, DEFAULT_LAYOUT, DEFAULT_ENABLED,
  loadLayout, saveLayout, loadEnabled, saveEnabled,
} from '../widgets/widgetRegistry';

import { useKiosk } from '../contexts/KioskContext';

// ─── Kiosk-Display (Pi) ───────────────────────────────────────────────────
function KioskDisplay() {
  return (
    <Box className="display-root" sx={{ height: '100%' }}>
      <Box className="display-hero">
        <HeroZone />
      </Box>
      <Box className="display-timeline">
        <TimelineZone />
      </Box>
      <Box className="display-live">
        <LiveInfoZone />
      </Box>
    </Box>
  );
}

// ─── Widget-Tile ──────────────────────────────────────────────────────────
const ACCENT: Record<WidgetId, string> = {
  clock: '#5b8dee', prayer: '#f5a623', weather: '#06b6d4', transit: '#3ecf8e',
  today: '#f56565', todos: '#a855f7', points: '#f5a623', traffic: '#ef4444',
};

const WIDGET_CONTENT: Record<WidgetId, React.ReactNode> = {
  clock: <ClockWidget />, prayer: <PrayerWidget />, weather: <WeatherWidget />,
  transit: <TransitWidget />, today: <TodayWidget />, todos: <TodosWidget />,
  points: <PointsWidget />, traffic: <TrafficWidget />,
};

function WidgetTile({ id, editMode, onRemove, children }: {
  id: WidgetId; editMode: boolean; onRemove: (id: WidgetId) => void; children: React.ReactNode;
}) {
  const theme = useTheme();
  const dark = theme.palette.mode === 'dark';
  const def = WIDGET_REGISTRY.find(w => w.id === id)!;
  const accent = ACCENT[id];
  return (
    <Box sx={{
      height: '100%', background: theme.palette.background.paper,
      border: editMode
        ? `1.5px dashed ${accent}`
        : `1px solid ${dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
      borderTop: editMode ? `1.5px dashed ${accent}` : `2.5px solid ${accent}`,
      borderRadius: '12px', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      boxShadow: dark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 10px rgba(0,0,0,0.06)',
      position: 'relative',
      ...(editMode && { animation: 'editPulse 2s ease-in-out infinite' }),
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: '10px', pt: '6px', pb: '2px', flexShrink: 0 }}>
        <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
          {def.icon} {def.label}
        </Typography>
        {editMode && (
          <IconButton size="small" onClick={() => onRemove(id)} sx={{ p: '2px', color: '#f56565' }}>
            <CloseRoundedIcon sx={{ fontSize: 14 }} />
          </IconButton>
        )}
      </Box>
      <Box sx={{ flex: 1, overflow: 'hidden', px: '10px', pb: '8px', minHeight: 0 }}>
        {children}
      </Box>
      {editMode && (
        <Box sx={{ position: 'absolute', inset: 0, background: `${accent}08`, pointerEvents: 'none', borderRadius: '12px' }} />
      )}
    </Box>
  );
}

// ─── Widget-Picker ────────────────────────────────────────────────────────
function WidgetPicker({ enabled, onToggle, onClose }: {
  enabled: WidgetId[]; onToggle: (id: WidgetId) => void; onClose: () => void;
}) {
  const theme = useTheme();
  const dark = theme.palette.mode === 'dark';
  return (
    <Box sx={{
      position: 'absolute', top: 36, right: 0, zIndex: 100,
      background: theme.palette.background.paper,
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: '14px', p: 1.5,
      boxShadow: dark ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 32px rgba(0,0,0,0.15)',
      width: 220,
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 800 }}>Widgets</Typography>
        <IconButton size="small" onClick={onClose} sx={{ p: '3px' }}><CloseRoundedIcon sx={{ fontSize: 14 }} /></IconButton>
      </Box>
      {WIDGET_REGISTRY.map(def => {
        const active = enabled.includes(def.id);
        return (
          <Box key={def.id} onClick={() => onToggle(def.id)} sx={{
            display: 'flex', alignItems: 'center', gap: 1.2,
            px: 1, py: '7px', borderRadius: 2, mb: '3px',
            background: active ? `${ACCENT[def.id]}18` : 'transparent',
            border: active ? `1px solid ${ACCENT[def.id]}40` : '1px solid transparent',
            cursor: 'pointer', transition: 'all 0.15s',
          }}>
            <Typography sx={{ fontSize: '1rem', lineHeight: 1 }}>{def.icon}</Typography>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: active ? ACCENT[def.id] : 'text.primary' }}>{def.label}</Typography>
              <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>{def.description}</Typography>
            </Box>
            <Box sx={{
              width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
              background: active ? ACCENT[def.id] : (dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Typography sx={{ fontSize: '0.65rem', color: active ? '#fff' : 'text.secondary', fontWeight: 800 }}>
                {active ? '✓' : '+'}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

// ─── Eltern Widget-Grid ───────────────────────────────────────────────────
const COLS = 12;
const ROW_H = 58;
const MARGIN: [number, number] = [6, 6];

function ParentWidgetGrid() {
  const theme = useTheme();
  const dark = theme.palette.mode === 'dark';
  const [editMode, setEditMode] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [enabled, setEnabled] = useState<WidgetId[]>(() => loadEnabled());
  const [layout, setLayout] = useState<LayoutItem[]>(() => loadLayout());

  const visibleLayout = useMemo((): RGLLayout[] =>
    layout
      .filter(item => enabled.includes(item.i as WidgetId))
      .map(item => {
        const def = WIDGET_REGISTRY.find(w => w.id === item.i);
        return {
          i: item.i, x: item.x, y: item.y, w: item.w, h: item.h,
          minW: def?.minW || 2, minH: def?.minH || 2,
          isDraggable: editMode, isResizable: editMode,
        };
      }),
  [layout, enabled, editMode]);

  const handleLayoutChange = useCallback((newLayout: RGLLayout[]) => {
    const updated: LayoutItem[] = newLayout.map(item => ({ i: item.i as WidgetId, x: item.x, y: item.y, w: item.w, h: item.h }));
    const merged = [...updated, ...layout.filter(l => !enabled.includes(l.i as WidgetId))];
    setLayout(merged); saveLayout(merged);
  }, [layout, enabled]);

  const toggleWidget = useCallback((id: WidgetId) => {
    setEnabled(prev => {
      const next = prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id];
      saveEnabled(next);
      if (!prev.includes(id)) {
        setLayout(cur => {
          if (cur.find(l => l.i === id)) return cur;
          const def = WIDGET_REGISTRY.find(w => w.id === id)!;
          const updated = [...cur, { i: id, x: 0, y: 999, w: def.defaultW, h: def.defaultH }];
          saveLayout(updated); return updated;
        });
      }
      return next;
    });
  }, []);

  const removeWidget = useCallback((id: WidgetId) => {
    setEnabled(prev => { const next = prev.filter(e => e !== id); saveEnabled(next); return next; });
  }, []);

  return (
    <Box sx={{ height: '100%', background: theme.palette.background.default, overflow: editMode ? 'auto' : 'hidden', position: 'relative' }}>
      {/* Toolbar */}
      <Box sx={{ position: 'absolute', top: 6, right: 8, zIndex: 200, display: 'flex', gap: '4px', alignItems: 'center' }}>
        {editMode && (
          <>
            <Box onClick={() => setPickerOpen(p => !p)} sx={{ display: 'flex', alignItems: 'center', gap: 0.6, px: 1.2, py: '5px', borderRadius: 2, cursor: 'pointer', background: 'rgba(91,141,238,0.2)', border: '1px solid rgba(91,141,238,0.4)' }}>
              <AddRoundedIcon sx={{ fontSize: 14, color: '#5b8dee' }} />
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#5b8dee' }}>Widget</Typography>
            </Box>
            <Box onClick={() => { saveLayout(DEFAULT_LAYOUT); saveEnabled(DEFAULT_ENABLED); setLayout(DEFAULT_LAYOUT); setEnabled(DEFAULT_ENABLED); }} sx={{ px: 1.2, py: '5px', borderRadius: 2, cursor: 'pointer', background: 'rgba(245,166,35,0.15)', border: '1px solid rgba(245,166,35,0.35)' }}>
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#f5a623' }}>Reset</Typography>
            </Box>
          </>
        )}
        <Box onClick={() => { setEditMode(e => !e); setPickerOpen(false); }} sx={{ display: 'flex', alignItems: 'center', gap: 0.6, px: 1.2, py: '5px', borderRadius: 2, cursor: 'pointer', background: editMode ? 'rgba(62,207,142,0.2)' : (dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'), border: editMode ? '1px solid rgba(62,207,142,0.4)' : `1px solid ${theme.palette.divider}` }}>
          {editMode
            ? <><LockRoundedIcon sx={{ fontSize: 14, color: '#3ecf8e' }} /><Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#3ecf8e' }}>Fertig</Typography></>
            : <><EditRoundedIcon sx={{ fontSize: 14, color: 'text.secondary' }} /><Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: 'text.secondary' }}>Anpassen</Typography></>}
        </Box>
      </Box>

      {pickerOpen && (
        <Box sx={{ position: 'absolute', top: 0, right: 0, zIndex: 300 }}>
          <WidgetPicker enabled={enabled} onToggle={toggleWidget} onClose={() => setPickerOpen(false)} />
        </Box>
      )}

      {editMode && (
        <Box sx={{ position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)', zIndex: 100, background: 'rgba(91,141,238,0.15)', border: '1px solid rgba(91,141,238,0.35)', borderRadius: 2, px: 1.5, py: '4px' }}>
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#5b8dee' }}>↔ Widgets ziehen & Ecken zum Skalieren</Typography>
        </Box>
      )}

      <GridLayout
        layout={visibleLayout as any}
        cols={COLS} rowHeight={ROW_H} width={800}
        margin={MARGIN} containerPadding={[6, 6]}
        onLayoutChange={handleLayoutChange as any}
        isDraggable={editMode} isResizable={editMode}
        resizeHandles={['s', 'e', 'se', 'sw', 'w', 'n', 'ne', 'nw']}
        compactType="vertical" preventCollision={false}
        style={{ minHeight: '100%' }}
      >
        {visibleLayout.map(item => {
          const id = item.i as WidgetId;
          return (
            <div key={id} style={{ cursor: editMode ? 'grab' : 'default' }}>
              <WidgetTile id={id} editMode={editMode} onRemove={removeWidget}>
                {WIDGET_CONTENT[id]}
              </WidgetTile>
            </div>
          );
        })}
      </GridLayout>

      {enabled.length === 0 && (
        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <Typography sx={{ fontSize: '3rem' }}>📱</Typography>
          <Typography variant="h6" fontWeight={700} color="text.secondary">Keine Widgets aktiv</Typography>
          <Box onClick={() => { setEditMode(true); setPickerOpen(true); }} sx={{ px: 2, py: 1, borderRadius: 2, background: 'rgba(91,141,238,0.15)', border: '1px solid rgba(91,141,238,0.35)', cursor: 'pointer' }}>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#5b8dee' }}>+ Widgets hinzufügen</Typography>
          </Box>
        </Box>
      )}

      <style>{`
        @keyframes editPulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(91,141,238,0); } 50% { box-shadow: 0 0 8px 2px rgba(91,141,238,0.25); } }
        .react-grid-item.react-grid-placeholder { background: rgba(91,141,238,0.15) !important; border: 2px dashed rgba(91,141,238,0.5) !important; border-radius: 12px !important; }
        .react-resizable-handle { position: absolute; width: 16px; height: 16px; background: none; border: none; opacity: 0; transition: opacity 0.2s; }
        .react-resizable-handle::after { content: ''; position: absolute; width: 6px; height: 6px; border-color: rgba(91,141,238,0.8); border-style: solid; }
        .react-resizable:hover .react-resizable-handle { opacity: 1; }
        .react-resizable-handle-se { bottom: 2px; right: 2px; cursor: se-resize; }
        .react-resizable-handle-se::after { bottom: 0; right: 0; border-width: 0 2px 2px 0; }
        .react-resizable-handle-sw { bottom: 2px; left: 2px; cursor: sw-resize; }
        .react-resizable-handle-sw::after { bottom: 0; left: 0; border-width: 0 0 2px 2px; }
        .react-resizable-handle-ne { top: 2px; right: 2px; cursor: ne-resize; }
        .react-resizable-handle-ne::after { top: 0; right: 0; border-width: 2px 2px 0 0; }
        .react-resizable-handle-nw { top: 2px; left: 2px; cursor: nw-resize; }
        .react-resizable-handle-nw::after { top: 0; left: 0; border-width: 2px 0 0 2px; }
        .react-resizable-handle-n { top: 2px; left: 50%; transform: translateX(-50%); cursor: n-resize; }
        .react-resizable-handle-n::after { top: 0; left: 50%; transform: translateX(-50%); border-width: 2px 0 0 0; width: 12px; }
        .react-resizable-handle-s { bottom: 2px; left: 50%; transform: translateX(-50%); cursor: s-resize; }
        .react-resizable-handle-s::after { bottom: 0; left: 50%; transform: translateX(-50%); border-width: 0 0 2px 0; width: 12px; }
        .react-resizable-handle-e { right: 2px; top: 50%; transform: translateY(-50%); cursor: e-resize; }
        .react-resizable-handle-e::after { right: 0; top: 50%; transform: translateY(-50%); border-width: 0 2px 0 0; height: 12px; }
        .react-resizable-handle-w { left: 2px; top: 50%; transform: translateY(-50%); cursor: w-resize; }
        .react-resizable-handle-w::after { left: 0; top: 50%; transform: translateY(-50%); border-width: 0 0 0 2px; height: 12px; }
      `}</style>
    </Box>
  );
}

// ─── DashboardPage ────────────────────────────────────────────────────────
export function DashboardPage() {
  const { isKiosk } = useKiosk();
  return isKiosk ? <KioskDisplay /> : <ParentWidgetGrid />;
}
