import { Injectable } from '@angular/core';

export interface DayStatus {
  name: string; // e.g., 'Sun', 'Mon'
  dateStr: string;
  visited: boolean;
  isToday: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class StreakService {
  private STORAGE_KEY = 'user_streak_data';

  constructor() {}

  // Main function called when app opens
  checkIn(): number {
    const today = new Date().toDateString(); // e.g., "Mon Jan 26 2026"
    const data = this.getData();

    // 1. If we already checked in today, just return current streak
    if (data.lastVisit === today) {
      return data.currentStreak;
    }

    // 2. Check if the last visit was yesterday (consecutive)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (data.lastVisit === yesterday.toDateString()) {
      data.currentStreak++;
    } else {
      // 3. Streak broken (or first time)
      data.currentStreak = 1;
    }

    // Save new state
    data.lastVisit = today;
    if (!data.history.includes(today)) {
      data.history.push(today);
    }

    this.saveData(data);
    return data.currentStreak;
  }

  // Generate the Sunday-Saturday data for the UI
  getCurrentWeekProgress(): DayStatus[] {
    const data = this.getData();
    const current = new Date();
    const week: DayStatus[] = [];

    // Calculate Sunday of the current week
    // getDay(): 0 = Sun, 1 = Mon ...
    const firstDayOfWeek = new Date(current.setDate(current.getDate() - current.getDay()));

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(firstDayOfWeek);
      dayDate.setDate(firstDayOfWeek.getDate() + i);
      const dateString = dayDate.toDateString();

      week.push({
        name: days[i],
        dateStr: dateString,
        visited: data.history.includes(dateString),
        isToday: dateString === new Date().toDateString()
      });
    }

    return week;
  }

  // --- Helpers for LocalStorage ---

  private getData() {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
    return {
      currentStreak: 0,
      lastVisit: null,
      history: [] // Array of date strings
    };
  }

  private saveData(data: any) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }
}
