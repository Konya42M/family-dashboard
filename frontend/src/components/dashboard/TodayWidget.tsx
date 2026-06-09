import { useState, useEffect } from 'react';
import { Box, Typography, Stack } from '@mui/material';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import { de } from 'date-fns/locale';
import api from '../../api/client';
import { CalendarEvent } from '../../types';

const CATEGORY_ICONS: Record<string, string> = {
  appointment: '🏥', school: '📚', work: '💼', birthday: '🎂', leisure: '🎉', general: '📅'
};

export function TodayWidget() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    const today = new Date();
    const dayAfter = new Date(today); dayAfter.setDate(today.getDate() + 2);
    api.get(`/calendar?start=${today.toISOString()}&end=${dayAfter.toISOString()}`)
      .then(r => setEvents(r.data)).catch(() => {});
  }, []);

  const todayEvents = events.filter(e => isToday(parseISO(e.start_time)));
  const tomorrowEvents = events.filter(e => isTomorrow(parseISO(e.start_time)));

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="caption" color="text.secondary" mb={1} display="block">Termine heute</Typography>

      {todayEvents.length === 0 && tomorrowEvents.length === 0 ? (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
          <Typography sx={{ fontSize: '1.8rem', opacity: 0.4 }}>✨</Typography>
          <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Freier Tag!</Typography>
        </Box>
      ) : (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5, overflow: 'hidden' }}>
          {todayEvents.map(e => (
            <Stack key={e.id} direction="row" alignItems="center" spacing={1} sx={{
              px: 1, py: 0.6, borderRadius: 2,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
              borderLeft: `3px solid ${e.color || e.user_color || '#4d90fe'}`,
            }}>
              <Typography sx={{ fontSize: '0.9rem' }}>{CATEGORY_ICONS[e.category] || '📅'}</Typography>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
                  {e.title}
                </Typography>
                <Typography sx={{ fontSize: '0.62rem', color: 'text.secondary', lineHeight: 1.2, mt: 0.1 }}>
                  {e.all_day ? 'Ganztägig' : format(parseISO(e.start_time), 'HH:mm')}
                  {e.user_name ? ` · ${e.user_name}` : ''}
                </Typography>
              </Box>
            </Stack>
          ))}

          {tomorrowEvents.length > 0 && (
            <>
              <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.08em', textTransform: 'uppercase', mt: 0.5, px: 0.5 }}>
                Morgen
              </Typography>
              {tomorrowEvents.slice(0, 2).map(e => (
                <Stack key={e.id} direction="row" alignItems="center" spacing={1} sx={{
                  px: 1, py: 0.5, borderRadius: 2,
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
                  borderLeft: `3px solid ${e.color || e.user_color || 'rgba(255,255,255,0.2)'}`,
                  opacity: 0.6,
                }}>
                  <Typography sx={{ fontSize: '0.85rem' }}>{CATEGORY_ICONS[e.category] || '📅'}</Typography>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
                      {e.title}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                    {e.all_day ? 'Ganz.' : format(parseISO(e.start_time), 'HH:mm')}
                  </Typography>
                </Stack>
              ))}
            </>
          )}
        </Box>
      )}
    </Box>
  );
}

