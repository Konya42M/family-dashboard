import { useState, useEffect } from 'react';
import { Box, Typography, Stack, Chip, Avatar } from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import { de } from 'date-fns/locale';
import api from '../../api/client';
import { CalendarEvent } from '../../types';

const categoryIcons: Record<string, string> = {
  appointment: '🏥', school: '📚', work: '💼', birthday: '🎂', leisure: '🎉', general: '📅'
};

export function TodayWidget() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    const today = new Date();
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 2);
    api.get(`/calendar?start=${today.toISOString()}&end=${tomorrow.toISOString()}`)
      .then(r => setEvents(r.data)).catch(() => {});
  }, []);

  const todayEvents = events.filter(e => isToday(parseISO(e.start_time)));
  const tomorrowEvents = events.filter(e => isTomorrow(parseISO(e.start_time)));

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
        <EventIcon sx={{ color: 'primary.main' }} />
        <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>Termine</Typography>
      </Stack>
      {todayEvents.length === 0 && tomorrowEvents.length === 0 && (
        <Typography variant="body2" color="text.secondary">Keine Termine heute</Typography>
      )}
      {todayEvents.map(e => (
        <Stack key={e.id} direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
          <Typography sx={{ fontSize: '1.2rem' }}>{categoryIcons[e.category] || '📅'}</Typography>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" fontWeight={600}>{e.title}</Typography>
            <Typography variant="caption" color="text.secondary">
              {e.all_day ? 'Ganztägig' : format(parseISO(e.start_time), 'HH:mm')}
              {e.user_name && ` · ${e.user_name}`}
            </Typography>
          </Box>
          {e.user_color && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: e.user_color }} />}
        </Stack>
      ))}
      {tomorrowEvents.length > 0 && (
        <>
          <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, display: 'block', mt: 1.5, mb: 0.5 }}>Morgen</Typography>
          {tomorrowEvents.map(e => (
            <Stack key={e.id} direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75, opacity: 0.7 }}>
              <Typography sx={{ fontSize: '1.1rem' }}>{categoryIcons[e.category] || '📅'}</Typography>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2">{e.title}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {e.all_day ? 'Ganztägig' : format(parseISO(e.start_time), 'HH:mm')}
                </Typography>
              </Box>
            </Stack>
          ))}
        </>
      )}
    </Box>
  );
}
