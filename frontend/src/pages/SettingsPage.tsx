import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Stack, Card, CardContent, TextField, Button, Switch, FormControlLabel, Divider, Alert, Tabs, Tab, Select, MenuItem, FormControl, InputLabel, Avatar, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Chip, useTheme } from '@mui/material';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import DashboardCustomizeRoundedIcon from '@mui/icons-material/DashboardCustomizeRounded';
import api from '../api/client';
import { Settings, User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useThemeMode } from '../contexts/ThemeContext';
import { WIDGET_REGISTRY, loadEnabled, saveEnabled, loadLayout, saveLayout, DEFAULT_LAYOUT, DEFAULT_ENABLED, WidgetId } from '../widgets/widgetRegistry';

const W_ACCENT: Record<WidgetId, string> = {
  clock: '#5b8dee', prayer: '#f5a623', weather: '#06b6d4',
  transit: '#3ecf8e', today: '#f56565', todos: '#a855f7',
  points: '#f5a623', traffic: '#ef4444',
};

function SectionCard({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <Card sx={{ background: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}` }}>
      <CardContent sx={{ p: 2.5 }}>{children}</CardContent>
    </Card>
  );
}

export function SettingsPage() {
  const [settings, setSettings] = useState<Partial<Settings>>({});
  const [users, setUsers] = useState<User[]>([]);
  const [tab, setTab] = useState(0);
  const [saved, setSaved] = useState(false);
  const [userDialog, setUserDialog] = useState(false);
  const [userForm, setUserForm] = useState<any>({ role: 'child', color: '#3ecf8e' });
  const [enabledWidgets, setEnabledWidgets] = useState<WidgetId[]>(() => loadEnabled());
  const { isParent } = useAuth();
  const { darkMode, toggleDarkMode } = useThemeMode();
  const theme = useTheme();

  const [destinations, setDestinations] = useState<any[]>([]);
  const [newDest, setNewDest] = useState({ name: '', origin: '', destination: '', icon: '📍' });
  const [destSaving, setDestSaving] = useState(false);

  const loadDestinations = useCallback(async () => {
    try {
      const res = await api.get('/traffic/destinations');
      setDestinations(res.data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadDestinations(); }, [loadDestinations]);

  const addDestination = async () => {
    if (!newDest.name.trim() || !newDest.origin.trim() || !newDest.destination.trim()) return;
    setDestSaving(true);
    try {
      await api.post('/traffic/destinations', newDest);
      await loadDestinations();
      setNewDest({ name: '', origin: '', destination: '', icon: '📍' });
    } finally {
      setDestSaving(false);
    }
  };

  const deleteDestination = async (id: string, name: string) => {
    if (!confirm(`Ziel "${name}" wirklich löschen?`)) return;
    try {
      await api.delete(`/traffic/destinations/${id}`);
      await loadDestinations();
    } catch {
      alert('Fehler beim Löschen. Bitte erneut versuchen.');
    }
  };

  useEffect(() => {
    api.get('/settings').then(r => setSettings(r.data)).catch(() => {});
    api.get('/users').then(r => setUsers(r.data)).catch(() => {});
  }, []);

  const handleSave = async () => {
    await api.put('/settings', { ...settings, dark_mode: darkMode ? 1 : 0 });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const toggleWidget = (id: WidgetId) => {
    setEnabledWidgets(prev => {
      const next = prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id];
      saveEnabled(next);
      // Ensure layout entry exists when enabling
      if (!prev.includes(id)) {
        const layout = loadLayout();
        if (!layout.find(l => l.i === id)) {
          const def = WIDGET_REGISTRY.find(w => w.id === id)!;
          saveLayout([...layout, { i: id, x: 0, y: 999, w: def.defaultW, h: def.defaultH }]);
        }
      }
      return next;
    });
  };

  const resetDashboard = () => {
    saveLayout(DEFAULT_LAYOUT);
    saveEnabled(DEFAULT_ENABLED);
    setEnabledWidgets(DEFAULT_ENABLED);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAddUser = async () => {
    if (!userForm.name || !userForm.email || !userForm.password || !userForm.role) return;
    await api.post('/users', userForm);
    setUserDialog(false);
    setUserForm({ role: 'child', color: '#3ecf8e' });
    api.get('/users').then(r => setUsers(r.data)).catch(() => {});
  };

  if (!isParent) return (
    <Box sx={{ p: 3, textAlign: 'center' }}>
      <Typography variant="h6" color="text.secondary">Nur Eltern können Einstellungen ändern</Typography>
    </Box>
  );

  const TABS = ['Allgemein', 'Widgets', 'Gebete', 'Verkehr', 'ÖPNV', 'Benutzer', 'Verkehrsziele'];

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: theme.palette.background.default }}>
      <Box sx={{ p: { xs: 1.5, sm: 2 }, pb: 0, flexShrink: 0 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
          <Typography variant="h5" fontWeight={800}>Einstellungen</Typography>
          <Stack direction="row" spacing={1}>
            <Button size="small" variant="outlined" startIcon={<DownloadRoundedIcon sx={{ fontSize: 16 }} />}
              onClick={() => window.open('/api/backup/download', '_blank')} sx={{ fontSize: '0.72rem' }}>
              Backup
            </Button>
            <Button size="small" variant="contained" startIcon={<SaveRoundedIcon sx={{ fontSize: 16 }} />}
              onClick={handleSave} sx={{ fontSize: '0.72rem' }}>
              Speichern
            </Button>
          </Stack>
        </Stack>

        {saved && <Alert severity="success" sx={{ mb: 1.5, borderRadius: 2, py: 0.5 }}>Gespeichert!</Alert>}

        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          orientation="horizontal"
          sx={{
            borderBottom: '1px solid',
            borderColor: 'divider',
            mb: 0,
            '& .MuiTab-root': {
              fontSize: '0.78rem',
              minHeight: 40,
              py: 0.5,
              fontWeight: 700,
              fontFamily: 'inherit',
            },
            flexShrink: 0,
          }}
        >
          {TABS.map(t => <Tab key={t} label={t} />)}
        </Tabs>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', p: { xs: 1.5, sm: 2 } }}>

      {/* ── Tab 0: Allgemein ── */}
      {tab === 0 && (
        <SectionCard>
          <Stack spacing={2.5}>
            <TextField label="Familienname" value={settings.family_name || ''} onChange={e => setSettings(p => ({ ...p, family_name: e.target.value }))} fullWidth size="small" />
            <FormControlLabel control={<Switch checked={darkMode} onChange={toggleDarkMode} size="small" />} label={<Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>Dunkler Modus</Typography>} />
            <TextField label="Punkte → Euro Rate (0.01 = 100P = 1€)" type="number" size="small"
              value={settings.points_to_euro_rate || 0.01}
              onChange={e => setSettings(p => ({ ...p, points_to_euro_rate: Number(e.target.value) }))}
              fullWidth inputProps={{ step: '0.001', min: '0' }} />
          </Stack>
        </SectionCard>
      )}

      {/* ── Tab 1: Widgets ── */}
      {tab === 1 && (
        <Stack spacing={1.5}>
          <SectionCard>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <DashboardCustomizeRoundedIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                <Typography fontWeight={700}>Dashboard-Widgets</Typography>
              </Stack>
              <Button size="small" variant="outlined" onClick={resetDashboard} sx={{ fontSize: '0.68rem' }}>Layout zurücksetzen</Button>
            </Stack>
            <Typography variant="body2" color="text.secondary" mb={1.5}>
              Aktiviere oder deaktiviere Widgets. Layout per Drag &amp; Drop auf der Startseite anpassen (Stift-Symbol).
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
              {WIDGET_REGISTRY.map(def => {
                const active = enabledWidgets.includes(def.id);
                const accent = W_ACCENT[def.id];
                return (
                  <Box key={def.id} onClick={() => toggleWidget(def.id)} sx={{
                    display: 'flex', alignItems: 'center', gap: 1.2, p: '10px 12px', borderRadius: 2,
                    background: active ? `${accent}15` : (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'),
                    border: active ? `1.5px solid ${accent}45` : `1px solid ${theme.palette.divider}`,
                    cursor: 'pointer', transition: 'all 0.15s',
                    '&:active': { transform: 'scale(0.98)' },
                  }}>
                    <Typography sx={{ fontSize: '1.3rem', lineHeight: 1 }}>{def.icon}</Typography>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: active ? accent : 'text.primary', lineHeight: 1.2 }}>{def.label}</Typography>
                      <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary', lineHeight: 1.3 }}>{def.description}</Typography>
                    </Box>
                    <Switch size="small" checked={active} onChange={() => toggleWidget(def.id)} onClick={e => e.stopPropagation()}
                      sx={{ '& .MuiSwitch-thumb': { background: active ? accent : undefined } }} />
                  </Box>
                );
              })}
            </Box>
          </SectionCard>
        </Stack>
      )}

      {/* ── Tab 2: Gebete ── */}
      {tab === 2 && (
        <SectionCard>
          <Stack spacing={2.5}>
            <Alert severity="info" sx={{ borderRadius: 2, py: 0.5 }}>
              Stuttgart ist voreingestellt (IlceID 11027 · Baden-Württemberg). Nur ändern wenn du eine andere Stadt möchtest.
            </Alert>
            <TextField label="Stadt-ID (ezanvakti IlceID)" size="small"
              value={settings.prayer_city_id || ''}
              onChange={e => setSettings(p => ({ ...p, prayer_city_id: e.target.value }))}
              fullWidth helperText="Stuttgart = 11027, Köln = z.B. 11105" />
          </Stack>
        </SectionCard>
      )}

      {/* ── Tab 3: Verkehr ── */}
      {tab === 3 && (
        <SectionCard>
          <Stack spacing={2.5}>
            <Alert severity="info" sx={{ borderRadius: 2, py: 0.5 }}>Google Maps Distance Matrix API-Key erforderlich für Stau-Widget.</Alert>
            <TextField label="Google Maps API-Key" size="small"
              value={(settings as any).google_maps_api_key || ''}
              onChange={e => setSettings(p => ({ ...p, google_maps_api_key: e.target.value } as any))}
              fullWidth type="password" />
            <Divider />
            <Typography fontWeight={700} sx={{ fontSize: '0.9rem' }}>Papa</Typography>
            <TextField label="Heimatadresse Papa" size="small" value={settings.dad_work_origin || ''}
              onChange={e => setSettings(p => ({ ...p, dad_work_origin: e.target.value }))} fullWidth placeholder="Bernsteinstraße 172, Stuttgart" />
            <TextField label="Arbeitsadresse Papa" size="small" value={settings.dad_work_address || ''}
              onChange={e => setSettings(p => ({ ...p, dad_work_address: e.target.value }))} fullWidth placeholder="Firmenstraße 10, Stuttgart" />
            <Divider />
            <Typography fontWeight={700} sx={{ fontSize: '0.9rem' }}>Mama</Typography>
            <TextField label="Heimatadresse Mama" size="small" value={settings.mom_work_origin || ''}
              onChange={e => setSettings(p => ({ ...p, mom_work_origin: e.target.value }))} fullWidth />
            <TextField label="Arbeitsadresse Mama" size="small" value={settings.mom_work_address || ''}
              onChange={e => setSettings(p => ({ ...p, mom_work_address: e.target.value }))} fullWidth />
          </Stack>
        </SectionCard>
      )}

      {/* ── Tab 4: ÖPNV ── */}
      {tab === 4 && (
        <SectionCard>
          <Stack spacing={2.5}>
            <Alert severity="success" sx={{ borderRadius: 2, py: 0.5 }}>
              Aktuell: Bernsteinstraße (ID 5006137) — 2 Min. Fußweg
            </Alert>
            <TextField label="VVS Haltestellen-ID" size="small"
              value={settings.vvs_stop_id || '5006137'}
              onChange={e => setSettings(p => ({ ...p, vvs_stop_id: e.target.value }))} fullWidth
              helperText="Bernsteinstraße=5006137, Hbf=5006118" />
            <TextField label="Haltestellen-Name (Anzeige)" size="small"
              value={settings.vvs_stop_name || 'Bernsteinstraße'}
              onChange={e => setSettings(p => ({ ...p, vvs_stop_name: e.target.value }))} fullWidth />
          </Stack>
        </SectionCard>
      )}

      {/* ── Tab 5: Benutzer ── */}
      {tab === 5 && (
        <Stack spacing={1.5}>
          <Stack direction="row" justifyContent="flex-end">
            <Button variant="contained" size="small" startIcon={<AddRoundedIcon />}
              onClick={() => { setUserForm({ role: 'child', color: '#3ecf8e' }); setUserDialog(true); }}>
              Benutzer hinzufügen
            </Button>
          </Stack>
          {users.map(u => (
            <SectionCard key={u.id}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: u.color, fontWeight: 800, width: 40, height: 40 }}>{u.name[0]}</Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography fontWeight={700}>{u.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{u.email}</Typography>
                </Box>
                <Chip label={u.role === 'parent' ? '👨‍👩 Eltern' : '👦 Kind'} size="small"
                  sx={{ fontWeight: 700, fontSize: '0.68rem', bgcolor: u.role === 'parent' ? 'rgba(91,141,238,0.15)' : 'rgba(62,207,142,0.15)', color: u.role === 'parent' ? 'primary.main' : 'success.main' }} />
                <IconButton size="small" color="error" onClick={async () => { if (confirm('Wirklich löschen?')) { await api.delete(`/users/${u.id}`); api.get('/users').then(r => setUsers(r.data)); } }}>
                  <DeleteRoundedIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Stack>
            </SectionCard>
          ))}
        </Stack>
      )}

      {/* ── Tab 6: Verkehrsziele ── */}
      {tab === 6 && (
        <Stack spacing={1.5}>
          <SectionCard>
            <Stack spacing={2}>
              <Typography variant="h6">Verkehrsziele verwalten</Typography>
              <Typography variant="body2" color="text.secondary">
                Ziele für das Verkehrs-Widget. Google Maps API-Key wird unter "Verkehr" konfiguriert.
              </Typography>

              {destinations.map((d: any) => (
                <Box key={d.id} sx={{
                  display: 'flex', alignItems: 'center', gap: 1,
                  p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2,
                }}>
                  <Typography sx={{ fontSize: '1.2rem' }}>{d.icon}</Typography>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>{d.name}</Typography>
                    <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>
                      {d.origin} → {d.destination}
                    </Typography>
                  </Box>
                  <IconButton size="small" color="error" onClick={() => deleteDestination(d.id, d.name)}>
                    <DeleteRoundedIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Box>
              ))}

              <Box sx={{ pt: 1, borderTop: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="subtitle2">Neues Ziel hinzufügen</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField size="small" label="Icon (Emoji)" value={newDest.icon}
                    onChange={e => setNewDest(d => ({ ...d, icon: e.target.value }))} sx={{ width: 80 }} />
                  <TextField size="small" label="Name" value={newDest.name} sx={{ flex: 1 }}
                    onChange={e => setNewDest(d => ({ ...d, name: e.target.value }))} />
                </Box>
                <TextField size="small" label="Startadresse (z.B. 73760 Ostfildern)" value={newDest.origin}
                  onChange={e => setNewDest(d => ({ ...d, origin: e.target.value }))} />
                <TextField size="small" label="Zieladresse (z.B. Stuttgart Hauptbahnhof)" value={newDest.destination}
                  onChange={e => setNewDest(d => ({ ...d, destination: e.target.value }))} />
                <Button variant="contained" onClick={addDestination} disabled={destSaving}
                  sx={{ alignSelf: 'flex-start' }}>
                  {destSaving ? 'Wird gespeichert…' : 'Ziel hinzufügen'}
                </Button>
              </Box>
            </Stack>
          </SectionCard>
        </Stack>
      )}

      {/* Add User Dialog */}
      <Dialog open={userDialog} onClose={() => setUserDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Benutzer hinzufügen</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField label="Name" size="small" value={userForm.name || ''} onChange={e => setUserForm((p: any) => ({ ...p, name: e.target.value }))} fullWidth required />
            <TextField label="E-Mail" type="email" size="small" value={userForm.email || ''} onChange={e => setUserForm((p: any) => ({ ...p, email: e.target.value }))} fullWidth required />
            <TextField label="Passwort" type="password" size="small" value={userForm.password || ''} onChange={e => setUserForm((p: any) => ({ ...p, password: e.target.value }))} fullWidth required />
            <FormControl fullWidth size="small">
              <InputLabel>Rolle</InputLabel>
              <Select value={userForm.role || 'child'} onChange={e => setUserForm((p: any) => ({ ...p, role: e.target.value }))}>
                <MenuItem value="parent">Elternteil</MenuItem>
                <MenuItem value="child">Kind</MenuItem>
              </Select>
            </FormControl>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <TextField label="Farbe" type="color" size="small" value={userForm.color || '#3ecf8e'} onChange={e => setUserForm((p: any) => ({ ...p, color: e.target.value }))} sx={{ width: 80 }} InputLabelProps={{ shrink: true }} />
              <TextField label="Geburtsdatum" type="date" size="small" value={userForm.birth_date || ''} onChange={e => setUserForm((p: any) => ({ ...p, birth_date: e.target.value }))} fullWidth InputLabelProps={{ shrink: true }} />
            </Stack>
            {userForm.role === 'child' && (
              <TextField label="Taschengeld-Rate (Punkte/€)" type="number" size="small"
                value={userForm.allowance_rate || 0.01}
                onChange={e => setUserForm((p: any) => ({ ...p, allowance_rate: Number(e.target.value) }))}
                fullWidth inputProps={{ step: '0.001', min: '0' }} />
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setUserDialog(false)}>Abbrechen</Button>
          <Button variant="contained" onClick={handleAddUser}>Erstellen</Button>
        </DialogActions>
      </Dialog>
      </Box>
    </Box>
  );
}
