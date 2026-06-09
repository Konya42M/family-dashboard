import { useState, useEffect } from 'react';
import { Box, Typography, Stack } from '@mui/material';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const ISLAMIC_MONTHS = ['Muharram','Safer','Rebiülevvel','Rebiülâhir','Cemaziyelevvel','Cemaziyelâhir','Recep','Şaban','Ramazan','Şevval','Zilkade','Zilhicce'];

function getHijriDate(): string {
  try {
    const h = new Intl.DateTimeFormat('en-TN-u-ca-islamic', { day: 'numeric', month: 'numeric', year: 'numeric' }).formatToParts(new Date());
    const d = h.find(p => p.type === 'day')?.value || '';
    const m = h.find(p => p.type === 'month')?.value || '';
    const y = h.find(p => p.type === 'year')?.value || '';
    const monthName = ISLAMIC_MONTHS[(parseInt(m) - 1)] || '';
    return `${d}. ${monthName} ${y}`;
  } catch {
    return '';
  }
}

export function ClockWidget() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hours = format(now, 'HH');
  const minutes = format(now, 'mm');
  const seconds = format(now, 'ss');
  const hijri = getHijriDate();

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      {/* Time */}
      <Stack direction="row" alignItems="flex-end" spacing={0.5}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          <Typography sx={{
            fontSize: { xs: '3.8rem', sm: '4.8rem' },
            fontWeight: 900,
            letterSpacing: '-4px',
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
            fontFamily: '"Inter", sans-serif',
            background: 'linear-gradient(180deg, #ffffff 30%, rgba(255,255,255,0.6) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            {hours}
          </Typography>
          <Typography sx={{
            fontSize: { xs: '3rem', sm: '3.8rem' },
            fontWeight: 900,
            letterSpacing: '-4px',
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
            fontFamily: '"Inter", sans-serif',
            color: 'rgba(255,255,255,0.35)',
            mb: 0.3,
          }}>:</Typography>
          <Typography sx={{
            fontSize: { xs: '3.8rem', sm: '4.8rem' },
            fontWeight: 900,
            letterSpacing: '-4px',
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
            fontFamily: '"Inter", sans-serif',
            background: 'linear-gradient(180deg, #ffffff 30%, rgba(255,255,255,0.6) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            {minutes}
          </Typography>
        </Box>
        <Box sx={{ mb: { xs: 0.5, sm: 0.8 }, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography sx={{
            fontSize: { xs: '1.2rem', sm: '1.5rem' },
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
            fontFamily: '"JetBrains Mono", monospace',
            color: 'rgba(255,255,255,0.5)',
            lineHeight: 1,
          }}>
            {seconds}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.55rem', mt: 0.2 }}>
            SEK
          </Typography>
        </Box>
      </Stack>

      {/* Date */}
      <Typography sx={{
        fontSize: { xs: '0.8rem', sm: '0.9rem' },
        fontWeight: 500,
        color: 'rgba(255,255,255,0.55)',
        mt: 0.5,
        letterSpacing: '0.01em',
      }}>
        {format(now, 'EEEE, d. MMMM yyyy', { locale: de })}
      </Typography>

      {/* Hijri date */}
      {hijri && (
        <Typography sx={{
          fontSize: '0.7rem',
          color: 'rgba(255,196,0,0.6)',
          mt: 0.3,
          fontWeight: 500,
          letterSpacing: '0.02em',
        }}>
          {hijri}
        </Typography>
      )}
    </Box>
  );
}

