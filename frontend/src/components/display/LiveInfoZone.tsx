import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import api from '../../api/client';

interface Departure {
  line: string;
  direction: string;
  scheduledTime: string;
  realTime?: string;
  delay?: number;
  delayMin?: number;
  minutesUntil?: number;
}

interface TrafficDest {
  id: string;
  name: string;
  icon: string;
  traffic: { durationMins: number; delayMins: number; status: 'green' | 'yellow' | 'red' } | null;
  error?: string;
}

function minutesUntil(t: string): number {
  if (!t || !t.includes(':')) return 99;
  const [h, m] = t.split(':').map(Number);
  const now = new Date();
  let diff = (h * 60 + m) - (now.getHours() * 60 + now.getMinutes());
  if (diff < -60) diff += 24 * 60;
  return diff;
}

const STATUS_COLOR: Record<string, string> = {
  green: '#3ecf8e', yellow: '#f5a623', red: '#f56565',
};

export function LiveInfoZone() {
  const theme = useTheme();
  const dark = theme.palette.mode === 'dark';
  const border = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const surface = dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)';
  const txtMain = dark ? '#eef0f7' : '#111827';

  const [deps, setDeps] = useState<Departure[]>([]);
  const [traffic, setTraffic] = useState<TrafficDest[]>([]);
  const [, setTick] = useState(0);

  const fetchAll = useCallback(() => {
    api.get('/transit/departures?type=rail')
      .then(r => setDeps(Array.isArray(r.data) ? r.data.slice(0, 4) : []))
      .catch(() => {});
    api.get('/traffic')
      .then(r => setTraffic(Array.isArray(r.data) ? r.data.slice(0, 4) : []))
      .catch(() => {});
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => {
    const id = setInterval(() => { fetchAll(); setTick(t => t + 1); }, 60_000);
    return () => clearInterval(id);
  }, [fetchAll]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── ÖPNV ──────────────────────────────────────────────────────── */}
      <Box sx={{ px: 1.5, pt: 1.2, pb: 1, flexShrink: 0, borderBottom: `1px solid ${border}` }}>
        <Typography sx={{
          fontSize: '0.58rem', fontWeight: 700, color: '#3ecf8e',
          letterSpacing: '0.1em', textTransform: 'uppercase', mb: 0.8,
        }}>
          🚊 Nächste Bahnen
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.55 }}>
          {deps.length === 0 && (
            <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary' }}>Keine Verbindung</Typography>
          )}
          {deps.map((d, i) => {
            const display = d.realTime ?? d.scheduledTime ?? '';
            const mins = d.minutesUntil !== undefined ? d.minutesUntil : minutesUntil(display);
            const delayed = (d.delayMin ?? d.delay ?? 0) > 0;
            const minsColor = mins <= 0 ? '#f56565' : mins <= 3 ? '#f5a623' : '#3ecf8e';

            return (
              <Box key={i} sx={{
                display: 'flex', alignItems: 'center', gap: 0.8,
                p: '5px 8px', borderRadius: '8px', background: surface,
              }}>
                {/* Linie */}
                <Box sx={{
                  minWidth: 30, height: 20, borderRadius: '5px',
                  background: '#1a56db',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Typography sx={{ fontSize: '0.58rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                    {d.line}
                  </Typography>
                </Box>
                {/* Richtung */}
                <Typography sx={{
                  fontSize: '0.68rem', fontWeight: 600, color: txtMain, flex: 1,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {d.direction}
                </Typography>
                {/* Countdown */}
                <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                  <Typography className="num" sx={{ fontSize: '0.85rem', fontWeight: 800, color: minsColor, lineHeight: 1 }}>
                    {mins <= 0 ? 'Jetzt' : `${mins}'`}
                  </Typography>
                  {delayed && (
                    <Typography sx={{ fontSize: '0.52rem', color: '#f56565', lineHeight: 1 }}>
                      +{d.delayMin ?? d.delay}
                    </Typography>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* ── Verkehr ───────────────────────────────────────────────────── */}
      <Box sx={{ px: 1.5, pt: 1, pb: 1, flex: 1, overflow: 'hidden' }}>
        <Typography sx={{
          fontSize: '0.58rem', fontWeight: 700, color: '#f56565',
          letterSpacing: '0.1em', textTransform: 'uppercase', mb: 0.8,
        }}>
          🚗 Verkehr
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.55 }}>
          {traffic.length === 0 && (
            <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary' }}>Keine Ziele</Typography>
          )}
          {traffic.map(d => (
            <Box key={d.id} sx={{
              display: 'flex', alignItems: 'center', gap: 0.8,
              p: '5px 8px', borderRadius: '8px', background: surface,
            }}>
              <Typography sx={{ fontSize: '0.9rem', lineHeight: 1, flexShrink: 0 }}>{d.icon}</Typography>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{
                  fontSize: '0.7rem', fontWeight: 700, color: txtMain,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {d.name}
                </Typography>
                {d.traffic && d.traffic.delayMins > 0 && (
                  <Typography sx={{ fontSize: '0.56rem', color: STATUS_COLOR[d.traffic.status] }}>
                    +{d.traffic.delayMins} min Stau
                  </Typography>
                )}
              </Box>
              <Typography className="num" sx={{
                fontSize: '0.9rem', fontWeight: 800, flexShrink: 0,
                color: d.traffic ? STATUS_COLOR[d.traffic.status] : 'text.secondary',
              }}>
                {d.traffic ? `${d.traffic.durationMins}'` : '–'}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
