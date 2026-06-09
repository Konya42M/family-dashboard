import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Box, AppBar, Toolbar, Typography, IconButton, Avatar, Stack, Tooltip } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AssignmentIcon from '@mui/icons-material/Assignment';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import SchoolIcon from '@mui/icons-material/School';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CalendarPage } from './pages/CalendarPage';
import { TodosPage } from './pages/TodosPage';
import { MealsPage } from './pages/MealsPage';
import { TimetablePage } from './pages/TimetablePage';
import { PointsPage } from './pages/PointsPage';
import { SettingsPage } from './pages/SettingsPage';

const NAV = [
  { label: 'Start',       icon: <DashboardIcon sx={{ fontSize: 18 }} />,     path: '/'          },
  { label: 'Kalender',    icon: <CalendarMonthIcon sx={{ fontSize: 18 }} />, path: '/calendar'  },
  { label: 'Aufgaben',    icon: <AssignmentIcon sx={{ fontSize: 18 }} />,    path: '/todos'     },
  { label: 'Essen',       icon: <RestaurantIcon sx={{ fontSize: 18 }} />,    path: '/meals'     },
  { label: 'Stundenplan', icon: <SchoolIcon sx={{ fontSize: 18 }} />,        path: '/timetable' },
  { label: 'Punkte',      icon: <EmojiEventsIcon sx={{ fontSize: 18 }} />,   path: '/points'    },
  { label: 'Settings',    icon: <SettingsIcon sx={{ fontSize: 18 }} />,      path: '/settings'  },
];

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', flexDirection: 'column' }}>
      {/* Top bar — compact for 480px height */}
      <AppBar position="static" elevation={0} sx={{ height: 40, minHeight: 40 }}>
        <Toolbar variant="dense" sx={{ minHeight: 40, height: 40, px: 1.5, gap: 1 }}>
          {/* Logo */}
          <Typography sx={{
            fontSize: '0.8rem', fontWeight: 800, letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, #4d90fe, #80b0ff)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            display: { xs: 'none', sm: 'block' },
            mr: 1,
          }}>
            🏠 FamilyHub
          </Typography>

          {/* Navigation */}
          <Stack direction="row" spacing={0.3} sx={{ flex: 1 }}>
            {NAV.map(item => {
              const active = location.pathname === item.path;
              return (
                <Box
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 0.5,
                    px: { xs: 0.8, sm: 1.2 }, py: 0.5,
                    borderRadius: 2, cursor: 'pointer',
                    background: active ? 'rgba(77,144,254,0.2)' : 'transparent',
                    border: active ? '1px solid rgba(77,144,254,0.3)' : '1px solid transparent',
                    color: active ? '#80b0ff' : 'rgba(255,255,255,0.45)',
                    transition: 'all 0.2s',
                    '&:active': { background: 'rgba(77,144,254,0.15)' },
                    minWidth: { xs: 32, sm: 'auto' },
                    justifyContent: 'center',
                  }}
                >
                  {item.icon}
                  <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, display: { xs: 'none', sm: 'block' } }}>
                    {item.label}
                  </Typography>
                </Box>
              );
            })}
          </Stack>

          {/* User */}
          <Stack direction="row" alignItems="center" spacing={1}>
            <Avatar
              sx={{ width: 24, height: 24, bgcolor: user?.color, fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer' }}
              onClick={() => navigate('/settings')}
            >
              {user?.name[0]}
            </Avatar>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, display: { xs: 'none', sm: 'block' }, color: 'text.secondary' }}>
              {user?.name}
            </Typography>
            <IconButton size="small" onClick={logout} sx={{ p: 0.4, color: 'rgba(255,255,255,0.4)' }}>
              <LogoutIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Page content */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <Routes>
          <Route path="/"          element={<DashboardPage />} />
          <Route path="/calendar"  element={<CalendarPage />} />
          <Route path="/todos"     element={<TodosPage />} />
          <Route path="/meals"     element={<MealsPage />} />
          <Route path="/timetable" element={<TimetablePage />} />
          <Route path="/points"    element={<PointsPage />} />
          <Route path="/settings"  element={<SettingsPage />} />
        </Routes>
      </Box>
    </Box>
  );
}

export default function App() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/*" element={<RequireAuth><Layout /></RequireAuth>} />
    </Routes>
  );
}

