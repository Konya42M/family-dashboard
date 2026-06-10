import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Stack, Chip, CircularProgress } from '@mui/material';
import api from '../../api/client';

interface TrafficDest {
  id: string;
  name: string;
  icon: string;
  traffic: {
    durationMins: number;
    delayMins: number;
    status: 'green' | 'yellow' | 'red';
    summary: string;
  } | null;
  error?: string;
}

const STATUS_COLOR: Record<string, string> = {
  green: '#3ecf8e',
  yellow: '#f5a623',
  red: '#f56565',
};

const STATUS_LABEL: Record<string, string> = {
  green: 'Normal',
  yellow: 'Leichter Stau',
  red: 'Stau',
};

export function TrafficWidget({ compact = false }: { compact?: boolean }) {
  const [dests, setDests] = useState<TrafficDest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTraffic = useCallback(async () => {
    try {
      const res = await api.get('/traffic');
      setDests(Array.isArray(res.data) ? res.data : []);
    } catch {
      // silently fail – no API key or offline
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTraffic(); }, [fetchTraffic]);
  useEffect(() => {
    const id = setInterval(fetchTraffic, 5 * 60_000);
    return () => clearInterval(id);
  }, [fetchTraffic]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Typography sx={{
        fontWeight: 700, fontSize: compact ? '0.72rem' : '0.82rem',
        px: 1.5, pt: 1, pb: 0.5, flexShrink: 0,
      }}>
        🚗 Verkehr
      </Typography>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2 }}>
          <CircularProgress size={20} />
        </Box>
      )}

      <Stack direction="row" flexWrap="wrap" gap={1} sx={{ px: 1, pb: 1, flex: 1, overflowY: 'auto', alignContent: 'flex-start' }}>
        {dests.map(d => (
          <Box key={d.id} sx={{
            flex: '1 1 130px', minWidth: 110,
            border: '1px solid', borderColor: 'divider',
            borderRadius: 2, p: 1,
          }}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, mb: 0.5 }}>
              {d.icon} {d.name}
            </Typography>
            {d.traffic ? (
              <>
                <Typography sx={{
                  fontSize: '1.1rem', fontWeight: 800,
                  color: STATUS_COLOR[d.traffic.status],
                }}>
                  {d.traffic.durationMins} min
                </Typography>
                {d.traffic.delayMins > 0 && (
                  <Typography sx={{ fontSize: '0.65rem', color: '#f56565' }}>
                    +{d.traffic.delayMins} min Stau
                  </Typography>
                )}
                <Chip
                  label={STATUS_LABEL[d.traffic.status]}
                  size="small"
                  sx={{
                    fontSize: '0.6rem', height: 16, mt: 0.5,
                    bgcolor: STATUS_COLOR[d.traffic.status] + '33',
                    color: STATUS_COLOR[d.traffic.status],
                  }}
                />
              </>
            ) : (
              <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                {d.error ?? 'Nicht verfügbar'}
              </Typography>
            )}
          </Box>
        ))}
        {!loading && dests.length === 0 && (
          <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', p: 1 }}>
            Keine Ziele konfiguriert. Bitte in den Einstellungen hinzufügen.
          </Typography>
        )}
      </Stack>
    </Box>
  );
}
