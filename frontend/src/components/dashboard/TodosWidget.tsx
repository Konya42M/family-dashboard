import { useState, useEffect } from 'react';
import { Box, Typography, Stack, IconButton } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import api from '../../api/client';
import { Todo } from '../../types';

const PRIORITY_COLOR = { low: '#4caf50', medium: '#ff9800', high: '#f44336' };
const PRIORITY_BG = { low: 'rgba(76,175,80,0.15)', medium: 'rgba(255,152,0,0.15)', high: 'rgba(244,67,54,0.15)' };

export function TodosWidget() {
  const [todos, setTodos] = useState<Todo[]>([]);

  useEffect(() => { api.get('/todos').then(r => setTodos(r.data)).catch(() => {}); }, []);

  const open = todos.filter(t => t.status !== 'done').slice(0, 5);
  const doneCount = todos.filter(t => t.status === 'done').length;

  const toggle = async (todo: Todo) => {
    const newStatus = todo.status === 'open' ? 'in_progress' : 'done';
    await api.put(`/todos/${todo.id}`, { ...todo, status: newStatus });
    setTodos(prev => prev.map(t => t.id === todo.id ? { ...t, status: newStatus } : t));
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
        <Typography variant="caption" color="text.secondary">Aufgaben</Typography>
        {doneCount > 0 && (
          <Typography sx={{ fontSize: '0.62rem', color: '#4caf50', fontWeight: 600 }}>
            {doneCount} erledigt ✓
          </Typography>
        )}
      </Stack>

      {open.length === 0 ? (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
          <Typography sx={{ fontSize: '1.8rem', opacity: 0.5 }}>🎉</Typography>
          <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Alles erledigt!</Typography>
        </Box>
      ) : (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5, overflow: 'hidden' }}>
          {open.map(todo => (
            <Stack key={todo.id} direction="row" alignItems="center" spacing={0.8} sx={{
              px: 0.8, py: 0.5, borderRadius: 2,
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
            }}>
              <IconButton
                size="small"
                onClick={() => toggle(todo)}
                sx={{ p: 0.3, color: todo.status === 'in_progress' ? '#ff9800' : 'text.secondary' }}
              >
                {todo.status === 'in_progress'
                  ? <CheckCircleIcon sx={{ fontSize: 18, color: '#ff9800' }} />
                  : <RadioButtonUncheckedIcon sx={{ fontSize: 18 }} />}
              </IconButton>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: '0.76rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
                  {todo.title}
                </Typography>
                {todo.assigned_name && (
                  <Typography sx={{ fontSize: '0.62rem', color: 'text.secondary', lineHeight: 1.2 }}>
                    → {todo.assigned_name}
                  </Typography>
                )}
              </Box>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: PRIORITY_COLOR[todo.priority] }} />
                {todo.points > 0 && (
                  <Box sx={{
                    px: 0.6, py: 0.2, borderRadius: 1,
                    background: 'rgba(255,196,0,0.15)', border: '1px solid rgba(255,196,0,0.3)',
                  }}>
                    <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#ffd740', lineHeight: 1 }}>
                      +{todo.points}P
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Stack>
          ))}
        </Box>
      )}
    </Box>
  );
}

