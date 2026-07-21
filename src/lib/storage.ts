export interface Group {
  id: string;
  name: string;
  avatar?: string; // base64 data URL
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  groupId: string;
  title: string;
  date: string;    // YYYY-MM-DD (start)
  endDate?: string; // YYYY-MM-DD (end, inclusive — omit for single-day)
  time: string;
  location: string;
  description: string;
  locked: boolean;
  createdAt: string;
}

export interface Snap {
  id: string;
  eventId: string;
  dataUrl: string;
  addedAt: string;
}

const G = 'seeyou-groups-v1';
const E = 'seeyou-events-v1';
const S = 'seeyou-snaps-v1';

function load<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}

function persist<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

export const storage = {
  getGroups: ()             => load<Group>(G),
  saveGroups: (v: Group[])  => persist(G, v),

  getEvents: ()                   => load<CalendarEvent>(E),
  saveEvents: (v: CalendarEvent[]) => persist(E, v),

  getSnaps: ()            => load<Snap>(S),
  saveSnaps: (v: Snap[])  => persist(S, v),
};
