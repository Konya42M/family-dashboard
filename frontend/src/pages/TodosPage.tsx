import { useState, useEffect } from 'react';
import { Box, Button, Stack, Typography, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, Card, CardContent, Chip, IconButton, Tabs, Tab } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../api/client';
import { Todo, User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { format, parseISO } from 'date-fns';

const priorityColor = { low: '#4caf50', medium: '#ff9800', high: '#f44336' };
const priorityLabel = { low: 'Niedrig', medium: 'Mittel', high: 'Hoch' };

const statusIcon = {
  open: <RadioButtonUncheckedIcon sx={{ color: 'text.secondary' }} />,
  in_progress: <HourglassEmptyIcon sx={{ color: 'warning.main' }} />,
  done: <CheckCircleIcon sx={{ color: 'success.main' }} />,
};

export function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tab, setTab] = useState(0);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Todo>>({ priority: 'medium', status: 'open', points: 0 });
  const { isParent, user } = useAuth();

  const fetch = () => api.get('/todos').then(r => setTodos(r.data)).catch(() => {});
  useEffect(() => { fetch(); api.get('/users').then(r => setUsers(r.data)).catch(() => {}); }, []);

  const filtered = todos.filter(t => tab === 0 ? t.status !== 'done' : t.status === 'done');

  const handleSave = async () => {
    if (!form.title) return;
    if (form.id) { await api.put(`/todos/${form.id}`, form); }
    else { await api.post('/todos', form); }
    setOpen(false);
    setForm({ priority: 'medium', status: 'open', points: 0 });
    fetch();
  };

  const cycleStatus = async (todo: Todo) => {
    const next = todo.status === 'open' ? 'in_progress' : todo.status === 'in_progress' ? 'done' : 'open';
    await api.put(`/todos/${todo.id}`, { ...todo, status: next });
    fetch();
  };

  return (
    <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={700}>Aufgaben</Typography>
        {isParent && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setForm({ priority: 'medium', status: 'open', points: 0 }); setOpen(true); }}>
            Neue Aufgabe
          </Button>
        )}
      </Stack>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label={`Offen (${todos.filter(t => t.status !== 'done').length})`} />
        <Tab label={`Erledigt (${todos.filter(t => t.status === 'done').length})`} />
      </Tabs>

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Stack spacing={1.5}>
          {filtered.map(todo => (
            <Card key={todo.id} sx={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', opacity: todo.status === 'done' ? 0.6 : 1 }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Stack direction="row" alignItems="flex-start" spacing={1.5}>
                  <IconButton size="small" onClick={() => cycleStatus(todo)} sx={{ p: 0.5, mt: 0.3 }}>
                    {statusIcon[todo.status]}
                  </IconButton>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" gap={0.5}>
                      <Typography variant="body1" fontWeight={600} sx={{ textDecoration: todo.status === 'done' ? 'line-through' : 'none' }}>
                        {todo.title}
                      </Typography>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: priorityColor[todo.priority] }} />
                      <Typography variant="caption" sx={{ color: priorityColor[todo.priority] }}>{priorityLabel[todo.priority]}</Typography>
                    </Stack>
                    {todo.description && <Typography variant="body2" color="text.secondary" mt={0.5}>{todo.description}</Typography>}
                    <Stack direction="row" spacing={1} mt={1} flexWrap="wrap" gap={0.5}>
                      {todo.assigned_name && <Chip size="small" label={`→ ${todo.assigned_name}`} sx={{ height: 20, fontSize: '0.7rem', bgcolor: 'rgba(255,255,255,0.1)' }} />}
                      {todo.due_date && <Chip size="small" label={format(parseISO(todo.due_date), 'dd.MM.yy')} sx={{ height: 20, fontSize: '0.7rem' }} />}
                      {todo.points > 0 && <Chip size="small" label={`+${todo.points} Pkt`} sx={{ height: 20, fontSize: '0.7rem', bgcolor: 'warning.dark', color: 'white' }} />}
                    </Stack>
                  </Box>
                  {isParent && (
                    <Stack direction="row">
                      <IconButton size="small" onClick={() => { setForm(todo); setOpen(true); }}><AddIcon sx={{ fontSize: 16 }} /></IconButton>
                      <IconButton size="small" color="error" onClick={async () => { await api.delete(`/todos/${todo.id}`); fetch(); }}><DeleteIcon sx={{ fontSize: 16 }} /></IconButton>
                    </Stack>
                  )}
                </Stack>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="h4" mb={1}>{tab === 0 ? '🎉' : '📭'}</Typography>
              <Typography color="text.secondary">{tab === 0 ? 'Alle Aufgaben erledigt!' : 'Noch nichts erledigt'}</Typography>
            </Box>
          )}
        </Stack>
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4, background: '#131929' } }}>
        <DialogTitle>{form.id ? 'Aufgabe bearbeiten' : 'Neue Aufgabe'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} mt={1}>
            <TextField label="Titel" value={form.title || ''} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} fullWidth required />
            <TextField label="Beschreibung" value={form.description || ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} fullWidth multiline rows={2} />
            <Stack direction="row" spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Priorität</InputLabel>
                <Select value={form.priority || 'medium'} onChange={e => setForm(p => ({ ...p, priority: e.target.value as any }))}>
                  <MenuItem value="low">Niedrig</MenuItem>
                  <MenuItem value="medium">Mittel</MenuItem>
                  <MenuItem value="high">Hoch</MenuItem>
                </Select>
              </FormControl>
              <TextField label="Punkte" type="number" value={form.points || 0} onChange={e => setForm(p => ({ ...p, points: Number(e.target.value) }))} fullWidth />
            </Stack>
            <FormControl fullWidth>
              <InputLabel>Verantwortlich</InputLabel>
              <Select value={form.assigned_to || ''} onChange={e => setForm(p => ({ ...p, assigned_to: e.target.value }))}>
                <MenuItem value="">Alle</MenuItem>
                {users.map(u => <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Fälligkeitsdatum" type="date" value={form.due_date?.split('T')[0] || ''} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} fullWidth InputLabelProps={{ shrink: true }} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpen(false)}>Abbrechen</Button>
          <Button variant="contained" onClick={handleSave}>Speichern</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
