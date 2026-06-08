# Familien-Dashboard API Dokumentation

Base URL: `http://localhost:3001/api`

Alle Endpunkte (außer `/auth/login`) erfordern: `Authorization: Bearer <JWT-Token>`

---

## Auth

### POST /auth/login
```json
{ "email": "papa@familie.local", "password": "family123" }
```
Response: `{ "token": "...", "user": { "id", "name", "email", "role", "color" } }`

### GET /auth/me
Gibt den aktuellen Benutzer zurück.

---

## Users

| Methode | Pfad | Zugriff | Beschreibung |
|---------|------|---------|--------------|
| GET | /users | Alle | Alle Benutzer |
| POST | /users | Eltern | Benutzer erstellen |
| PUT | /users/:id | Eltern | Benutzer bearbeiten |
| DELETE | /users/:id | Eltern | Benutzer löschen |
| GET | /users/:id/points | Alle | Punkte-Historie |

---

## Calendar

| Methode | Pfad | Parameter | Beschreibung |
|---------|------|-----------|--------------|
| GET | /calendar | ?start=ISO&end=ISO&userId= | Termine abrufen |
| POST | /calendar | Body: Event | Termin erstellen |
| PUT | /calendar/:id | Body: Event | Termin bearbeiten |
| DELETE | /calendar/:id | - | Termin löschen |
| POST | /calendar/sync-google | Body: {icalUrl} | Google Cal sync |

**Event Objekt:**
```json
{
  "title": "Zahnarzt",
  "start_time": "2026-06-10T10:00:00Z",
  "end_time": "2026-06-10T11:00:00Z",
  "all_day": false,
  "category": "appointment",
  "user_id": "uuid",
  "color": "#f44336"
}
```

---

## Todos

| Methode | Pfad | Beschreibung |
|---------|------|--------------|
| GET | /todos | Aufgaben (Kinder sehen nur eigene) |
| POST | /todos | Erstellen (Eltern) |
| PUT | /todos/:id | Bearbeiten / Status ändern |
| DELETE | /todos/:id | Löschen (Eltern) |

---

## Meals

| Methode | Pfad | Beschreibung |
|---------|------|--------------|
| GET | /meals | ?start=YYYY-MM-DD&end=YYYY-MM-DD |
| PUT | /meals/:date/:mealType | Mahlzeit setzen |
| DELETE | /meals/:date/:mealType | Mahlzeit löschen |
| GET | /meals/shopping-list | Einkaufsliste |
| POST | /meals/shopping-items | Item hinzufügen |
| PUT | /meals/shopping-items/:id/check | Als gekauft markieren |

---

## Points

| Methode | Pfad | Beschreibung |
|---------|------|--------------|
| POST | /points/award | Punkte vergeben/abziehen |
| GET | /points/leaderboard | Rangliste |
| GET | /points/rewards | Alle Belohnungen |
| POST | /points/rewards | Belohnung erstellen |
| POST | /points/redeem/:rewardId | Belohnung einlösen |
| GET | /points/allowance/:userId | Taschengeld-Historie |
| POST | /points/allowance/calculate | Monatliches Taschengeld berechnen |

---

## Timetable

| Methode | Pfad | Beschreibung |
|---------|------|--------------|
| GET | /timetable/:userId | Stundenplan abrufen |
| POST | /timetable/:userId | Stunde hinzufügen |
| PUT | /timetable/:entryId | Stunde bearbeiten |
| DELETE | /timetable/:entryId | Stunde löschen |

---

## Prayers

| Methode | Pfad | Beschreibung |
|---------|------|--------------|
| GET | /prayers | Heutige Gebetszeiten |
| GET | /prayers/cities?q=Stuttgart | Städtesuche |

---

## Traffic

| Methode | Pfad | Beschreibung |
|---------|------|--------------|
| GET | /traffic | Aktuelle Verkehrsinfo (Papa + Mama) |

---

## Transit

| Methode | Pfad | Beschreibung |
|---------|------|--------------|
| GET | /transit/departures | VVS Abfahrten |

---

## Settings

| Methode | Pfad | Beschreibung |
|---------|------|--------------|
| GET | /settings | Einstellungen lesen |
| PUT | /settings | Einstellungen speichern |

---

## Notifications

| Methode | Pfad | Beschreibung |
|---------|------|--------------|
| GET | /notifications/vapid-public-key | VAPID Public Key |
| POST | /notifications/subscribe | Push-Subscription registrieren |
| POST | /notifications/unsubscribe | Subscription löschen |

---

## Backup

| Methode | Pfad | Beschreibung |
|---------|------|--------------|
| GET | /backup/download | Datenbank als ZIP herunterladen |
