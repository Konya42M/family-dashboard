import { useState, useEffect, useCallback } from 'react';
import { Box, Button, Stack, Typography, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, IconButton, Chip, ToggleButton, ToggleButtonGroup, useTheme, Avatar } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import TodayRoundedIcon from '@mui/icons-material/TodayRounded';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isToday, getDay, parseISO, addWeeks, subWeeks, startOfWeek, endOfWeek } from 'date-fns';
import { de } from 'date-fns/locale';
import api from '../api/client';
import { CalendarEvent, User } from '../types';
import { useAuth } from '../contexts/AuthContext';

const CATEGORIES = [
  { value: 'general', label: 'Allgemein', color: '#5b8dee' },
  { value: 'school', label: 'Schule', color: '#3ecf8e' },
  { value: 'work', label: 'Arbeit', color: '#f5a623' },
  { value: 'appointment', label: 'Termin', color: '#f56565' },
  { value: 'birthday', label: 'Geburtstag', color: '#a855f7' },
  { value: 'leisure', label: 'Freizeit', color: '#06b6d4' },
];

function getColor(event: CalendarEvent, users: User[]): string {
  if (event.user_id) {
    const u = users.find(u => u.id === event.user_id);
    if (u) return u.color;
  }
  return CATEGORIES.find(c => c.value === event.category)?.color || '#5b8dee';
}

