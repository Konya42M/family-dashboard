import { useState, useEffect } from 'react';
import { Box, Typography, Stack } from '@mui/material';
import { format } from 'date-fns';
import api from '../../api/client';
import { MealPlan } from '../../types';

const MEALS: { key: MealPlan['meal_type']; label: string; tr: string; icon: string; color: string }[] = [
  { key: 'breakfast', label: 'Frühstück',   tr: 'Kahvaltı',  icon: '🌅', color: 'rgba(255,183,77,0.2)'  },
  { key: 'lunch',     label: 'Mittagessen', tr: 'Öğle',      icon: '☀️', color: 'rgba(77,144,254,0.2)'  },
  { key: 'dinner',    label: 'Abendessen',  tr: 'Akşam',     icon: '🌙', color: 'rgba(173,20,87,0.2)'   },
];

export function MealWidget() {
  const [meals, setMeals] = useState<MealPlan[]>([]);

  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    api.get(`/meals?start=${today}&end=${today}`).then(r => setMeals(r.data)).catch(() => {});
  }, []);

  const getMeal = (type: MealPlan['meal_type']) => meals.find(m => m.meal_type === type);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="caption" color="text.secondary" mb={1} display="block">Speiseplan heute</Typography>
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.6 }}>
        {MEALS.map(({ key, label, tr, icon, color }) => {
          const meal = getMeal(key);
          return (
            <Stack key={key} direction="row" alignItems="center" spacing={1} sx={{
              px: 1, py: 0.7, borderRadius: 2,
              background: meal ? color : 'rgba(255,255,255,0.025)',
              border: `1px solid ${meal ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)'}`,
              flex: 1,
            }}>
              <Typography sx={{ fontSize: '1.1rem', lineHeight: 1 }}>{icon}</Typography>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" spacing={0.8} alignItems="baseline">
                  <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    {label}
                  </Typography>
                  <Typography sx={{ fontSize: '0.55rem', color: 'text.secondary', opacity: 0.6 }}>{tr}</Typography>
                </Stack>
                <Typography sx={{
                  fontSize: '0.78rem', fontWeight: meal ? 600 : 400,
                  color: meal ? 'text.primary' : 'text.secondary',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  lineHeight: 1.2,
                }}>
                  {meal ? meal.title : '—'}
                </Typography>
              </Box>
            </Stack>
          );
        })}
      </Box>
    </Box>
  );
}

