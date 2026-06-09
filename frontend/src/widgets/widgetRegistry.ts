// Zentrale Widget-Definitionen
// Jedes Widget hat: id, label, min/max Größe, Default-Layout-Position

export type WidgetId =
  | 'clock'
  | 'prayer'
  | 'weather'
  | 'transit'
  | 'today'
  | 'todos'
  | 'points'
  | 'traffic';

export interface WidgetDef {
  id: WidgetId;
  label: string;
  icon: string;
  description: string;
  minW: number;
  minH: number;
  maxW?: number;
  maxH?: number;
  defaultW: number;
  defaultH: number;
}

export const WIDGET_REGISTRY: WidgetDef[] = [
  { id: 'clock',   label: 'Uhr & Datum',       icon: '🕐', description: 'Uhrzeit, Datum, Hijri-Kalender', minW: 2, minH: 2, defaultW: 4, defaultH: 3 },
  { id: 'prayer',  label: 'Gebetszeiten',       icon: '🕌', description: 'Gebetszeiten Stuttgart mit Countdown', minW: 2, minH: 3, defaultW: 3, defaultH: 5 },
  { id: 'weather', label: 'Wetter',             icon: '⛅', description: 'Aktuelles Wetter + 5-Tage-Vorschau', minW: 2, minH: 2, defaultW: 3, defaultH: 4 },
  { id: 'transit', label: 'ÖPNV Abfahrten',     icon: '🚌', description: 'Nächste Busse/Bahnen Bernsteinstraße', minW: 2, minH: 2, defaultW: 3, defaultH: 3 },
  { id: 'today',   label: 'Heutige Termine',    icon: '📅', description: 'Termine und Ereignisse heute', minW: 2, minH: 2, defaultW: 3, defaultH: 3 },
  { id: 'todos',   label: 'Aufgaben',           icon: '✅', description: 'Offene Aufgaben mit Genehmigungsflow', minW: 2, minH: 2, defaultW: 3, defaultH: 3 },
  { id: 'points',  label: 'Punkte-Rangliste',   icon: '🏆', description: 'Kinder-Punkte und Rangliste', minW: 2, minH: 2, defaultW: 3, defaultH: 3 },
  { id: 'traffic', label: 'Verkehr zur Arbeit', icon: '🚗', description: 'Fahrtzeit Papa und Mama zur Arbeit', minW: 2, minH: 2, defaultW: 3, defaultH: 2 },
];

export interface LayoutItem {
  i: WidgetId;
  x: number;
  y: number;
  w: number;
  h: number;
}

// Grid: 12 Spalten, Zeilenhöhe ~60px bei 800x440 (ohne Topbar)
export const DEFAULT_LAYOUT: LayoutItem[] = [
  { i: 'clock',   x: 3, y: 0, w: 6, h: 3 },  // Mitte oben — groß
  { i: 'prayer',  x: 9, y: 0, w: 3, h: 7 },  // Rechts, volle Höhe
  { i: 'weather', x: 0, y: 0, w: 3, h: 4 },  // Links oben
  { i: 'transit', x: 0, y: 4, w: 3, h: 3 },  // Links unten
  { i: 'today',   x: 3, y: 3, w: 3, h: 4 },  // Mitte Mitte
  { i: 'todos',   x: 6, y: 3, w: 3, h: 4 },  // Mitte rechts
];

export const DEFAULT_ENABLED: WidgetId[] = ['clock', 'prayer', 'weather', 'transit', 'today', 'todos'];

const LAYOUT_KEY = 'fh_layout_v3';
const ENABLED_KEY = 'fh_enabled_v3';

export function loadLayout(): LayoutItem[] {
  try {
    const s = localStorage.getItem(LAYOUT_KEY);
    if (s) return JSON.parse(s);
  } catch {}
  return DEFAULT_LAYOUT;
}

export function saveLayout(layout: LayoutItem[]) {
  localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout));
}

export function loadEnabled(): WidgetId[] {
  try {
    const s = localStorage.getItem(ENABLED_KEY);
    if (s) return JSON.parse(s);
  } catch {}
  return DEFAULT_ENABLED;
}

export function saveEnabled(enabled: WidgetId[]) {
  localStorage.setItem(ENABLED_KEY, JSON.stringify(enabled));
}

