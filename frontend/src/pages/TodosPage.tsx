import { useState, useEffect } from 'react';
import { Box, Button, Stack, Typography, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, Chip, IconButton, Tabs, Tab, useTheme, Tooltip } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded';
import HourglassTopRoundedIcon from '@mui/icons-material/HourglassTopRounded';
import ThumbUpRoundedIcon from '@mui/icons-material/ThumbUpRounded';
import ThumbDownRoundedIcon from '@mui/icons-material/ThumbDownRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import api from '../api/client';
import { Todo, User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { format, parseISO } from 'date-fns';

type Status = 'open' | 'in_progress' | 'pending_approval' | 'done';
const PRIORITY_COL = { low: '#3ecf8e', medium: '#f5a623', high: '#f56565' };
const PRIORITY_LABEL = { low: 'Niedrig', medium: 'Mittel', high: 'Hoch' };

const STATUS_CONFIG: Record<Status, { icon: React.ReactNode; label: string; color: string }> = {
  open:             { icon: <RadioButtonUncheckedRoundedIcon sx={{ fontSize: 20 }} />, label: 'Offen',          color: '#6b7280' },
  in_progress:      { icon: <HourglassTopRoundedIcon sx={{ fontSize: 20 }} />,        label: 'In Arbeit',      color: '#f5a623' },
  pending_approval: { icon: <HourglassTopRoundedIcon sx={{ fontSize: 20 }} />,        label: 'Warte auf OK',   color: '#5b8dee' },
  done:             { icon: <CheckCircleRoundedIcon sx={{ fontSize: 20 }} />,          label: 'Erledigt',       color: '#3ecf8e' },
};

export function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tab, setTab] = useState(0);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Todo>>({ priority: 'medium', status: 'open', points: 0 });
  const { isParent, user } = useAuth();
  const theme = useTheme();
  const dark = theme.palette.mode === 'dark';

  const load = () => { api.get('/todos').then(r => setTodos(r.data)).catch(() => {}); };
  useEffect(() => { load(); api.get('/users').then(r => setUsers(r.data)).catch(() => {}); }, []);

  const open_count      = todos.filter(t => t.status === 'open' || t.status === 'in_progress').length;
  const approval_count  = todos.filter(t => t.status === 'pending_approval').length;
  const done_count      = todos.filter(t => t.status === 'done').length;

  const filtered = tab === 0
    ? todos.filter(t => t.status === 'open' || t.status === 'in_progress')
    : tab === 1
    ? todos.filter(t => t.status === 'pending_approval')
    : todos.filter(t => t.status === 'done');

  const handleSave = async () => {
    if (!form.title) return;
    if (form.id) await api.put(`/todos/${form.id}`, form);
    else         await api.post('/todos', form);
    setOpen(false);
    setForm({ priority: 'medium', status: 'open', points: 0 });
    load();
  };

  const submitForApproval = async (todo: Todo) => {
    await api.put(`/todos/${todo.id}`, { status: 'pending_approval' });
    load();
  };

  const approveTodo = async (todo: Todo) => {
    await api.put(`/todos/${todo.id}`, { ...todo, status: 'done' });
    load();
  };

  const rejectTodo = async (todo: Todo) => {
    await api.put(`/todos/${todo.id}`, { ...todo, status: 'rejected' });
    load();
  };

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2 }, height: '100%', display: 'flex', flexDirection: 'column', background: theme.palette.background.default }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
        <Typography variant="h5" fontWeight={800}>Aufgaben</Typography>
        {isParent && (
          <Button variant="contained" startIcon={<AddRoundedIcon />} size="small"
            onClick={() => { setForm({ priority: 'medium', status: 'open', points: 0 }); setOpen(true); }}>
            Neue Aufgabe
          </Button>
        )}
      </Stack>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 1.5, minHeight: 36, '& .MuiTab-root': { minHeight: 36, py: 0, fontSize: '0.75rem', fontWeight: 700, fontFamily: 'inherit' } }}>
        <Tab label={`Offen${open_count > 0 ? ` (${open_count})` : ''}`} />
        <Tab label={
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <span>Zur Genehmigung</span>
            {approval_count > 0 && (
              <Box sx={{ width: 18, height: 18, borderRadius: '50%', bgcolor: '#5b8dee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: '#fff' }}>{approval_count}</Typography>
              </Box>
            )}
          </Stack>
        } />
        <Tab label={`Erledigt${done_count > 0 ? ` (${done_count})` : ''}`} />
      </Tabs>

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Stack spacing={1}>
          {filtered.map(todo => {
            const sc = STATUS_CONFIG[(todo.status as Status)] || STATUS_CONFIG.open;
            const isMyTodo = todo.assigned_to === user?.id;
            const isPending = todo.status === 'pending_approval';

            return (
              <Box key={todo.id} sx={{
                background: theme.palette.background.paper,
                border: `1px solid ${isPending ? 'rgba(91,141,238,0.3)' : theme.palette.divider}`,
                borderLeft: `3px solid ${isPending ? '#5b8dee' : PRIORITY_COL[todo.priority]}`,
                borderRadius: '12px',
                p: '10px 12px',
                opacity: todo.status === 'done' ? 0.65 : 1,
                transition: 'all 0.15s',
              }}>
                <Stack direction="row" alignItems="flex-start" spacing={1.2}>
                  {/* Status icon / action */}
                  <Box sx={{ mt: 0.2, color: sc.color, flexShrink: 0 }}>
                    {!isParent && isMyTodo && (todo.status === 'open' || todo.status === 'in_progress') ? (
                      <Tooltip title="Als erledigt melden (wartet auf Eltern-OK)">
                        <IconButton size="small" sx={{ p: 0.3, color: sc.color }} onClick={() => submitForApproval(todo)}>
                          {sc.icon}
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Box sx={{ p: 0.3 }}>{sc.icon}</Box>
                    )}
                  </Box>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" gap={0.5}>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', textDecoration: todo.status === 'done' ? 'line-through' : 'none', color: 'text.primary' }}>
                        {todo.title}
                      </Typography>
                      <Chip size="small" label={PRIORITY_LABEL[todo.priority]}
                        sx={{ height: 18, fontSize: '0.62rem', bgcolor: `${PRIORITY_COL[todo.priority]}22`, color: PRIORITY_COL[todo.priority], border: `1px solid ${PRIORITY_COL[todo.priority]}44`, fontWeight: 700 }} />
                      {isPending && <Chip size="small" label="⏳ Wartet auf OK" sx={{ height: 18, fontSize: '0.62rem', bgcolor: 'rgba(91,141,238,0.15)', color: '#5b8dee', fontWeight: 700 }} />}
                    </Stack>

                    {todo.description && (
                      <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', mt: 0.4, lineHeight: 1.4 }}>{todo.description}</Typography>
                    )}

                    <Stack direction="row" spacing={0.8} mt={0.6} flexWrap="wrap" gap={0.5}>
                      {todo.assigned_name && (
                        <Chip size="small" label={`→ ${todo.assigned_name}`}
                          sx={{ height: 18, fontSize: '0.65rem', bgcolor: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)', fontWeight: 600 }} />
                      )}
                      {todo.due_date && (
                        <Chip size="small" label={`📅 ${format(parseISO(todo.due_date), 'dd.MM.yy')}`}
                          sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600 }} />
                      )}
                      {todo.points > 0 && (
                        <Chip size="small"
                          icon={<EmojiEventsRoundedIcon sx={{ fontSize: '11px !important', color: '#f5a623 !important' }} />}
                          label={`${todo.points} Punkte`}
                          sx={{ height: 18, fontSize: '0.65rem', bgcolor: 'rgba(245,166,35,0.12)', color: '#f5a623', fontWeight: 700 }} />
                      )}
                    </Stack>
                  </Box>

                  {/* Actions */}
                  <Stack direction="row" alignItems="center" spacing={0.3}>
                    {/* Parent: approve/reject pending */}
                    {isParent && isPending && (
                      <>
                        <Tooltip title="Genehmigen + Punkte vergeben">
                          <IconButton size="small" sx={{ color: '#3ecf8e', p: 0.5 }} onClick={() => approveTodo(todo)}>
                            <ThumbUpRoundedIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Ablehnen (zurück zu Offen)">
                          <IconButton size="small" sx={{ color: '#f56565', p: 0.5 }} onClick={() => rejectTodo(todo)}>
                            <ThumbDownRoundedIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                    {isParent && (
                      <>
                        <IconButton size="small" sx={{ p: 0.4, color: 'text.secondary' }} onClick={() => { setForm(todo as any); setOpen(true); }}>
                          <EditRoundedIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                        <IconButton size="small" sx={{ p: 0.4, color: 'error.main' }} onClick={async () => { await api.delete(`/todos/${todo.id}`); load(); }}>
                          <DeleteRoundedIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </>
                    )}
                  </Stack>
                </Stack>
              </Box>
            );
          })}

          {filtered.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography sx={{ fontSize: '2.5rem', mb: 1 }}>{tab === 0 ? '🎉' : tab === 1 ? '✅' : '📭'}</Typography>
              <Typography color="text.secondary" fontWeight={600}>
                {tab === 0 ? 'Keine offenen Aufgaben!' : tab === 1 ? 'Nichts wartet auf Genehmigung' : 'Noch nichts erledigt'}
              </Typography>
            </Box>
          )}
        </Stack>
      </Box>

      {/* Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>{form.id ? 'Aufgabe bearbeiten' : 'Neue Aufgabe'}</DialogTitle>
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
              <Select value={form.assigned_to || ''} onChange={e => setForm(p => ({ ...p, assigned_to: e.target.value }))} label="Verantwortlich">
                <MenuItem value="">Alle</MenuItem>
                {users.map(u => <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Fälligkeitsdatum" type="date" value={form.due_date?.split('T')[0] || ''} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} fullWidth InputLabelProps={{ shrink: true }} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)}>Abbrechen</Button>
          <Button variant="contained" onClick={handleSave}>Speichern</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

