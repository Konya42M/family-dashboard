import { useState, useEffect } from 'react';
import { Box, Typography, Stack, Chip } from '@mui/material';
import api from '../../api/client';
import { useInterval } from '../../hooks/useInterval';

interface Dep { line: string; direction: string; type: string; planned: string; realtime: string; delayMin: number; minutesUntil: number; platform?: string; }

const TYPE_COLOR: Record<string, string> = { tram: '#5b8dee', bus: '#f5a623', sbahn: '#3ecf8e', ubahn: '#a855f7', other: '#6b7280' };
const TYPE_LABEL: Record<string, string> = { tram: 'S', bus: 'B', sbahn: 'S', ubahn: 'U', other: '' };

function LineTag({ type, line }: { type: string; line: string }) {
  const col = TYPE_COLOR[type] || '#6b7280';
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 34, px: 0.7, py: '2px', borderRadius: 1.5, background: `${col}22`, border: `1.5px solid ${col}55` }}>
      <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: col, lineHeight: 1 }}>{line}</Typography>
    </Box>
  );
}

export function TransitWidget() {
  const [data, setData] = useState<{ stopName: string; departures: Dep[] } | null>(null);

  const load = () => api.get('/transit/departures').then(r => setData(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);
  useInterval(load, 60000);

  const deps = data?.departures?.slice(0, 6) || [];

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.8}>
        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.6rem', fontWeight: 700 }}>
          {data?.stopName || 'ÖPNV'}
        </Typography>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Box className="live-dot" sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: '#3ecf8e' }} />
          <Typography sx={{ fontSize: '0.58rem', color: '#3ecf8e', fontWeight: 700, letterSpacing: '0.06em' }}>LIVE</Typography>
        </Stack>
      </Stack>

      {deps.length === 0 ? (
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>Keine Abfahrten</Typography>
        </Box>
      ) : (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'hidden' }}>
          {deps.map((d, i) => (
            <Stack key={i} direction="row" alignItems="center" spacing={0.8} sx={{
              px: '8px', py: '5px', borderRadius: 2,
              background: 'rgba(128,128,128,0.06)',
              border: '1px solid rgba(128,128,128,0.1)',
            }}>
              <LineTag type={d.type} line={d.line} />
              <Typography sx={{ flex: 1, fontSize: '0.72rem', fontWeight: 500, color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {d.direction}
              </Typography>
              <Box sx={{ textAlign: 'right', minWidth: 44 }}>
                {d.minutesUntil <= 1 ? (
                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#f56565' }}>Jetzt</Typography>
                ) : (
                  <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: d.delayMin > 0 ? '#f5a623' : 'text.primary', letterSpacing: '-0.5px' }} className="num">
                    {d.minutesUntil}'
                  </Typography>
                )}
                {d.delayMin > 0 && (
                  <Typography sx={{ fontSize: '0.58rem', color: '#f5a623' }}>+{d.delayMin}m</Typography>
                )}
              </Box>
            </Stack>
          ))}
        </Box>
      )}
    </Box>
  );
}

