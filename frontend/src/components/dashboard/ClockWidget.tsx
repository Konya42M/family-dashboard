import { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export function ClockWidget() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <Box sx={{ textAlign: 'left' }}>
      <Typography
        sx={{
          fontSize: { xs: '3rem', sm: '4rem', md: '5rem' },
          fontWeight: 800,
          letterSpacing: '-2px',
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
          background: 'linear-gradient(135deg, #90caf9 0%, #42a5f5 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        {format(now, 'HH:mm')}
      </Typography>
      <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 500, mt: 0.5 }}>
        {format(now, 'ss', { locale: de })}s &nbsp;|&nbsp;
        {format(now, 'EEEE, d. MMMM yyyy', { locale: de })}
      </Typography>
    </Box>
  );
}
