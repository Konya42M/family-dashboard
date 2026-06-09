export interface User {
  id: string;
  name: string;
  email: string;
  role: 'parent' | 'child';
  color: string;
  avatar?: string;
  birth_date?: string;
  allowance_rate?: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  all_day: number;
  category: string;
  user_id?: string;
  user_name?: string;
  user_color?: string;
  color?: string;
  recurrence_rule?: string;
}

export interface Todo {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  assigned_to?: string;
  assigned_name?: string;
  assigned_color?: string;
  created_by?: string;
  created_by_name?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'done';
  points: number;
}

export interface MealPlan {
  id: string;
  date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner';
  title: string;
  description?: string;
  recipe?: string;
}

export interface TimetableEntry {
  id: string;
  user_id: string;
  day_of_week: number;
  period: number;
  subject: string;
  teacher?: string;
  room?: string;
  start_time?: string;
  end_time?: string;
  is_cancelled: number;
  substitute_teacher?: string;
  note?: string;
}

export interface PrayerTimes {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  date: string;
  cityId?: string;
}

export interface TrafficInfo {
  duration_normal?: string;
  duration_traffic?: string;
  distance?: string;
  delay_seconds?: number;
  status?: 'green' | 'yellow' | 'red';
  error?: string;
}

export interface Departure {
  line: string;
  direction: string;
  type: 'tram' | 'bus' | 'other';
  planned: string;
  realtime: string;
  delay: number;
  platform?: string;
}

export interface Reward {
  id: string;
  title: string;
  description?: string;
  points_required: number;
  icon: string;
  active: number;
}

export interface PointTransaction {
  id: string;
  user_id: string;
  points: number;
  reason: string;
  created_at: string;
  created_by_name?: string;
}

export interface Settings {
  prayer_city_id: string;
  prayer_country_code: string;
  dad_work_address?: string;
  mom_work_address?: string;
  dad_work_origin?: string;
  mom_work_origin?: string;
  google_maps_api_key?: string;
  vvs_stop_id: string;
  vvs_stop_name: string;
  points_to_euro_rate: number;
  dark_mode: number;
  family_name: string;
}

