import { useState, useCallback, useMemo } from 'react';
import RGL from 'react-grid-layout';
// react-grid-layout exports default differently depending on bundler
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const GridLayout = (RGL as any).default || RGL;
type RGLLayout = { i: string; x: number; y: number; w: number; h: number; minW?: number; minH?: number; maxW?: number; maxH?: number; isDraggable?: boolean; isResizable?: boolean; static?: boolean; };
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { Box, Typography, IconButton, Tooltip, useTheme } from '@mui/material';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

import { ClockWidget } from '../components/dashboard/ClockWidget';
import { PrayerWidget } from '../components/dashboard/PrayerWidget';
import { WeatherWidget } from '../components/dashboard/WeatherWidget';
import { TransitWidget } from '../components/dashboard/TransitWidget';
import { TodayWidget } from '../components/dashboard/TodayWidget';
import { TodosWidget } from '../components/dashboard/TodosWidget';
import { PointsWidget } from '../components/dashboard/PointsWidget';
import { TrafficWidget } from '../components/dashboard/TrafficWidget';

import {
  WidgetId, LayoutItem, WIDGET_REGISTRY,
  loadLayout, saveLayout, loadEnabled, saveEnabled,
} from '../widgets/widgetRegistry';

// ─── Widget content map ───────────────────────────────────────────────────────
const WIDGET_CONTENT: Record<WidgetId, React.ReactNode> = {
  clock:   <ClockWidget />,
  prayer:  <PrayerWidget />,
  weather: <WeatherWidget />,
  transit: <TransitWidget />,
  today:   <TodayWidget />,
  todos:   <TodosWidget />,
  points:  <PointsWidget />,
  traffic: <TrafficWidget />,
};

const ACCENT: Record<WidgetId, string> = {
  clock:   '#5b8dee',
  prayer:  '#f5a623',
  weather: '#06b6d4',
  transit: '#3ecf8e',
  today:   '#f56565',
  todos:   '#a855f7',
  points:  '#f5a623',
  traffic: '#ef4444',
};

// Grid constants — tuned for 800×(480-42) = 800×438
const COLS = 12;
const ROW_H = 58;
const MARGIN: [number, number] = [6, 6];

