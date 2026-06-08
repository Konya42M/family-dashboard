import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Box, BottomNavigation, BottomNavigationAction, AppBar, Toolbar, Typography, IconButton, Avatar, useMediaQuery } from '@mui/material';
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

const NAV_ITEMS = [
  { label: 'Start', icon: <DashboardIcon />, path: '/' },
  { label: 'Kalender', icon: <CalendarMonthIcon />, path: '/calendar' },
  { label: 'Aufgaben', icon: <AssignmentIcon />, path: '/todos' },
  { label: 'Mahlzeiten', icon: <RestaurantIcon />, path: '/meals' },
  { label: 'Stundenplan', icon: <SchoolIcon />, path: '/timetable' },
  { label: 'Punkte', icon: <EmojiEventsIcon />, path: '/points' },
  { label: 'Einstellungen', icon: <SettingsIcon />, path: '/settings' },
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
  const isLandscape = useMediaQuery('(orientation: landscape)');

  const currentIndex = NAV_ITEMS.findIndex(n => n.path === location.pathname);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <AppBar position="static" elevation={0} sx={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <Toolbar variant="dense" sx={{ minHeight: 48 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ flex: 1, display: { xs: 'none', sm: 'block' } }}>
            🏠 Familien-Dashboard
          </Typography>
          <Box sx={{ flex: 1, display: { xs: 'block', sm: 'none' } }} />
          <Avatar sx={{ width: 28, height: 28, bgcolor: user?.color, fontSize: '0.8rem', mr: 1, cursor: 'pointer' }} onClick={() => navigate('/settings')}>
            {user?.name[0]}
          </Avatar>
          <Typography variant="body2" sx={{ mr: 1, display: { xs: 'none', sm: 'block' } }}>{user?.name}</Typography>
          <IconButton size="small" onClick={logout} color="inherit"><LogoutIcon fontSize="small" /></IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: isLandscape ? 'row' : 'column' }}>
        {isLandscape && (
          <Box sx={{ width: 72, display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 1, gap: 0.5, borderRight: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.3)' }}>
            {NAV_ITEMS.map((item) => (
              <IconButton key={item.path} size="small"
                onClick={() => navigate(item.path)}
                sx={{ width: 56, height: 56, borderRadius: 3, flexDirection: 'column', gap: 0.3, fontSize: '0.6rem',
                  color: location.pathname === item.path ? 'primary.main' : 'text.secondary',
                  bgcolor: location.pathname === item.path ? 'rgba(21,101,192,0.2)' : 'transparent',
                }}>
                {item.icon}
                <Box component="span" sx={{ fontSize: '0.55rem', lineHeight: 1 }}>{item.label}</Box>
              </IconButton>
            ))}
          </Box>
        )}

        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/todos" element={<TodosPage />} />
            <Route path="/meals" element={<MealsPage />} />
            <Route path="/timetable" element={<TimetablePage />} />
            <Route path="/points" element={<PointsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Box>
      </Box>

      {!isLandscape && (
        <BottomNavigation value={currentIndex} onChange={(_, v) => navigate(NAV_ITEMS[v].path)} showLabels sx={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', height: 56 }}>
          {NAV_ITEMS.map(item => (
            <BottomNavigationAction key={item.path} label={item.label} icon={item.icon} sx={{ minWidth: 0, '& .MuiBottomNavigationAction-label': { fontSize: '0.6rem' } }} />
          ))}
        </BottomNavigation>
      )}
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
