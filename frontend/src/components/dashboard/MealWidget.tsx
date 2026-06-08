import { useState, useEffect } from 'react';
import { Box, Typography, Stack } from '@mui/material';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import { format } from 'date-fns';
import api from '../../api/client';
import { MealPlan } from '../../types';

const mealLabels = { breakfast: { label: 'Frühstück', icon: '🌅' }, lunch: { label: 'Mittagessen', icon: '☀️' }, dinner: { label: 'Abendessen', icon: '🌙' } };

export function MealWidget() {
  const [meals, setMeals] = useState<MealPlan[]>([]);

  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    api.get(`/meals?start=${today}&end=${today}`).then(r => setMeals(r.data)).catch(() => {});
  }, []);

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
        <RestaurantIcon sx={{ color: '#ff7043' }} />
        <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>Heute essen</Typography>
      </Stack>
      {meals.length === 0
        ? <Typography variant="body2" color="text.secondary">Nicht geplant</Typography>
        : meals.map(m => (
          <Stack key={m.id} direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.75 }}>
            <Typography sx={{ fontSize: '1.3rem' }}>{mealLabels[m.meal_type]?.icon}</Typography>
            <Box>
              <Typography variant="caption" color="text.secondary">{mealLabels[m.meal_type]?.label}</Typography>
              <Typography variant="body2" fontWeight={600}>{m.title}</Typography>
            </Box>
          </Stack>
        ))
      }
    </Box>
  );
}
