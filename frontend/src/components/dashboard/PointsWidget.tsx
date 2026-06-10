import { useState, useEffect } from 'react';
import { Box, Typography, Stack, Avatar, LinearProgress } from '@mui/material';
import api from '../../api/client';

interface Leaderboard { id: string; name: string; color: string; avatar?: string; total_points: number; }

const MEDALS = ['🥇', '🥈', '🥉'];

export function PointsWidget() {
  const [leaders, setLeaders] = useState<Leaderboard[]>([]);
  const [rate, setRate] = useState<number>(0.1);

  useEffect(() => { api.get('/points/leaderboard').then(r => setLeaders(r.data)).catch(() => {}); }, []);

  useEffect(() => {
    api.get('/settings').then(r => {
      const r2euro = r.data?.points_to_euro_rate;
      if (typeof r2euro === 'number' && r2euro > 0) setRate(r2euro);
    }).catch(() => {});
  }, []);

  const max = Math.max(...leaders.map(l => l.total_points), 1);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
        <Typography variant="caption" color="text.secondary">Punkte-Rangliste</Typography>
        <Typography sx={{ fontSize: '0.62rem', color: 'rgba(255,196,0,0.7)', fontWeight: 600, letterSpacing: '0.05em' }}>⭐ STARS</Typography>
      </Stack>

      {leaders.length === 0 ? (
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Keine Kinder</Typography>
        </Box>
      ) : (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {leaders.map((l, i) => (
            <Box key={l.id}>
              <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                <Typography sx={{ fontSize: '1rem', lineHeight: 1, minWidth: 20 }}>{MEDALS[i] || '🏅'}</Typography>
                <Avatar sx={{ width: 22, height: 22, bgcolor: l.color, fontSize: '0.65rem', fontWeight: 700 }}>
                  {l.name[0]}
                </Avatar>
                <Typography sx={{ flex: 1, fontSize: '0.8rem', fontWeight: 600, lineHeight: 1 }}>{l.name}</Typography>
                <Box sx={{
                  px: 1, py: 0.3, borderRadius: 1.5,
                  background: 'rgba(255,196,0,0.12)', border: '1px solid rgba(255,196,0,0.25)',
                }}>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: '#ffd740', fontVariantNumeric: 'tabular-nums', fontFamily: '"JetBrains Mono", monospace', lineHeight: 1 }}>
                    {l.total_points}
                  </Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                    = {(l.total_points * rate).toFixed(2)} €
                  </Typography>
                </Box>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={(l.total_points / max) * 100}
                sx={{
                  height: 4, borderRadius: 2, ml: '52px',
                  bgcolor: 'rgba(255,196,0,0.08)',
                  '& .MuiLinearProgress-bar': {
                    background: i === 0
                      ? 'linear-gradient(90deg, #ffd740, #ffab00)'
                      : i === 1 ? 'linear-gradient(90deg, #b0bec5, #78909c)'
                      : 'linear-gradient(90deg, #cd7f32, #a1672a)',
                    borderRadius: 2,
                  },
                }}
              />
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
