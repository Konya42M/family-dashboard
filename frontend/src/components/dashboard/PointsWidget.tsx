import { useState, useEffect } from 'react';
import { Box, Typography, Stack, Avatar, LinearProgress } from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import api from '../../api/client';

interface Leaderboard { id: string; name: string; color: string; avatar?: string; total_points: number; }

export function PointsWidget() {
  const [leaders, setLeaders] = useState<Leaderboard[]>([]);

  useEffect(() => { api.get('/points/leaderboard').then(r => setLeaders(r.data)).catch(() => {}); }, []);

  const max = leaders[0]?.total_points || 1;

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
        <EmojiEventsIcon sx={{ color: '#ffd700' }} />
        <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>Punkte</Typography>
      </Stack>
      {leaders.length === 0
        ? <Typography variant="body2" color="text.secondary">Keine Kinder</Typography>
        : leaders.map((l, i) => (
          <Box key={l.id} sx={{ mb: 1.5 }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
              <Typography sx={{ fontSize: '1rem' }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</Typography>
              <Avatar sx={{ width: 24, height: 24, bgcolor: l.color, fontSize: '0.75rem' }}>
                {l.name[0]}
              </Avatar>
              <Typography variant="body2" fontWeight={600} sx={{ flex: 1 }}>{l.name}</Typography>
              <Typography variant="body2" fontWeight={700} sx={{ color: 'warning.main' }}>{l.total_points} P</Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={(l.total_points / max) * 100}
              sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(255,215,0,0.15)', '& .MuiLinearProgress-bar': { bgcolor: '#ffd700' } }}
            />
          </Box>
        ))
      }
    </Box>
  );
}
