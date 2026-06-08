import { useState, useEffect } from 'react';
import { Box, Typography, Stack, Card, CardContent, TextField, Button, Switch, FormControlLabel, Divider, Alert, Tabs, Tab, Select, MenuItem, FormControl, InputLabel, Avatar, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Chip } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import api from '../api/client';
import { Settings, User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useThemeMode } from '../contexts/ThemeContext';

export function SettingsPage() {
  const [settings, setSettings] = useState<Partial<Settings>>({});
  const [users, setUsers] = useState<User[]>([]);
  const [tab, setTab] = useState(0);
  const [saved, setSaved] = useState(false);
  const [userDialog, setUserDialog] = useState(false);
  const [userForm, setUserForm] = useState<any>({});
  const { isParent } = useAuth();
  const { darkMode, toggleDarkMode } = useThemeMode();

  useEffect(() => {
    api.get('/settings').then(r => setSettings(r.data)).catch(() => {});
    api.get('/users').then(r => setUsers(r.data)).catch(() => {});
  }, []);

  const handleSave = async () => {
    await api.put('/settings', { ...settings, dark_mode: darkMode ? 1 : 0 });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleAddUser = async () => {
    if (!userForm.name || !userForm.email || !userForm.password || !userForm.role) return;
    await api.post('/users', userForm);
    setUserDialog(false);
    setUserForm({});
    api.get('/users').then(r => setUsers(r.data)).catch(() => {});
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Benutzer wirklich löschen?')) return;
    await api.delete(`/users/${id}`);
    api.get('/users').then(r => setUsers(r.data)).catch(() => {});
  };

  if (!isParent) return (
    <Box sx={{ p: 3, textAlign: 'center' }}>
      <Typography variant="h6" color="text.secondary">Nur Eltern können Einstellungen ändern</Typography>
    </Box>
  );

  return (
    <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={700}>Einstellungen</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={() => window.open('/api/backup/download', '_blank')}>
            Backup
          </Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave}>Speichern</Button>
        </Stack>
      </Stack>

      {saved && <Alert severity="success" sx={{ mb: 2, borderRadius: 3 }}>Einstellungen gespeichert!</Alert>}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Allgemein" />
        <Tab label="Gebetszeiten" />
        <Tab label="Verkehr" />
        <Tab label="ÖPNV" />
        <Tab label="Benutzer" />
      </Tabs>

      {tab === 0 && (
        <Card sx={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <CardContent>
            <Stack spacing={3}>
              <TextField label="Familienname" value={settings.family_name || ''} onChange={e => setSettings(p => ({ ...p, family_name: e.target.value }))} fullWidth />
              <FormControlLabel control={<Switch checked={darkMode} onChange={toggleDarkMode} />} label="Dunkler Modus" />
              <TextField label="Punkte zu Euro (z.B. 0.01 = 100P = 1€)" type="number" value={settings.points_to_euro_rate || 0.01} onChange={e => setSettings(p => ({ ...p, points_to_euro_rate: Number(e.target.value) }))} fullWidth inputProps={{ step: '0.001', min: '0' }} />
            </Stack>
          </CardContent>
        </Card>
      )}

      {tab === 1 && (
        <Card sx={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <CardContent>
            <Stack spacing={3}>
              <Typography variant="body2" color="text.secondary">Stadt-ID von ezanvakti.emushaf.net (Standard: 9541 = Stuttgart)</Typography>
              <TextField label="Stadt-ID (Gebetszeiten)" value={settings.prayer_city_id || ''} onChange={e => setSettings(p => ({ ...p, prayer_city_id: e.target.value }))} fullWidth placeholder="9541" />
              <TextField label="Ländercode" value={settings.prayer_country_code || ''} onChange={e => setSettings(p => ({ ...p, prayer_country_code: e.target.value }))} fullWidth placeholder="TR" />
              <Alert severity="info" sx={{ borderRadius: 2 }}>Städte-Suche: API unter https://ezanvakti.emushaf.net/sehirler/2</Alert>
            </Stack>
          </CardContent>
        </Card>
      )}

      {tab === 2 && (
        <Card sx={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <CardContent>
            <Stack spacing={3}>
              <Alert severity="info" sx={{ borderRadius: 2 }}>Google Maps Distance Matrix API-Key erforderlich</Alert>
              <TextField label="Google Maps API-Key" value={settings.google_maps_api_key as any || ''} onChange={e => setSettings(p => ({ ...p, google_maps_api_key: e.target.value } as any))} fullWidth type="password" />
              <Divider />
              <Typography variant="subtitle2" fontWeight={700}>Papa</Typography>
              <TextField label="Startadresse Papa" value={settings.dad_work_origin || ''} onChange={e => setSettings(p => ({ ...p, dad_work_origin: e.target.value }))} fullWidth placeholder="Heimatstraße 1, Stuttgart" />
              <TextField label="Arbeitsadresse Papa" value={settings.dad_work_address || ''} onChange={e => setSettings(p => ({ ...p, dad_work_address: e.target.value }))} fullWidth placeholder="Firmenstraße 10, Stuttgart" />
              <Divider />
              <Typography variant="subtitle2" fontWeight={700}>Mama</Typography>
              <TextField label="Startadresse Mama" value={settings.mom_work_origin || ''} onChange={e => setSettings(p => ({ ...p, mom_work_origin: e.target.value }))} fullWidth />
              <TextField label="Arbeitsadresse Mama" value={settings.mom_work_address || ''} onChange={e => setSettings(p => ({ ...p, mom_work_address: e.target.value }))} fullWidth />
            </Stack>
          </CardContent>
        </Card>
      )}

      {tab === 3 && (
        <Card sx={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <CardContent>
            <Stack spacing={3}>
              <Alert severity="info" sx={{ borderRadius: 2 }}>VVS Haltestellen-ID aus dem VVS EFA-System. Standard: 5006118 (Stuttgart Hbf)</Alert>
              <TextField label="Haltestellen-ID (VVS)" value={settings.vvs_stop_id || ''} onChange={e => setSettings(p => ({ ...p, vvs_stop_id: e.target.value }))} fullWidth placeholder="5006118" />
              <TextField label="Haltestellen-Name (Anzeige)" value={settings.vvs_stop_name || ''} onChange={e => setSettings(p => ({ ...p, vvs_stop_name: e.target.value }))} fullWidth placeholder="Stuttgart Hauptbahnhof" />
            </Stack>
          </CardContent>
        </Card>
      )}

      {tab === 4 && (
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="flex-end">
            <Button variant="contained" startIcon={<AddIcon />} size="small" onClick={() => { setUserForm({ role: 'child', color: '#1976d2' }); setUserDialog(true); }}>
              Benutzer hinzufügen
            </Button>
          </Stack>
          {users.map(u => (
            <Card key={u.id} sx={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ bgcolor: u.color, fontWeight: 700 }}>{u.name[0]}</Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography fontWeight={600}>{u.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{u.email}</Typography>
                  </Box>
                  <Chip label={u.role === 'parent' ? 'Elternteil' : 'Kind'} size="small" color={u.role === 'parent' ? 'primary' : 'default'} />
                  {u.allowance_rate && <Chip label={`${u.allowance_rate * 100}P/€`} size="small" />}
                  <IconButton size="small" color="error" onClick={() => handleDeleteUser(u.id)}><DeleteIcon /></IconButton>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      <Dialog open={userDialog} onClose={() => setUserDialog(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4, background: '#131929' } }}>
        <DialogTitle>Benutzer hinzufügen</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField label="Name" value={userForm.name || ''} onChange={e => setUserForm((p: any) => ({ ...p, name: e.target.value }))} fullWidth required />
            <TextField label="E-Mail" type="email" value={userForm.email || ''} onChange={e => setUserForm((p: any) => ({ ...p, email: e.target.value }))} fullWidth required />
            <TextField label="Passwort" type="password" value={userForm.password || ''} onChange={e => setUserForm((p: any) => ({ ...p, password: e.target.value }))} fullWidth required />
            <FormControl fullWidth>
              <InputLabel>Rolle</InputLabel>
              <Select value={userForm.role || 'child'} onChange={e => setUserForm((p: any) => ({ ...p, role: e.target.value }))}>
                <MenuItem value="parent">Elternteil</MenuItem>
                <MenuItem value="child">Kind</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Farbe" type="color" value={userForm.color || '#1976d2'} onChange={e => setUserForm((p: any) => ({ ...p, color: e.target.value }))} fullWidth InputLabelProps={{ shrink: true }} />
            <TextField label="Geburtsdatum" type="date" value={userForm.birth_date || ''} onChange={e => setUserForm((p: any) => ({ ...p, birth_date: e.target.value }))} fullWidth InputLabelProps={{ shrink: true }} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setUserDialog(false)}>Abbrechen</Button>
          <Button variant="contained" onClick={handleAddUser}>Erstellen</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
