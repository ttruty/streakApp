import { Injectable } from '@angular/core';

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
          history: []
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
}
