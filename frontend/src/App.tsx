import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Box, AppBar, Toolbar, Typography, IconButton, Avatar, Stack, Tooltip, useTheme } from '@mui/material';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import { useAuth } from './contexts/AuthContext';
import { useThemeMode } from './contexts/ThemeContext';
import { LoginPage } from './pages/LoginPage';
import { KioskAutoLogin } from './pages/KioskAutoLogin';
import { DashboardPage } from './pages/DashboardPage';
import { CalendarPage } from './pages/CalendarPage';
import { TodosPage } from './pages/TodosPage';
import { TimetablePage } from './pages/TimetablePage';
import { PointsPage } from './pages/PointsPage';
import { SettingsPage } from './pages/SettingsPage';
import { MealsPage } from './pages/MealsPage';

const NAV = [
  { label: 'Start',      icon: <DashboardRoundedIcon sx={{ fontSize: 18 }} />,      path: '/'          },
  { label: 'Kalender',   icon: <CalendarMonthRoundedIcon sx={{ fontSize: 18 }} />,  path: '/calendar'  },
  { label: 'Aufgaben',   icon: <AssignmentRoundedIcon sx={{ fontSize: 18 }} />,     path: '/todos'     },
  { label: 'Stundenplan',icon: <SchoolRoundedIcon sx={{ fontSize: 18 }} />,         path: '/timetable' },
  { label: 'Punkte',     icon: <EmojiEventsRoundedIcon sx={{ fontSize: 18 }} />,    path: '/points'    },
  { label: 'Einstellungen', icon: <SettingsRoundedIcon sx={{ fontSize: 18 }} />,    path: '/settings'  },
];

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function TopBar() {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useThemeMode();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const dark = theme.palette.mode === 'dark';

  return (
    <AppBar position="static" elevation={0}>
      <Toolbar variant="dense" sx={{ minHeight: 42, height: 42, px: 1.5, gap: 0.5 }}>
        {/* Logo */}
        <Typography sx={{ fontWeight: 800, fontSize: '0.82rem', color: 'primary.main', mr: 1.5, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
          🏠 FamilyHub
        </Typography>

        {/* Nav links */}
        <Stack direction="row" spacing={0.3} sx={{ flex: 1, overflow: 'hidden' }}>
          {NAV.map(item => {
            const active = location.pathname === item.path;
            return (
              <Box key={item.path} onClick={() => navigate(item.path)} sx={{
                display: 'flex', alignItems: 'center', gap: '4px', px: 1, py: '5px', borderRadius: 2, cursor: 'pointer', whiteSpace: 'nowrap',
                background: active ? 'rgba(91,141,238,0.15)' : 'transparent',
                color: active ? 'primary.light' : 'text.secondary',
                border: active ? '1px solid rgba(91,141,238,0.25)' : '1px solid transparent',
                transition: 'all 0.15s',
                '&:active': { opacity: 0.7 },
              }}>
                {item.icon}
                <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, display: { xs: 'none', sm: 'block' } }}>{item.label}</Typography>
              </Box>
            );
          })}
        </Stack>

        {/* Right: theme toggle + user */}
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Tooltip title={dark ? 'Light Mode' : 'Dark Mode'}>
            <IconButton size="small" onClick={toggleDarkMode} sx={{ p: '5px', color: 'text.secondary' }}>
              {dark ? <LightModeRoundedIcon sx={{ fontSize: 17 }} /> : <DarkModeRoundedIcon sx={{ fontSize: 17 }} />}
            </IconButton>
          </Tooltip>
          <Avatar sx={{ width: 26, height: 26, bgcolor: user?.color || 'primary.main', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer' }}>
            {user?.name?.[0]}
          </Avatar>
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}>
            {user?.name}
          </Typography>
          <Tooltip title="Abmelden">
            <IconButton size="small" onClick={logout} sx={{ p: '4px', color: 'text.secondary' }}>
              <LogoutRoundedIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}

function Layout() {
  const theme = useTheme();
  return (
    <Box sx={{ display: 'flex', height: '100vh', flexDirection: 'column', overflow: 'hidden', background: theme.palette.background.default }}>
      <TopBar />
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
      <Route path="/kiosk" element={<KioskAutoLogin />} />
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/*" element={<RequireAuth><Layout /></RequireAuth>} />
    </Routes>
  );
}

