import { useState, useEffect, Fragment } from 'react';
import { Box, Typography, Stack, Select, MenuItem, FormControl, InputLabel, Card, CardContent, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Switch, FormControlLabel } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../api/client';
import { TimetableEntry, User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useKiosk } from '../contexts/KioskContext';

const DAYS = ['', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

export function TimetablePage() {
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<TimetableEntry>>({ day_of_week: 1, period: 1, is_cancelled: 0 });
  const { isParent, user } = useAuth();
  const { isKiosk } = useKiosk();
  const canEdit = isParent && !isKiosk;

  useEffect(() => {
    api.get('/users').then(r => {
      const children = (r.data as User[]).filter(u => u.role === 'child');
      setUsers(children);
      const defaultUser = isParent ? children[0]?.id : user?.id;
      if (defaultUser) setSelectedUser(defaultUser);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedUser) api.get(`/timetable/${selectedUser}`).then(r => setEntries(r.data)).catch(() => {});
  }, [selectedUser]);

  const getEntry = (day: number, period: number) => entries.find(e => e.day_of_week === day && e.period === period);

  const handleSave = async () => {
    if (!form.subject || !selectedUser) return;
    try {
      if (form.id) { await api.put(`/timetable/${form.id}`, form); }
      else { await api.post(`/timetable/${selectedUser}`, form); }
      setOpen(false);
      api.get(`/timetable/${selectedUser}`).then(r => setEntries(r.data)).catch(() => {});
    } catch {
      alert('Fehler beim Speichern. Bitte erneut versuchen.');
    }
  };

  const handleDelete = async () => {
    if (!form.id) return;
    if (!confirm('Eintrag wirklich löschen?')) return;
    try {
      await api.delete(`/timetable/${form.id}`);
      setOpen(false);
      api.get(`/timetable/${selectedUser}`).then(r => setEntries(r.data)).catch(() => {});
    } catch {
      alert('Fehler beim Löschen. Bitte erneut versuchen.');
    }
  };

  const openEdit = (day: number, period: number) => {
    const entry = getEntry(day, period);
    setForm(entry || { day_of_week: day, period, is_cancelled: 0 });
    setOpen(true);
  };

  const selectedUserObj = users.find(u => u.id === selectedUser);

  return (
    <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Typography variant="h5" fontWeight={700}>Stundenplan</Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Kind</InputLabel>
            <Select value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
              {users.map(u => <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>)}
            </Select>
          </FormControl>
        </Stack>
      </Stack>

      {!canEdit && !isKiosk && (
        <Box sx={{
          p: 1.5, mb: 2,
          bgcolor: 'rgba(33,150,243,0.1)',
          border: '1px solid',
          borderColor: 'info.light',
          borderRadius: 2,
        }}>
          <Typography sx={{ fontSize: '0.8rem', color: 'info.main', fontWeight: 500 }}>
            ℹ️ Der Stundenplan kann nur von Eltern bearbeitet werden.
          </Typography>
        </Box>
      )}

      {selectedUser && (
        <Box sx={{ overflowX: 'auto' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '60px repeat(5, 1fr)', gap: 1, minWidth: 600 }}>
            <Box />
            {DAYS.slice(1).map(d => (
              <Typography key={d} variant="caption" fontWeight={700} textAlign="center" sx={{ py: 0.5, textTransform: 'uppercase', color: 'text.secondary' }}>{d}</Typography>
            ))}
            {PERIODS.map(period => (
              <Fragment key={period}>
                <Stack alignItems="center" justifyContent="center" sx={{ py: 1 }}>
                  <Typography variant="caption" fontWeight={700} sx={{ color: 'text.secondary' }}>{period}.</Typography>
                </Stack>
                {[1, 2, 3, 4, 5].map(day => {
                  const entry = getEntry(day, period);
                  return (
                    <Card key={`${day}-${period}`}
                      onClick={() => canEdit && openEdit(day, period)}
                      sx={{ cursor: canEdit ? 'pointer' : 'default', minHeight: 60, background: entry ? (entry.is_cancelled ? 'rgba(244,67,54,0.15)' : 'rgba(21,101,192,0.15)') : 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', transition: 'all 0.2s', '&:hover': canEdit ? { border: '1px solid rgba(255,255,255,0.2)' } : {} }}>
                      <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                        {entry ? (
                          <>
                            <Typography variant="caption" fontWeight={700} sx={{ display: 'block', textDecoration: entry.is_cancelled ? 'line-through' : 'none', color: entry.is_cancelled ? 'error.main' : 'inherit' }}>
                              {entry.subject}
                            </Typography>
                            {entry.is_cancelled && entry.substitute_teacher && (
                              <Typography variant="caption" sx={{ color: 'warning.main', display: 'block' }}>↔ {entry.substitute_teacher}</Typography>
                            )}
                            {!entry.is_cancelled && entry.teacher && (
                              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.65rem' }}>{entry.teacher}</Typography>
                            )}
                            {!entry.is_cancelled && entry.room && (
                              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.65rem' }}>{entry.room}</Typography>
                            )}
                          </>
                        ) : canEdit ? (
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.15)' }}>+</Typography>
                        ) : null}
                      </CardContent>
                    </Card>
                  );
                })}
              </Fragment>
            ))}
          </Box>
        </Box>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4, background: '#131929' } }}>
        <DialogTitle>Stunde {form.id ? 'bearbeiten' : 'hinzufügen'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField label="Fach" value={form.subject || ''} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} fullWidth required />
            <TextField label="Lehrer" value={form.teacher || ''} onChange={e => setForm(p => ({ ...p, teacher: e.target.value }))} fullWidth />
            <TextField label="Raum" value={form.room || ''} onChange={e => setForm(p => ({ ...p, room: e.target.value }))} fullWidth />
            <Stack direction="row" spacing={2}>
              <TextField label="Von" type="time" value={form.start_time || ''} onChange={e => setForm(p => ({ ...p, start_time: e.target.value }))} fullWidth InputLabelProps={{ shrink: true }} />
              <TextField label="Bis" type="time" value={form.end_time || ''} onChange={e => setForm(p => ({ ...p, end_time: e.target.value }))} fullWidth InputLabelProps={{ shrink: true }} />
            </Stack>
            <FormControlLabel control={<Switch checked={Boolean(form.is_cancelled)} onChange={e => setForm(p => ({ ...p, is_cancelled: e.target.checked ? 1 : 0 }))} />} label="Entfall" />
            {form.is_cancelled ? <TextField label="Vertretungslehrer" value={form.substitute_teacher || ''} onChange={e => setForm(p => ({ ...p, substitute_teacher: e.target.value }))} fullWidth /> : null}
            <TextField label="Notiz" value={form.note || ''} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          {form.id && <Button color="error" onClick={handleDelete}>Löschen</Button>}
          <Box sx={{ flex: 1 }} />
          <Button onClick={() => setOpen(false)}>Abbrechen</Button>
          <Button variant="contained" onClick={handleSave}>Speichern</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
