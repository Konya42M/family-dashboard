import { useState, useEffect } from 'react';
import { Box, Typography, Stack, Card, CardContent, Avatar, LinearProgress, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, Chip, Grid, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import api from '../api/client';
import { User, Reward } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface Leaderboard { id: string; name: string; color: string; avatar?: string; total_points: number; }

export function PointsPage() {
  const [leaders, setLeaders] = useState<Leaderboard[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [awardOpen, setAwardOpen] = useState(false);
  const [rewardOpen, setRewardOpen] = useState(false);
  const [awardForm, setAwardForm] = useState({ user_id: '', points: 10, reason: '' });
  const [rewardForm, setRewardForm] = useState({ title: '', description: '', points_required: 100, icon: 'star' });
  const { isParent, user } = useAuth();

  const fetch = () => {
    api.get('/points/leaderboard').then(r => setLeaders(r.data)).catch(() => {});
    api.get('/points/rewards').then(r => setRewards(r.data)).catch(() => {});
  };
  useEffect(() => { fetch(); api.get('/users').then(r => setUsers(r.data)).catch(() => {}); }, []);

  const children = users.filter(u => u.role === 'child');
  const max = leaders[0]?.total_points || 1;

  const handleAward = async () => {
    if (!awardForm.user_id || !awardForm.reason) return;
    await api.post('/points/award', awardForm);
    setAwardOpen(false);
    setAwardForm({ user_id: '', points: 10, reason: '' });
    fetch();
  };

  const handleAddReward = async () => {
    if (!rewardForm.title) return;
    await api.post('/points/rewards', rewardForm);
    setRewardOpen(false);
    fetch();
  };

  const handleRedeem = async (rewardId: string) => {
    try {
      await api.post(`/points/redeem/${rewardId}`);
      alert('Belohnung eingelöst! 🎉');
      fetch();
    } catch (e: any) {
      alert(e.response?.data?.error || 'Fehler');
    }
  };

  const myPoints = leaders.find(l => l.id === user?.id)?.total_points || 0;

  return (
    <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>Punkte & Belohnungen</Typography>
        {isParent && (
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<AddIcon />} size="small" onClick={() => setRewardOpen(true)}>Belohnung</Button>
            <Button variant="contained" startIcon={<AddIcon />} size="small" onClick={() => setAwardOpen(true)}>Punkte vergeben</Button>
          </Stack>
        )}
      </Stack>

      {!isParent && (
        <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #1565c0, #7b1fa2)', border: 'none' }}>
          <CardContent>
            <Typography variant="h3" fontWeight={800} sx={{ color: 'white' }}>{myPoints} 🏆</Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>Meine Punkte</Typography>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" fontWeight={700} mb={2} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmojiEventsIcon sx={{ color: '#ffd700' }} /> Rangliste
          </Typography>
          <Stack spacing={2}>
            {leaders.map((l, i) => (
              <Card key={l.id} sx={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Typography sx={{ fontSize: '1.8rem', minWidth: 40 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</Typography>
                    <Avatar sx={{ bgcolor: l.color, fontWeight: 700 }}>{l.name[0]}</Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography fontWeight={700}>{l.name}</Typography>
                      <LinearProgress variant="determinate" value={(l.total_points / max) * 100} sx={{ mt: 0.5, height: 8, borderRadius: 4, bgcolor: 'rgba(255,215,0,0.15)', '& .MuiLinearProgress-bar': { bgcolor: '#ffd700' } }} />
                    </Box>
                    <Typography variant="h6" fontWeight={800} sx={{ color: '#ffd700' }}>{l.total_points}</Typography>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="h6" fontWeight={700} mb={2} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CardGiftcardIcon sx={{ color: 'secondary.main' }} /> Belohnungen
          </Typography>
          <Stack spacing={1.5}>
            {rewards.map(r => {
              const canAfford = myPoints >= r.points_required;
              return (
                <Card key={r.id} sx={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${canAfford ? 'rgba(76,175,80,0.4)' : 'rgba(255,255,255,0.08)'}` }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Typography sx={{ fontSize: '1.5rem' }}>🎁</Typography>
                      <Box sx={{ flex: 1 }}>
                        <Typography fontWeight={600}>{r.title}</Typography>
                        {r.description && <Typography variant="caption" color="text.secondary">{r.description}</Typography>}
                      </Box>
                      <Stack alignItems="flex-end" spacing={0.5}>
                        <Chip label={`${r.points_required} P`} size="small" sx={{ bgcolor: canAfford ? 'success.dark' : 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 700 }} />
                        {!isParent && (
                          <Button size="small" variant={canAfford ? 'contained' : 'outlined'} disabled={!canAfford} onClick={() => handleRedeem(r.id)} sx={{ minWidth: 80, fontSize: '0.7rem' }}>
                            Einlösen
                          </Button>
                        )}
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
        </Grid>
      </Grid>

      <Dialog open={awardOpen} onClose={() => setAwardOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4, background: '#131929' } }}>
        <DialogTitle>Punkte vergeben</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} mt={1}>
            <FormControl fullWidth>
              <InputLabel>Kind</InputLabel>
              <Select value={awardForm.user_id} onChange={e => setAwardForm(p => ({ ...p, user_id: e.target.value }))}>
                {children.map(u => <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Punkte (negativ = abziehen)" type="number" value={awardForm.points} onChange={e => setAwardForm(p => ({ ...p, points: Number(e.target.value) }))} fullWidth />
            <TextField label="Grund" value={awardForm.reason} onChange={e => setAwardForm(p => ({ ...p, reason: e.target.value }))} fullWidth required />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setAwardOpen(false)}>Abbrechen</Button>
          <Button variant="contained" onClick={handleAward}>Vergeben</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={rewardOpen} onClose={() => setRewardOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4, background: '#131929' } }}>
        <DialogTitle>Neue Belohnung</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField label="Name" value={rewardForm.title} onChange={e => setRewardForm(p => ({ ...p, title: e.target.value }))} fullWidth required />
            <TextField label="Beschreibung" value={rewardForm.description} onChange={e => setRewardForm(p => ({ ...p, description: e.target.value }))} fullWidth />
            <TextField label="Benötigte Punkte" type="number" value={rewardForm.points_required} onChange={e => setRewardForm(p => ({ ...p, points_required: Number(e.target.value) }))} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setRewardOpen(false)}>Abbrechen</Button>
          <Button variant="contained" onClick={handleAddReward}>Erstellen</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