// ─── Single widget tile ───────────────────────────────────────────────────────
function WidgetTile({
  id, editMode, onRemove, children
}: {
  id: WidgetId;
  editMode: boolean;
  onRemove: (id: WidgetId) => void;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  const dark = theme.palette.mode === 'dark';
  const def = WIDGET_REGISTRY.find(w => w.id === id)!;
  const accent = ACCENT[id];

  return (
    <Box sx={{
      height: '100%',
      background: theme.palette.background.paper,
      border: `1px solid ${dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
      borderTop: `2.5px solid ${accent}`,
      borderRadius: '12px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: dark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 10px rgba(0,0,0,0.06)',
      position: 'relative',
      // Edit mode: pulsing border
      ...(editMode && {
        border: `1.5px dashed ${accent}`,
        borderTop: `1.5px dashed ${accent}`,
        animation: 'editPulse 2s ease-in-out infinite',
      }),
    }}>
      {/* Header row with label (always shown) */}
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: '10px', pt: '6px', pb: '2px', flexShrink: 0,
      }}>
        <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
          {def.icon} {def.label}
        </Typography>
        {editMode && (
          <Tooltip title={`${def.label} entfernen`}>
            <IconButton size="small" onClick={() => onRemove(id)} sx={{ p: '2px', color: '#f56565', '&:hover': { background: 'rgba(245,101,101,0.15)' } }}>
              <CloseRoundedIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Widget content */}
      <Box sx={{ flex: 1, overflow: 'hidden', px: '10px', pb: '8px', minHeight: 0 }}>
        {children}
      </Box>

      {/* Edit mode drag handle indicator */}
      {editMode && (
        <Box sx={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: `${accent}08`,
          pointerEvents: 'none',
          borderRadius: '12px',
        }} />
      )}
    </Box>
  );
}

// ─── Widget Picker panel ──────────────────────────────────────────────────────
function WidgetPicker({ enabled, onToggle, onClose }: {
  enabled: WidgetId[];
  onToggle: (id: WidgetId) => void;
  onClose: () => void;
}) {
  const theme = useTheme();
  const dark = theme.palette.mode === 'dark';

  return (
    <Box sx={{
      position: 'absolute', top: 36, right: 0, zIndex: 100,
      background: theme.palette.background.paper,
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: '14px',
      p: 1.5,
      boxShadow: dark ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 32px rgba(0,0,0,0.15)',
      width: 220,
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 800 }}>Widgets hinzufügen</Typography>
        <IconButton size="small" onClick={onClose} sx={{ p: '3px' }}><CloseRoundedIcon sx={{ fontSize: 14 }} /></IconButton>
      </Box>
      {WIDGET_REGISTRY.map(def => {
        const active = enabled.includes(def.id);
        return (
          <Box key={def.id} onClick={() => onToggle(def.id)} sx={{
            display: 'flex', alignItems: 'center', gap: 1.2,
            px: 1, py: '7px', borderRadius: 2, mb: '3px',
            background: active ? `${ACCENT[def.id]}18` : 'transparent',
            border: active ? `1px solid ${ACCENT[def.id]}40` : `1px solid transparent`,
            cursor: 'pointer',
            '&:active': { opacity: 0.7 },
            transition: 'all 0.15s',
          }}>
            <Typography sx={{ fontSize: '1rem', lineHeight: 1 }}>{def.icon}</Typography>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: active ? ACCENT[def.id] : 'text.primary', lineHeight: 1.2 }}>{def.label}</Typography>
              <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary', lineHeight: 1.2 }}>{def.description}</Typography>
            </Box>
            <Box sx={{
              width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
              background: active ? ACCENT[def.id] : (dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Typography sx={{ fontSize: '0.65rem', color: active ? '#fff' : 'text.secondary', fontWeight: 800, lineHeight: 1 }}>
                {active ? '✓' : '+'}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

// ─── DashboardPage ────────────────────────────────────────────────────────────
export function DashboardPage() {
  const theme = useTheme();
  const dark = theme.palette.mode === 'dark';

  const [editMode, setEditMode] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [enabled, setEnabled] = useState<WidgetId[]>(() => loadEnabled());
  const [layout, setLayout] = useState<LayoutItem[]>(() => loadLayout());

  // Compute grid width (800px minus sidebar if any — full width)
  const gridWidth = 800;

  // Only show enabled widgets that have a layout entry
  const visibleLayout = useMemo((): RGLLayout[] => {
    return layout
      .filter(item => enabled.includes(item.i as WidgetId))
      .map(item => {
        const def = WIDGET_REGISTRY.find(w => w.id === item.i);
        return {
          i: item.i,
          x: item.x, y: item.y, w: item.w, h: item.h,
          minW: def?.minW || 2, minH: def?.minH || 2,
          maxW: def?.maxW, maxH: def?.maxH,
          isDraggable: editMode,
          isResizable: editMode,
        } as RGLLayout;
      });
  }, [layout, enabled, editMode]);

  const handleLayoutChange = useCallback((newLayout: RGLLayout[]) => {
    const updated: LayoutItem[] = newLayout.map(item => ({
      i: item.i as WidgetId,
      x: item.x, y: item.y, w: item.w, h: item.h,
    }));
    // Merge with non-visible widgets
    const invisible = layout.filter(l => !enabled.includes(l.i as WidgetId));
    const merged = [...updated, ...invisible];
    setLayout(merged);
    saveLayout(merged);
  }, [layout, enabled]);

  const toggleWidget = useCallback((id: WidgetId) => {
    setEnabled(prev => {
      const next = prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id];
      saveEnabled(next);
      // If adding, ensure layout entry exists
      if (!prev.includes(id)) {
        setLayout(current => {
          if (current.find(l => l.i === id)) return current;
          const def = WIDGET_REGISTRY.find(w => w.id === id)!;
          const newItem: LayoutItem = { i: id, x: 0, y: 999, w: def.defaultW, h: def.defaultH };
          const updated = [...current, newItem];
          saveLayout(updated);
          return updated;
        });
      }
      return next;
    });
  }, []);

  const removeWidget = useCallback((id: WidgetId) => {
    setEnabled(prev => {
      const next = prev.filter(e => e !== id);
      saveEnabled(next);
      return next;
    });
  }, []);

  const resetLayout = useCallback(() => {
    // Import defaults inline to avoid circular
    const defaults: LayoutItem[] = [
      { i: 'clock',   x: 3, y: 0, w: 6, h: 3 },
      { i: 'prayer',  x: 9, y: 0, w: 3, h: 7 },
      { i: 'weather', x: 0, y: 0, w: 3, h: 4 },
      { i: 'transit', x: 0, y: 4, w: 3, h: 3 },
      { i: 'today',   x: 3, y: 3, w: 3, h: 4 },
      { i: 'todos',   x: 6, y: 3, w: 3, h: 4 },
    ];
    const defaultEnabled: WidgetId[] = ['clock', 'prayer', 'weather', 'transit', 'today', 'todos'];
    setLayout(defaults);
    setEnabled(defaultEnabled);
    saveLayout(defaults);
    saveEnabled(defaultEnabled);
  }, []);

  return (
    <Box sx={{
      height: '100%',
      background: theme.palette.background.default,
      overflow: editMode ? 'auto' : 'hidden',
      position: 'relative',
    }}>
      {/* Edit toolbar */}
      <Box sx={{
        position: 'absolute', top: 6, right: 8, zIndex: 200,
        display: 'flex', gap: '4px', alignItems: 'center',
      }}>
        {editMode && (
          <>
            <Box
              onClick={() => setPickerOpen(p => !p)}
              sx={{
                display: 'flex', alignItems: 'center', gap: 0.6,
                px: 1.2, py: '5px', borderRadius: 2, cursor: 'pointer',
                background: 'rgba(91,141,238,0.2)', border: '1px solid rgba(91,141,238,0.4)',
                '&:active': { opacity: 0.7 },
              }}>
              <AddRoundedIcon sx={{ fontSize: 14, color: '#5b8dee' }} />
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#5b8dee' }}>Widget</Typography>
            </Box>
            <Box
              onClick={resetLayout}
              sx={{
                px: 1.2, py: '5px', borderRadius: 2, cursor: 'pointer',
                background: 'rgba(245,166,35,0.15)', border: '1px solid rgba(245,166,35,0.35)',
                '&:active': { opacity: 0.7 },
              }}>
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#f5a623' }}>Reset</Typography>
            </Box>
          </>
        )}
        <Box
          onClick={() => { setEditMode(e => !e); setPickerOpen(false); }}
          sx={{
            display: 'flex', alignItems: 'center', gap: 0.6,
            px: 1.2, py: '5px', borderRadius: 2, cursor: 'pointer',
            background: editMode ? 'rgba(62,207,142,0.2)' : (dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
            border: editMode ? '1px solid rgba(62,207,142,0.4)' : `1px solid ${theme.palette.divider}`,
            '&:active': { opacity: 0.7 },
          }}>
          {editMode
            ? <><LockRoundedIcon sx={{ fontSize: 14, color: '#3ecf8e' }} /><Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#3ecf8e' }}>Fertig</Typography></>
            : <><EditRoundedIcon sx={{ fontSize: 14, color: 'text.secondary' }} /><Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: 'text.secondary' }}>Anpassen</Typography></>}
        </Box>
      </Box>

      {/* Widget picker dropdown */}
      {pickerOpen && (
        <Box sx={{ position: 'absolute', top: 0, right: 0, zIndex: 300 }}>
          <WidgetPicker enabled={enabled} onToggle={toggleWidget} onClose={() => setPickerOpen(false)} />
        </Box>
      )}

      {/* Edit mode hint */}
      {editMode && (
        <Box sx={{
          position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)', zIndex: 100,
          background: 'rgba(91,141,238,0.15)', border: '1px solid rgba(91,141,238,0.35)',
          borderRadius: 2, px: 1.5, py: '4px',
        }}>
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#5b8dee' }}>
            ↔ Widgets ziehen & Ecken zum Skalieren
          </Typography>
        </Box>
      )}

      {/* Grid */}
      <GridLayout
        layout={visibleLayout as any}
        cols={COLS}
        rowHeight={ROW_H}
        width={gridWidth}
        margin={MARGIN}
        containerPadding={[6, 6]}
        onLayoutChange={handleLayoutChange as any}
        isDraggable={editMode}
        isResizable={editMode}
        draggableHandle=".widget-drag-handle"
        compactType="vertical"
        preventCollision={false}
        style={{ minHeight: '100%' }}
      >
        {visibleLayout.map(item => {
          const id = item.i as WidgetId;
          return (
            <div key={id} className={editMode ? 'widget-drag-handle' : ''}>
              <WidgetTile id={id} editMode={editMode} onRemove={removeWidget}>
                {WIDGET_CONTENT[id]}
              </WidgetTile>
            </div>
          );
        })}
      </GridLayout>

      {/* Empty state */}
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
        @keyframes editPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(91,141,238,0); }
          50% { box-shadow: 0 0 8px 2px rgba(91,141,238,0.25); }
        }
        .react-grid-item.react-grid-placeholder {
          background: rgba(91,141,238,0.15) !important;
          border: 2px dashed rgba(91,141,238,0.5) !important;
          border-radius: 12px !important;
        }
        .react-resizable-handle {
          background-image: none !important;
          width: 20px !important;
          height: 20px !important;
          background: rgba(91,141,238,0.5) !important;
          border-radius: 0 0 10px 0 !important;
          opacity: 0.8 !important;
        }
        .react-resizable-handle::after {
          content: '⤡' !important;
          font-size: 10px !important;
          color: white !important;
          position: absolute !important;
          bottom: 2px !important;
          right: 3px !important;
        }
      `}</style>
    </Box>
  );
}

