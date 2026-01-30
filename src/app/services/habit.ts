import { Injectable } from '@angular/core';

// Add these types at the top
export type StatType = 'strength' | 'intelligence' | 'constitution' | 'dexterity' | 'charisma';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Habit {
  id: string;
  title: string;
  icon: string;
  type: 'regular' | 'random';
  frequency: string; // e.g., "daily", "weekly", "3x/week"
  reward: 'low' | 'medium' | 'high';
  completed: boolean;
  streak: number;
  history: HabitLog[];
  associatedStat: StatType;
  difficulty: Difficulty;
}

export interface HabitLog {
  date: string;
  mood: 'sad' | 'neutral' | 'happy';
}

@Injectable({
  providedIn: 'root'
})
export class HabitService {
  private STORAGE_KEY = 'user_habits';
  private DATE_KEY = 'last_habit_date'; // <--- NEW KEY

  constructor() { }

  getHabits(): Habit[] {
    const data = localStorage.getItem(this.STORAGE_KEY);

    // 1. If data exists, return it
    if (data) {
      return JSON.parse(data);
    }

    // 2. If NO data exists (First time user), create default
    else {
      const starterHabits: Habit[] = [
        {
          id: 'default_water',
          title: 'Drink Water',
          icon: 'water', // Make sure this matches your registered icons
          type: 'regular',
          frequency: 'daily',
          reward: 'low',
          completed: false,
          streak: 0,
          history: [],
          associatedStat: 'constitution',
          difficulty: 'medium'

        }
      ];

      // Save it immediately so it persists
      this.updateHabits(starterHabits);

      return starterHabits;
    }
  }

  addHabit(habit: Habit) {
    const habits = this.getHabits();
    habits.push(habit);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(habits));
  }

  deleteHabit(id: string) {
    let habits = this.getHabits();
    // Keep only the habits that DO NOT match the ID
    habits = habits.filter(h => h.id !== id);
    this.updateHabits(habits);
  }

  updateHabits(habits: Habit[]) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(habits));
  }

  completeHabit(id: string, mood: 'sad' | 'neutral' | 'happy') {
    const habits = this.getHabits();
    const habitIndex = habits.findIndex(h => h.id === id);

    if (habitIndex > -1) {
      // Update basic stats
      habits[habitIndex].completed = true;
      habits[habitIndex].streak++;

      // Add to history
      if (!habits[habitIndex].history) {
        habits[habitIndex].history = [];
      }
      habits[habitIndex].history.push({
        date: new Date().toISOString(),
        mood: mood
      });

      this.updateHabits(habits);
    }
  }

  uncompleteHabit(id: string) {
    const habits = this.getHabits();
    const habit = habits.find(h => h.id === id);
    if (habit) {
      habit.completed = false;
      if (habit.streak > 0) habit.streak--;
      // Optionally remove last history entry
      this.updateHabits(habits);
    }
  }

  checkDateAndReset() {
    const todayStr = new Date().toDateString(); // e.g., "Fri Jan 30 2026"
    const lastDateStr = localStorage.getItem(this.DATE_KEY);

    // If it's the same day, do nothing
    if (lastDateStr === todayStr) {
      return;
    }

    // IT IS A NEW DAY!
    console.log('New Day Detected! Resetting habits...');

    const habits = this.getHabits();
    const wasYesterday = this.isYesterday(lastDateStr);

    habits.forEach(habit => {
      // 1. Handle Streaks
      if (habit.frequency === 'daily') {
        if (habit.completed && wasYesterday) {
           // They did it yesterday! Streak continues.
           // (We don't change streak number here, it stays high)
        } else if (!habit.completed) {
           // They missed it yesterday (or longer)! Reset streak.
           habit.streak = 0;
        }
        // Note: If they opened the app after a week, 'wasYesterday' is false,
        // so streaks automatically reset to 0. Correct.
      }

      // 2. Reset Completion for the new day
      habit.completed = false;
    });

    // 3. Save everything
    this.updateHabits(habits);
    localStorage.setItem(this.DATE_KEY, todayStr);
  }

  // Helper to check if the date string was exactly yesterday
  private isYesterday(dateStr: string | null): boolean {
    if (!dateStr) return false;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    return yesterday.toDateString() === dateStr;
  }
}
