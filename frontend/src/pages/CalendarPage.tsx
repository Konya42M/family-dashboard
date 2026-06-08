import { useState, useEffect, useCallback } from 'react';
import { Box, Button, Stack, Typography, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, ToggleButton, ToggleButtonGroup, IconButton, Chip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from 'date-fns';
import { de } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import api from '../api/client';
import { CalendarEvent, User } from '../types';
import { useAuth } from '../contexts/AuthContext';

const localizer = dateFnsLocalizer({ format, parse, startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }), getDay, locales: { de } });

const categoryOptions = [
  { value: 'general', label: 'Allgemein', color: '#1976d2' },
  { value: 'school', label: 'Schule', color: '#388e3c' },
  { value: 'work', label: 'Arbeit', color: '#f57c00' },
  { value: 'appointment', label: 'Arzttermin', color: '#d32f2f' },
  { value: 'birthday', label: 'Geburtstag', color: '#7b1fa2' },
  { value: 'leisure', label: 'Freizeit', color: '#0288d1' },
];

export function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [open, setOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<Partial<CalendarEvent>>({});
  const { isParent } = useAuth();

  const fetchEvents = useCallback(() => {
    const start = new Date(date.getFullYear(), date.getMonth() - 1, 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 2, 0);
    api.get(`/calendar?start=${start.toISOString()}&end=${end.toISOString()}`).then(r => setEvents(r.data)).catch(() => {});
  }, [date]);

  useEffect(() => { fetchEvents(); api.get('/users').then(r => setUsers(r.data)).catch(() => {}); }, [fetchEvents]);

  const rbc_events = events.map(e => ({
    ...e,
    start: new Date(e.start_time),
    end: new Date(e.end_time),
    allDay: Boolean(e.all_day),
    resource: e,
  }));

  const handleSave = async () => {
    if (!editEvent.title || !editEvent.start_time || !editEvent.end_time) return;
    if (editEvent.id) {
      await api.put(`/calendar/${editEvent.id}`, editEvent);
    } else {
      await api.post('/calendar', editEvent);
    }
    setOpen(false);
    setEditEvent({});
    fetchEvents();
  };

  const handleDelete = async () => {
    if (editEvent.id) { await api.delete(`/calendar/${editEvent.id}`); }
    setOpen(false);
    setEditEvent({});
    fetchEvents();
  };

  const navigate = (dir: 'prev' | 'next') => {
    setDate(d => {
      if (view === 'month') return dir === 'prev' ? subMonths(d, 1) : addMonths(d, 1);
      if (view === 'week') return dir === 'prev' ? subWeeks(d, 1) : addWeeks(d, 1);
      return dir === 'prev' ? subDays(d, 1) : addDays(d, 1);
    });
  };

  return (
    <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2} flexWrap="wrap" gap={1}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton onClick={() => navigate('prev')}><ChevronLeftIcon /></IconButton>
          <Typography variant="h6" fontWeight={700} minWidth={160} textAlign="center">
            {format(date, view === 'day' ? 'EEEE, d. MMM' : view === 'week' ? 'MMMM yyyy' : 'MMMM yyyy', { locale: de })}
          </Typography>
          <IconButton onClick={() => navigate('next')}><ChevronRightIcon /></IconButton>
          <Button variant="outlined" size="small" onClick={() => setDate(new Date())}>Heute</Button>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <ToggleButtonGroup value={view} exclusive onChange={(_, v) => v && setView(v)} size="small">
            <ToggleButton value="month">Monat</ToggleButton>
            <ToggleButton value="week">Woche</ToggleButton>
            <ToggleButton value="day">Tag</ToggleButton>
          </ToggleButtonGroup>
          {isParent && (
            <Button variant="contained" startIcon={<AddIcon />} size="small" onClick={() => { setEditEvent({ category: 'general', start_time: new Date().toISOString(), end_time: new Date().toISOString() }); setOpen(true); }}>
              Neu
            </Button>
          )}
        </Stack>
      </Stack>

      <Box sx={{ flex: 1, '& .rbc-calendar': { background: 'transparent', color: 'inherit' }, '& .rbc-header': { borderColor: 'rgba(255,255,255,0.1)', color: 'text.secondary', py: 1 }, '& .rbc-day-bg': { borderColor: 'rgba(255,255,255,0.05)' }, '& .rbc-off-range-bg': { bgcolor: 'rgba(0,0,0,0.2)' }, '& .rbc-today': { bgcolor: 'rgba(21,101,192,0.15)' }, '& .rbc-event': { borderRadius: 8, border: 'none', padding: '2px 6px' }, '& .rbc-month-row': { borderColor: 'rgba(255,255,255,0.05)' } }}>
        <Calendar
          localizer={localizer}
          events={rbc_events}
          view={view}
          date={date}
          onNavigate={setDate}
          onView={setView}
          culture="de"
          style={{ height: '100%' }}
          eventPropGetter={(event: any) => ({
            style: { backgroundColor: event.resource?.user_color || event.resource?.color || '#1565c0', opacity: 0.9 }
          })}
          onSelectEvent={(event: any) => {
            if (isParent) { setEditEvent(event.resource); setOpen(true); }
          }}
          onSelectSlot={(slot: any) => {
            if (isParent) {
              setEditEvent({ category: 'general', start_time: slot.start.toISOString(), end_time: slot.end.toISOString() });
              setOpen(true);
            }
          }}
          selectable={isParent}
          messages={{ today: 'Heute', previous: 'Zurück', next: 'Weiter', month: 'Monat', week: 'Woche', day: 'Tag', noEventsInRange: 'Keine Termine', allDay: 'Ganztägig' }}
        />
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4, background: '#131929' } }}>
        <DialogTitle>{editEvent.id ? 'Termin bearbeiten' : 'Neuer Termin'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} mt={1}>
            <TextField label="Titel" value={editEvent.title || ''} onChange={e => setEditEvent(p => ({ ...p, title: e.target.value }))} fullWidth required />
            <TextField label="Beschreibung" value={editEvent.description || ''} onChange={e => setEditEvent(p => ({ ...p, description: e.target.value }))} fullWidth multiline rows={2} />
            <Stack direction="row" spacing={2}>
              <TextField label="Start" type="datetime-local" value={editEvent.start_time?.slice(0, 16) || ''} onChange={e => setEditEvent(p => ({ ...p, start_time: new Date(e.target.value).toISOString() }))} fullWidth InputLabelProps={{ shrink: true }} />
              <TextField label="Ende" type="datetime-local" value={editEvent.end_time?.slice(0, 16) || ''} onChange={e => setEditEvent(p => ({ ...p, end_time: new Date(e.target.value).toISOString() }))} fullWidth InputLabelProps={{ shrink: true }} />
            </Stack>
            <FormControl fullWidth>
              <InputLabel>Kategorie</InputLabel>
              <Select value={editEvent.category || 'general'} onChange={e => setEditEvent(p => ({ ...p, category: e.target.value }))}>
                {categoryOptions.map(c => <MenuItem key={c.value} value={c.value}><Stack direction="row" spacing={1} alignItems="center"><Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: c.color }} /><span>{c.label}</span></Stack></MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Person</InputLabel>
              <Select value={editEvent.user_id || ''} onChange={e => setEditEvent(p => ({ ...p, user_id: e.target.value }))}>
                <MenuItem value="">Alle</MenuItem>
                {users.map(u => <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          {editEvent.id && <Button color="error" onClick={handleDelete}>Löschen</Button>}
          <Box sx={{ flex: 1 }} />
          <Button onClick={() => setOpen(false)}>Abbrechen</Button>
          <Button variant="contained" onClick={handleSave}>Speichern</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
