import { useState, useEffect } from 'react';
import { Box, Typography, Stack, Grid, Card, CardContent, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Chip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { format, addDays, startOfWeek } from 'date-fns';
import { de } from 'date-fns/locale';
import api from '../api/client';
import { MealPlan } from '../types';
import { useAuth } from '../contexts/AuthContext';

const MEAL_TYPES = [
  { key: 'breakfast', label: 'Frühstück', icon: '🌅' },
  { key: 'lunch', label: 'Mittagessen', icon: '☀️' },
  { key: 'dinner', label: 'Abendessen', icon: '🌙' },
];

export function MealsPage() {
  const [meals, setMeals] = useState<MealPlan[]>([]);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<{ date: string; mealType: string; meal?: MealPlan } | null>(null);
  const [form, setForm] = useState({ title: '', description: '', recipe: '' });
  const { isParent } = useAuth();

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const fetchMeals = () => {
    const start = format(weekStart, 'yyyy-MM-dd');
    const end = format(addDays(weekStart, 6), 'yyyy-MM-dd');
    api.get(`/meals?start=${start}&end=${end}`).then(r => setMeals(r.data)).catch(() => {});
  };

  useEffect(() => { fetchMeals(); }, [weekStart]);

  const getMeal = (date: Date, type: string) => meals.find(m => m.date === format(date, 'yyyy-MM-dd') && m.meal_type === type);

  const openEdit = (date: Date, type: string) => {
    const meal = getMeal(date, type);
    setEditing({ date: format(date, 'yyyy-MM-dd'), mealType: type, meal });
    setForm({ title: meal?.title || '', description: meal?.description || '', recipe: meal?.recipe || '' });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!editing || !form.title) return;
    await api.put(`/meals/${editing.date}/${editing.mealType}`, form);
    setOpen(false);
    fetchMeals();
  };

  const handleDelete = async () => {
    if (!editing) return;
    await api.delete(`/meals/${editing.date}/${editing.mealType}`);
    setOpen(false);
    fetchMeals();
  };

  return (
    <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={700}>Mahlzeitenplan</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" size="small" onClick={() => setWeekStart(d => addDays(d, -7))}>← Vorwoche</Button>
          <Button variant="outlined" size="small" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>Heute</Button>
          <Button variant="outlined" size="small" onClick={() => setWeekStart(d => addDays(d, 7))}>Nächste →</Button>
        </Stack>
      </Stack>

      <Typography variant="subtitle2" color="text.secondary" mb={2}>
        {format(weekStart, 'd. MMM', { locale: de })} – {format(addDays(weekStart, 6), 'd. MMM yyyy', { locale: de })}
      </Typography>

      <Box sx={{ overflowX: 'auto' }}>
        <Grid container spacing={1.5} sx={{ minWidth: 700 }}>
          {weekDays.map(day => {
            const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
            return (
              <Grid item xs key={day.toISOString()} sx={{ flex: 1 }}>
                <Typography variant="caption" fontWeight={700} sx={{ display: 'block', textAlign: 'center', mb: 1, color: isToday ? 'primary.main' : 'text.secondary', textTransform: 'uppercase' }}>
                  {format(day, 'EEE', { locale: de })}
                  <br />
                  <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>{format(day, 'd')}</span>
                </Typography>
                {MEAL_TYPES.map(mt => {
                  const meal = getMeal(day, mt.key);
                  return (
                    <Card key={mt.key} sx={{ mb: 1, background: meal ? 'rgba(21,101,192,0.15)' : 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', minHeight: 72, cursor: isParent ? 'pointer' : 'default' }}
                      onClick={() => isParent && openEdit(day, mt.key)}>
                      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mb: 0.5 }}>{mt.icon} {mt.label}</Typography>
                        {meal
                          ? <Typography variant="caption" fontWeight={600} sx={{ display: 'block', lineHeight: 1.3 }}>{meal.title}</Typography>
                          : isParent && <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.2)' }}>+ Hinzufügen</Typography>
                        }
                      </CardContent>
                    </Card>
                  );
                })}
              </Grid>
            );
          })}
        </Grid>
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4, background: '#131929' } }}>
        <DialogTitle>{editing?.meal ? 'Mahlzeit bearbeiten' : 'Mahlzeit hinzufügen'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField label="Gericht" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} fullWidth required />
            <TextField label="Beschreibung" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} fullWidth multiline rows={2} />
            <TextField label="Rezept (optional)" value={form.recipe} onChange={e => setForm(p => ({ ...p, recipe: e.target.value }))} fullWidth multiline rows={3} placeholder="Zutaten und Zubereitung..." />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          {editing?.meal && <Button color="error" onClick={handleDelete}>Löschen</Button>}
          <Box sx={{ flex: 1 }} />
          <Button onClick={() => setOpen(false)}>Abbrechen</Button>
          <Button variant="contained" onClick={handleSave}>Speichern</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
