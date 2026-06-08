import { Box, Grid, Card, CardContent, useMediaQuery, useTheme } from '@mui/material';
import { ClockWidget } from '../components/dashboard/ClockWidget';
import { PrayerWidget } from '../components/dashboard/PrayerWidget';
import { TrafficWidget } from '../components/dashboard/TrafficWidget';
import { TransitWidget } from '../components/dashboard/TransitWidget';
import { TodayWidget } from '../components/dashboard/TodayWidget';
import { TodosWidget } from '../components/dashboard/TodosWidget';
import { MealWidget } from '../components/dashboard/MealWidget';
import { PointsWidget } from '../components/dashboard/PointsWidget';

function DashCard({ children, sx = {} }: { children: React.ReactNode; sx?: object }) {
  return (
    <Card sx={{ height: '100%', background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', ...sx }}>
      <CardContent sx={{ height: '100%', p: { xs: 2, md: 2.5 }, '&:last-child': { pb: 2 } }}>
        {children}
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const theme = useTheme();
  const isKiosk = useMediaQuery('(max-width: 800px) and (orientation: landscape)');

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2 }, height: '100%', overflow: 'auto' }}>
      <Grid container spacing={2} sx={{ height: '100%' }}>
        {/* Row 1: Clock + Prayer */}
        <Grid item xs={12} sm={7}>
          <DashCard>
            <ClockWidget />
          </DashCard>
        </Grid>
        <Grid item xs={12} sm={5}>
          <DashCard>
            <PrayerWidget />
          </DashCard>
        </Grid>

        {/* Row 2: Traffic + Transit + Today */}
        <Grid item xs={12} sm={4}>
          <DashCard>
            <TrafficWidget />
          </DashCard>
        </Grid>
        <Grid item xs={12} sm={4}>
          <DashCard>
            <TransitWidget />
          </DashCard>
        </Grid>
        <Grid item xs={12} sm={4}>
          <DashCard>
            <TodayWidget />
          </DashCard>
        </Grid>

        {/* Row 3: Todos + Meals + Points */}
        <Grid item xs={12} sm={4}>
          <DashCard>
            <TodosWidget />
          </DashCard>
        </Grid>
        <Grid item xs={12} sm={4}>
          <DashCard>
            <MealWidget />
          </DashCard>
        </Grid>
        <Grid item xs={12} sm={4}>
          <DashCard>
            <PointsWidget />
          </DashCard>
        </Grid>
      </Grid>
    </Box>
  );
}
