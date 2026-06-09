import { useState, useEffect } from 'react';
import { Box, Typography, Stack, useTheme } from '@mui/material';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const HIJRI = ['Muharrem','Safer','Rebiülevvel','Rebiülâhir','Cemaziyelevvel','Cemaziyelâhir','Recep','Şaban','Ramazan','Şevval','Zilkade','Zilhicce'];

function hijriDate() {
  try {
    const p = new Intl.DateTimeFormat('en-TN-u-ca-islamic-umalqura', { day:'numeric', month:'numeric', year:'numeric' }).formatToParts(new Date());
    const d = p.find(x=>x.type==='day')?.value || '';
    const m = parseInt(p.find(x=>x.type==='month')?.value || '1');
    const y = p.find(x=>x.type==='year')?.value || '';
    return `${d}. ${HIJRI[m-1]} ${y} H.`;
  } catch { return ''; }
}

export function ClockWidget() {
  const [now, setNow] = useState(new Date());
  const theme = useTheme();
  const dark = theme.palette.mode === 'dark';
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id); }, []);

  const hh = format(now, 'HH');
  const mm = format(now, 'mm');
  const ss = format(now, 'ss');
  const colon = now.getSeconds() % 2 === 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', gap: '4px' }}>
      {/* Big time display */}
      <Stack direction="row" alignItems="flex-end" spacing={0}>
        <Typography sx={{ fontSize: 'clamp(3rem, 8vw, 4.5rem)', fontWeight: 900, letterSpacing: '-4px', lineHeight: 1, color: 'text.primary', fontVariantNumeric: 'tabular-nums' }}>
          {hh}
        </Typography>
        <Typography sx={{ fontSize: 'clamp(2.5rem, 7vw, 3.8rem)', fontWeight: 900, lineHeight: 1, color: colon ? 'primary.main' : 'divider', transition: 'color 0.1s', mx: '1px', mb: '3px' }}>
          :
        </Typography>
        <Typography sx={{ fontSize: 'clamp(3rem, 8vw, 4.5rem)', fontWeight: 900, letterSpacing: '-4px', lineHeight: 1, color: 'text.primary', fontVariantNumeric: 'tabular-nums' }}>
          {mm}
        </Typography>
        <Box sx={{ mb: '6px', ml: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography sx={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1, color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>{ss}</Typography>
          <Typography sx={{ fontSize: '0.5rem', fontWeight: 700, color: 'text.secondary', opacity: 0.6 }}>SEK</Typography>
        </Box>
      </Stack>

      {/* Date */}
      <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: 'text.secondary', letterSpacing: '0.01em' }}>
        {format(now, 'EEEE, d. MMMM yyyy', { locale: de })}
      </Typography>

      {/* Hijri */}
      <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: '#f5a623', opacity: 0.8 }}>
        {hijriDate()}
      </Typography>
    </Box>
  );
}

