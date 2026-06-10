import { useState, useEffect } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import api from '../../api/client';

interface CalEvent {
  id: string;
  title: string;
  start_time: string;
  all_day: boolean;
  category?: string;
  color?: string;
}

interface Todo {
  id: string;
  title: string;
  points: number;
  status: string;
  assigned_to: string;
}

interface User {
  id: string;
  name: string;
  color: string;
  role: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  birthday: '🎂', school: '🎒', medical: '🏥', mosque: '🕌',
  family: '👨‍👩‍👧', sport: '⚽', work: '💼', holiday: '🏖', other: '📌',
};

function timeLabel(start: string, allDay: boolean): string {
  if (allDay) return 'Ganztägig';
  try { return format(parseISO(start), 'HH:mm'); } catch { return ''; }
}

export function TimelineZone() {
  const theme = useTheme();
  const dark = theme.palette.mode === 'dark';
  const border = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const surface = dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)';
  const txtMain = dark ? '#eef0f7' : '#111827';

  const [events, setEvents] = useState<CalEvent[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');

    const load = () => {
      api.get(`/calendar?from=${today}&to=${today}`)
        .then(r => setEvents(Array.isArray(r.data) ? r.data : [])).catch(() => {});
      api.get('/todos')
        .then(r => {
          const all = Array.isArray(r.data) ? r.data : [];
          setTodos(all.filter((t: Todo) => t.status !== 'done').slice(0, 8));
        }).catch(() => {});
      api.get('/users')
        .then(r => setUsers(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    };

    load();
    const id = setInterval(load, 5 * 60_000);
    return () => clearInterval(id);
  }, []);

  const getUserInfo = (uid: string) => users.find(u => u.id === uid);

  const pendingTodos = todos.filter(t => t.status === 'pending_approval');
  const openTodos    = todos.filter(t => t.status !== 'pending_approval');

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: `1px solid ${border}` }}>

      {/* Header */}
      <Box sx={{ px: 2, pt: 1.2, pb: 0.8, flexShrink: 0, borderBottom: `1px solid ${border}` }}>
        <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#5b8dee', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          📅 {format(new Date(), "EEEE, d. MMMM", { locale: de })}
        </Typography>
      </Box>

      {/* Scroll-Inhalt */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 1.5, py: 1, display: 'flex', flexDirection: 'column', gap: 0.7 }}>

        {/* ─ Kalender-Events ────────────────────────────────────────── */}
        {events.length === 0 && todos.length === 0 && (
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <Typography sx={{ fontSize: '1.5rem', mb: 0.5 }}>🎉</Typography>
            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
              Keine Termine & Aufgaben
            </Typography>
          </Box>
        )}

        {events.map(ev => (
          <Box key={ev.id} sx={{
            display: 'flex', alignItems: 'flex-start', gap: 1,
            p: '8px 10px', borderRadius: '10px',
            background: surface,
            borderLeft: `3px solid ${ev.color || '#5b8dee'}`,
            border: `1px solid ${border}`,
            borderLeftWidth: 3,
          }}>
            <Typography sx={{ fontSize: '0.85rem', lineHeight: 1, mt: '1px', flexShrink: 0 }}>
              {CATEGORY_ICONS[ev.category ?? 'other'] ?? '📌'}
            </Typography>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{
                fontSize: '0.8rem', fontWeight: 700, color: txtMain, lineHeight: 1.25,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {ev.title}
              </Typography>
              <Typography sx={{ fontSize: '0.62rem', color: 'text.secondary', mt: '1px' }}>
                {timeLabel(ev.start_time, ev.all_day)}
              </Typography>
            </Box>
          </Box>
        ))}

        {/* ─ Divider ────────────────────────────────────────────────── */}
        {events.length > 0 && todos.length > 0 && (
          <Box sx={{ borderTop: `1px solid ${border}`, my: 0.3 }} />
        )}

        {/* ─ Warten auf Bestätigung ─────────────────────────────────── */}
        {pendingTodos.length > 0 && (
          <>
            <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color: '#f5a623', letterSpacing: '0.08em', textTransform: 'uppercase', px: 0.5 }}>
              ⏳ Warten auf OK
            </Typography>
            {pendingTodos.map(t => {
              const u = getUserInfo(t.assigned_to);
              return (
                <Box key={t.id} sx={{
                  display: 'flex', alignItems: 'center', gap: 1,
                  p: '7px 10px', borderRadius: '10px',
                  background: 'rgba(245,166,35,0.07)',
                  border: '1px solid rgba(245,166,35,0.22)',
                }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: u?.color ?? '#f5a623' }} />
                  <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: txtMain, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.title}
                  </Typography>
                  <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: '#f5a623' }}>
                    +{t.points}✦
                  </Typography>
                </Box>
              );
            })}
          </>
        )}

        {/* ─ Offene Aufgaben ────────────────────────────────────────── */}
        {openTodos.length > 0 && (
          <>
            <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.08em', textTransform: 'uppercase', px: 0.5, mt: pendingTodos.length > 0 ? 0.5 : 0 }}>
              ✅ Aufgaben
            </Typography>
            {openTodos.map(t => {
              const u = getUserInfo(t.assigned_to);
              return (
                <Box key={t.id} sx={{
                  display: 'flex', alignItems: 'center', gap: 1,
                  p: '7px 10px', borderRadius: '10px',
                  background: surface, border: `1px solid ${border}`,
                }}>
                  <Box sx={{
                    width: 14, height: 14, borderRadius: '4px', flexShrink: 0,
                    border: `2px solid ${u?.color ?? '#5b8dee'}`,
                  }} />
                  <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: txtMain, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.title}
                  </Typography>
                  {u && (
                    <Typography sx={{ fontSize: '0.62rem', color: u.color, fontWeight: 700, flexShrink: 0 }}>
                      {u.name}
                    </Typography>
                  )}
                </Box>
              );
            })}
          </>
        )}
      </Box>
    </Box>
  );
}