// ─── Month View ────────────────────────────────────────────────────────────────
function MonthView({ date, events, users, onDayClick, theme }: { date: Date; events: CalendarEvent[]; users: User[]; onDayClick: (d: Date) => void; theme: any }) {
  const dark = theme.palette.mode === 'dark';
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Weekday headers */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', mb: '2px' }}>
        {weekDays.map(d => (
          <Box key={d} sx={{ textAlign: 'center', py: '4px' }}>
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.05em' }}>{d}</Typography>
          </Box>
        ))}
      </Box>

      {/* Days grid */}
      <Box sx={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridTemplateRows: `repeat(${days.length / 7}, 1fr)`, gap: '3px' }}>
        {days.map(day => {
          const dayEvents = events.filter(e => isSameDay(parseISO(e.start_time), day));
          const isCurrentMonth = isSameMonth(day, date);
          const isCurrentDay = isToday(day);

          return (
            <Box key={day.toISOString()} onClick={() => onDayClick(day)} sx={{
              borderRadius: '8px',
              p: '4px 5px',
              background: isCurrentDay
                ? 'rgba(91,141,238,0.15)'
                : dark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.02)',
              border: isCurrentDay ? '1.5px solid rgba(91,141,238,0.4)' : `1px solid ${theme.palette.divider}`,
              opacity: isCurrentMonth ? 1 : 0.3,
              cursor: 'pointer',
              overflow: 'hidden',
              transition: 'all 0.15s',
              '&:hover': { background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' },
            }}>
              <Typography sx={{ fontSize: '0.7rem', fontWeight: isCurrentDay ? 800 : 600, color: isCurrentDay ? 'primary.main' : 'text.primary', lineHeight: 1.2, mb: '2px' }}>
                {format(day, 'd')}
              </Typography>
              <Stack spacing={0.3}>
                {dayEvents.slice(0, 2).map(e => {
                  const col = getColor(e, users);
                  return (
                    <Box key={e.id} sx={{ px: '4px', py: '1px', borderRadius: '4px', background: `${col}30`, border: `1px solid ${col}50`, overflow: 'hidden' }}>
                      <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color: col, lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {e.title}
                      </Typography>
                    </Box>
                  );
                })}
                {dayEvents.length > 2 && (
                  <Typography sx={{ fontSize: '0.55rem', color: 'text.secondary', fontWeight: 600 }}>+{dayEvents.length - 2}</Typography>
                )}
              </Stack>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

// ─── Person-Column View (Week) ─────────────────────────────────────────────────
function PersonView({ date, events, users, theme }: { date: Date; events: CalendarEvent[]; users: User[]; theme: any }) {
  const dark = theme.palette.mode === 'dark';
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const cols = users.length > 0 ? users : [{ id: '', name: 'Alle', color: '#5b8dee' } as User];

  return (
    <Box sx={{ flex: 1, overflow: 'auto' }}>
      {/* Column headers */}
      <Box sx={{ display: 'grid', gridTemplateColumns: `80px repeat(${cols.length}, 1fr)`, gap: '4px', mb: '4px', position: 'sticky', top: 0, zIndex: 2, background: theme.palette.background.default, pb: '4px' }}>
        <Box />
        {cols.map(u => (
          <Box key={u.id || 'all'} sx={{ textAlign: 'center', py: '6px', borderRadius: '8px', background: `${u.color}18`, border: `1px solid ${u.color}35` }}>
            <Avatar sx={{ width: 24, height: 24, bgcolor: u.color, fontSize: '0.65rem', fontWeight: 800, mx: 'auto', mb: '2px' }}>{u.name[0]}</Avatar>
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: u.color }}>{u.name}</Typography>
          </Box>
        ))}
      </Box>

      {/* Rows: one per day */}
      <Stack spacing="4px">
        {weekDays.map(day => {
          const isCurrentDay = isToday(day);
          return (
            <Box key={day.toISOString()} sx={{
              display: 'grid',
              gridTemplateColumns: `80px repeat(${cols.length}, 1fr)`,
              gap: '4px',
              minHeight: 44,
              background: isCurrentDay ? 'rgba(91,141,238,0.05)' : 'transparent',
              borderRadius: '8px',
              border: isCurrentDay ? '1px solid rgba(91,141,238,0.2)' : `1px solid transparent`,
              p: '4px',
            }}>
              {/* Day label */}
              <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: isCurrentDay ? 'primary.main' : 'text.secondary' }}>
                  {format(day, 'EEE', { locale: de })}
                </Typography>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: isCurrentDay ? 'primary.main' : 'text.primary' }}>
                  {format(day, 'd')}
                </Typography>
              </Box>

              {/* Events per person */}
              {cols.map(u => {
                const dayEvents = events.filter(e => {
                  const sameDay = isSameDay(parseISO(e.start_time), day);
                  const matchUser = u.id === '' ? true : e.user_id === u.id || !e.user_id;
                  return sameDay && matchUser;
                });
                return (
                  <Box key={u.id || 'all'} sx={{ display: 'flex', flexDirection: 'column', gap: '3px', justifyContent: 'center' }}>
                    {dayEvents.map(e => {
                      const col = getColor(e, users);
                      return (
                        <Box key={e.id} sx={{ px: '6px', py: '3px', borderRadius: '6px', background: `${col}22`, border: `1px solid ${col}44` }}>
                          <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: col, lineHeight: 1.2 }}>
                            {e.all_day ? '' : format(parseISO(e.start_time), 'HH:mm') + ' '}
                            {e.title}
                          </Typography>
                        </Box>
                      );
                    })}
                    {dayEvents.length === 0 && (
                      <Box sx={{ height: 24, borderRadius: '6px', border: `1px dashed ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }} />
                    )}
                  </Box>
                );
              })}
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}

// ─── CalendarPage ──────────────────────────────────────────────────────────────
export function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [view, setView] = useState<'month' | 'person'>('month');
  const [date, setDate] = useState(new Date());
  const [open, setOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<Partial<CalendarEvent>>({});
  const { isParent } = useAuth();
  const theme = useTheme();

  const loadEvents = useCallback(() => {
    const start = new Date(date.getFullYear(), date.getMonth() - 1, 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 2, 0);
    api.get(`/calendar?start=${start.toISOString()}&end=${end.toISOString()}`).then(r => setEvents(r.data)).catch(() => {});
  }, [date]);

  useEffect(() => {
    loadEvents();
    api.get('/users').then(r => setUsers(r.data)).catch(() => {});
  }, [loadEvents]);

  const nav = (dir: 'prev' | 'next') => {
    if (view === 'month') setDate(d => dir === 'prev' ? subMonths(d, 1) : addMonths(d, 1));
    else setDate(d => dir === 'prev' ? subWeeks(d, 1) : addWeeks(d, 1));
  };

  const openNew = (startDate?: Date) => {
    const dt = startDate || new Date();
    setEditEvent({ category: 'general', start_time: dt.toISOString(), end_time: dt.toISOString() });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!editEvent.title || !editEvent.start_time || !editEvent.end_time) return;
    if (editEvent.id) await api.put(`/calendar/${editEvent.id}`, editEvent);
    else              await api.post('/calendar', editEvent);
    setOpen(false);
    loadEvents();
  };

  const title = view === 'month'
    ? format(date, 'MMMM yyyy', { locale: de })
    : `${format(startOfWeek(date, { weekStartsOn: 1 }), 'd. MMM', { locale: de })} – ${format(endOfWeek(date, { weekStartsOn: 1 }), 'd. MMM yyyy', { locale: de })}`;

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2 }, height: '100%', display: 'flex', flexDirection: 'column', background: theme.palette.background.default }}>
      {/* Toolbar */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5} flexWrap="wrap" gap={1}>
        <Stack direction="row" alignItems="center" spacing={0.8}>
          <IconButton size="small" onClick={() => nav('prev')}><ChevronLeftRoundedIcon /></IconButton>
          <Typography variant="h6" fontWeight={700} sx={{ minWidth: 180, textAlign: 'center' }}>{title}</Typography>
          <IconButton size="small" onClick={() => nav('next')}><ChevronRightRoundedIcon /></IconButton>
          <Button size="small" startIcon={<TodayRoundedIcon sx={{ fontSize: 16 }} />} onClick={() => setDate(new Date())} sx={{ minHeight: 32, fontSize: '0.72rem' }}>Heute</Button>
        </Stack>

        <Stack direction="row" spacing={1}>
          <ToggleButtonGroup value={view} exclusive onChange={(_, v) => v && setView(v)} size="small">
            <ToggleButton value="month" sx={{ fontSize: '0.7rem', fontWeight: 700, px: 1.5, py: 0.5, fontFamily: 'inherit' }}>Monat</ToggleButton>
            <ToggleButton value="person" sx={{ fontSize: '0.7rem', fontWeight: 700, px: 1.5, py: 0.5, fontFamily: 'inherit' }}>Personen</ToggleButton>
          </ToggleButtonGroup>
          {isParent && (
            <Button variant="contained" size="small" startIcon={<AddRoundedIcon />} onClick={() => openNew()} sx={{ fontSize: '0.72rem' }}>Neu</Button>
          )}
        </Stack>
      </Stack>

      {view === 'month'
        ? <MonthView date={date} events={events} users={users} onDayClick={d => isParent && openNew(d)} theme={theme} />
        : <PersonView date={date} events={events} users={users} theme={theme} />}

      {/* Edit Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>{editEvent.id ? 'Termin bearbeiten' : 'Neuer Termin'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} mt={1}>
            <TextField label="Titel" value={editEvent.title || ''} onChange={e => setEditEvent(p => ({ ...p, title: e.target.value }))} fullWidth required autoFocus />
            <TextField label="Beschreibung" value={editEvent.description || ''} onChange={e => setEditEvent(p => ({ ...p, description: e.target.value }))} fullWidth multiline rows={2} />
            <Stack direction="row" spacing={2}>
              <TextField label="Start" type="datetime-local" value={editEvent.start_time?.slice(0, 16) || ''} onChange={e => setEditEvent(p => ({ ...p, start_time: new Date(e.target.value).toISOString() }))} fullWidth InputLabelProps={{ shrink: true }} />
              <TextField label="Ende" type="datetime-local" value={editEvent.end_time?.slice(0, 16) || ''} onChange={e => setEditEvent(p => ({ ...p, end_time: new Date(e.target.value).toISOString() }))} fullWidth InputLabelProps={{ shrink: true }} />
            </Stack>
            <Stack direction="row" spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Kategorie</InputLabel>
                <Select value={editEvent.category || 'general'} onChange={e => setEditEvent(p => ({ ...p, category: e.target.value }))}>
                  {CATEGORIES.map(c => <MenuItem key={c.value} value={c.value}><Stack direction="row" spacing={1} alignItems="center"><Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: c.color }} /><span>{c.label}</span></Stack></MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Person</InputLabel>
                <Select value={editEvent.user_id || ''} onChange={e => setEditEvent(p => ({ ...p, user_id: e.target.value }))}>
                  <MenuItem value="">Alle</MenuItem>
                  {users.map(u => <MenuItem key={u.id} value={u.id}><Stack direction="row" spacing={1} alignItems="center"><Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: u.color }} /><span>{u.name}</span></Stack></MenuItem>)}
                </Select>
              </FormControl>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          {editEvent.id && <Button color="error" onClick={async () => { await api.delete(`/calendar/${editEvent.id}`); setOpen(false); loadEvents(); }}>Löschen</Button>}
          <Box sx={{ flex: 1 }} />
          <Button onClick={() => setOpen(false)}>Abbrechen</Button>
          <Button variant="contained" onClick={handleSave}>Speichern</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

