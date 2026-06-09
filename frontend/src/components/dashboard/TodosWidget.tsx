import { useState, useEffect } from 'react';
import { Box, Typography, Stack, IconButton, useTheme } from '@mui/material';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded';
import ThumbUpRoundedIcon from '@mui/icons-material/ThumbUpRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import api from '../../api/client';
import { Todo } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

const PRIORITY_COL = { low: '#3ecf8e', medium: '#f5a623', high: '#f56565' };

export function TodosWidget() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const { isParent, user } = useAuth();
  const theme = useTheme();

  const load = () => api.get('/todos').then(r => setTodos(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const pending = todos.filter(t => t.status === 'pending_approval');
  const open    = todos.filter(t => t.status === 'open' || t.status === 'in_progress');

  const submitApproval = async (id: string) => {
    await api.put(`/todos/${id}`, { status: 'pending_approval' });
    load();
  };
  const approve = async (todo: Todo) => {
    await api.put(`/todos/${todo.id}`, { ...todo, status: 'done' });
    load();
  };

  const myOpen = isParent ? open.slice(0, 4) : open.filter(t => t.assigned_to === user?.id).slice(0, 4);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Pending badge for parents */}
      {isParent && pending.length > 0 && (
        <Box sx={{ mb: 0.8, p: '6px 8px', borderRadius: 2, background: 'rgba(91,141,238,0.12)', border: '1px solid rgba(91,141,238,0.3)' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#5b8dee' }}>
              ⏳ {pending.length} wart{pending.length === 1 ? 'et' : 'en'} auf Genehmigung
            </Typography>
            {pending.map(t => (
              <Stack key={t.id} direction="row" alignItems="center" spacing={0.5}>
                <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</Typography>
                <IconButton size="small" sx={{ p: 0.2, color: '#3ecf8e' }} onClick={() => approve(t)}>
                  <ThumbUpRoundedIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Stack>
            )).slice(0, 1)}
          </Stack>
        </Box>
      )}

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'hidden' }}>
        {myOpen.length === 0 ? (
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
            <Typography sx={{ fontSize: '1.5rem', opacity: 0.4 }}>✅</Typography>
            <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>Alles erledigt!</Typography>
          </Box>
        ) : myOpen.map(todo => {
          const isMine = todo.assigned_to === user?.id;
          return (
            <Stack key={todo.id} direction="row" alignItems="center" spacing={0.8} sx={{
              px: '8px', py: '5px', borderRadius: 2,
              background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)',
              border: `1px solid ${theme.palette.divider}`,
              borderLeft: `3px solid ${PRIORITY_COL[todo.priority]}`,
            }}>
              {!isParent && isMine ? (
                <IconButton size="small" sx={{ p: 0.2, color: 'text.secondary' }} onClick={() => submitApproval(todo.id)}>
                  <RadioButtonUncheckedRoundedIcon sx={{ fontSize: 16 }} />
                </IconButton>
              ) : (
                <Box sx={{ p: '3px', color: 'text.secondary', display: 'flex' }}>
                  <RadioButtonUncheckedRoundedIcon sx={{ fontSize: 16 }} />
                </Box>
              )}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2, color: 'text.primary' }}>
                  {todo.title}
                </Typography>
                {todo.assigned_name && (
                  <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary', lineHeight: 1 }}>→ {todo.assigned_name}</Typography>
                )}
              </Box>
              {todo.points > 0 && (
                <Stack direction="row" alignItems="center" spacing={0.2}>
                  <EmojiEventsRoundedIcon sx={{ fontSize: 11, color: '#f5a623' }} />
                  <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: '#f5a623' }}>{todo.points}</Typography>
                </Stack>
              )}
            </Stack>
          );
        })}
      </Box>
    </Box>
  );
}

