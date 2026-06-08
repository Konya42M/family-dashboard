import { useState, useEffect } from 'react';
import { Box, Typography, Stack, Chip, IconButton, Tooltip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import AssignmentIcon from '@mui/icons-material/Assignment';
import api from '../../api/client';
import { Todo } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

const priorityColor = { low: '#4caf50', medium: '#ff9800', high: '#f44336' };

export function TodosWidget() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const { user } = useAuth();

  useEffect(() => { api.get('/todos').then(r => setTodos(r.data)).catch(() => {}); }, []);

  const openTodos = todos.filter(t => t.status !== 'done').slice(0, 5);

  const toggle = async (todo: Todo) => {
    const newStatus = todo.status === 'open' ? 'in_progress' : 'done';
    await api.put(`/todos/${todo.id}`, { ...todo, status: newStatus });
    setTodos(prev => prev.map(t => t.id === todo.id ? { ...t, status: newStatus } : t));
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
        <AssignmentIcon sx={{ color: 'secondary.main' }} />
        <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>Aufgaben</Typography>
      </Stack>
      {openTodos.length === 0
        ? <Typography variant="body2" color="text.secondary">Alle Aufgaben erledigt! 🎉</Typography>
        : openTodos.map(todo => (
          <Stack key={todo.id} direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <IconButton size="small" onClick={() => toggle(todo)} sx={{ p: 0.5 }}>
              {todo.status === 'done'
                ? <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
                : <RadioButtonUncheckedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
              }
            </IconButton>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Typography variant="body2" fontWeight={600} sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {todo.title}
                </Typography>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: priorityColor[todo.priority], flexShrink: 0 }} />
              </Stack>
              {todo.assigned_name && (
                <Typography variant="caption" color="text.secondary">→ {todo.assigned_name}</Typography>
              )}
            </Box>
            {todo.points > 0 && (
              <Chip label={`+${todo.points}P`} size="small" sx={{ bgcolor: 'warning.dark', color: 'white', fontWeight: 700, fontSize: '0.65rem', height: 20 }} />
            )}
          </Stack>
        ))
      }
    </Box>
  );
}
