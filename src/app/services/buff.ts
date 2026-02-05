import { Injectable, signal } from '@angular/core';

export interface Buff {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'buff' | 'debuff' | 'challenge' | 'tradeoff';
  xpMultiplier: number;   // e.g. 1.5 = +50% XP
  statMultiplier: number; // e.g. 0.5 = -50% Stats
}

@Injectable({
  providedIn: 'root'
})
export class BuffService {

  // The currently active daily buff (default null)
  activeBuff = signal<Buff | null>(null);

  readonly AVAILABLE_BUFFS: Buff[] = [
    {
      id: 'coffee_rush',
      name: 'Caffeine Rush',
      description: 'You are wired! Gain more Stats, but learn less (XP).',
      icon: 'cafe',
      type: 'tradeoff',
      xpMultiplier: 0.8,
      statMultiplier: 1.5
    },
    {
      id: 'scholar',
      name: 'Scholar\'s Focus',
      description: 'Deep focus mode. Double XP, but physical Stats grow slowly.',
      icon: 'book',
      type: 'tradeoff',
      xpMultiplier: 2.0,
      statMultiplier: 0.5
    },
    {
      id: 'rest_day',
      name: 'Rest Day',
      description: 'Take it easy. Rewards are lowered, but relaxing is good.',
      icon: 'bed',
      type: 'debuff',
      xpMultiplier: 0.5,
      statMultiplier: 0.5
    },
    {
      id: 'hardcore',
      name: 'Hardcore Mode',
      description: 'High risk, High reward. Everything is boosted!',
      icon: 'flame',
      type: 'challenge',
      xpMultiplier: 1.5,
      statMultiplier: 1.5
    }
  ];

  constructor() {
    this.loadDailyBuff();
  }

  activateBuff(buff: Buff | null) {
    this.activeBuff.set(buff);
    if (buff) {
      localStorage.setItem('daily_buff', JSON.stringify(buff));
    } else {
      localStorage.removeItem('daily_buff');
    }
  }

  // Hook this into your HabitService's "checkDateAndReset" to clear buffs at midnight
  resetDaily() {
    this.activeBuff.set(null);
    localStorage.removeItem('daily_buff');
  }

  private loadDailyBuff() {
    const data = localStorage.getItem('daily_buff');
    if (data) {
      this.activeBuff.set(JSON.parse(data));
    }
  }
}
