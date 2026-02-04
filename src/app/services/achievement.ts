import { Injectable, signal } from '@angular/core';

export interface Achievement {
  id: string;
  groupId: string; // Grouping for Tiers (e.g. "quest_chain")
  tier: number;    // 1, 2, 3...
  title: string;
  description: string;
  type: 'streak' | 'count' | 'collection';
  targetId?: string; // e.g., 'hammer'
  targetValue: number;
  currentValue: number;
  xpReward: number;
  completed: boolean;
  claimed: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AchievementService {
  private STORAGE_KEY = 'user_achievements_v1';

  // --- THE MASTER LIST (Definitions) ---
  private MASTER_ACHIEVEMENTS: Achievement[] = [
    // 1. QUEST COUNT CHAIN
    {
      id: 'quest_t1', groupId: 'quest_chain', tier: 1,
      title: 'First Steps', description: 'Complete your first quest',
      type: 'count', targetValue: 1, currentValue: 0, xpReward: 25, completed: false, claimed: false
    },
    {
      id: 'quest_t2', groupId: 'quest_chain', tier: 2,
      title: 'Getting Serious', description: 'Complete 5 total quests',
      type: 'count', targetValue: 5, currentValue: 0, xpReward: 50, completed: false, claimed: false
    },
    {
      id: 'quest_t3', groupId: 'quest_chain', tier: 3,
      title: 'Quest Master', description: 'Complete 10 total quests',
      type: 'count', targetValue: 10, currentValue: 0, xpReward: 150, completed: false, claimed: false
    },

    // 2. STREAK CHAIN
    {
      id: 'streak_t1', groupId: 'streak_chain', tier: 1,
      title: 'Consistency', description: 'Reach a 3-day streak',
      type: 'streak', targetValue: 3, currentValue: 0, xpReward: 50, completed: false, claimed: false
    },
    {
      id: 'streak_t2', groupId: 'streak_chain', tier: 2,
      title: 'Unstoppable', description: 'Reach a 7-day streak',
      type: 'streak', targetValue: 7, currentValue: 0, xpReward: 150, completed: false, claimed: false
    },

    // 3. COLLECTION CHAIN
    {
      id: 'coll_hammer', groupId: 'hammer_coll', tier: 1,
      title: 'Hammer Time', description: 'Collect 1 Hammer',
      type: 'collection', targetId: 'hammer', targetValue: 1, currentValue: 0, xpReward: 50, completed: false, claimed: false
    }
  ];

  // The User's actual progress
  private achievements: Achievement[] = [];

  public lastUnlocked = signal<Achievement | null>(null);

  constructor() {
    this.loadData();
  }

  // --- PUBLIC API ---

  getVisibleAchievements(): Achievement[] {
    const visible: Achievement[] = [];
    const groups = [...new Set(this.achievements.map(a => a.groupId))];

    groups.forEach(groupId => {
      // Get quests in group, sorted by tier
      const groupQuests = this.achievements
        .filter(a => a.groupId === groupId)
        .sort((a, b) => a.tier - b.tier);

      // Find first unclaimed one
      const active = groupQuests.find(a => !a.claimed);
      if (active) visible.push(active);
    });

    return visible;
  }

  getTrophyCase(): Achievement[] {
    return this.achievements.filter(a => a.claimed);
  }

  /**
   * Marks achievement as claimed and returns the XP Amount.
   * The Component is responsible for adding this XP to the Character.
   */
  claim(id: string): number {
    const ach = this.achievements.find(a => a.id === id);
    if (ach && ach.completed && !ach.claimed) {
      ach.claimed = true;
      this.saveData();
      return ach.xpReward;
    }
    return 0;
  }

  // --- PROGRESS UPDATES ---

notifyHabitComplete(currentHabitStreak: number) {
    let saveNeeded = false;

    // Helper logic
    const checkUpdate = (a: Achievement, newValue: number) => {
      // Only fire if it WASN'T complete, and NOW it is
      if (!a.completed && newValue >= a.targetValue) {
        a.currentValue = newValue;
        a.completed = true;

        // 2. UPDATE THE SIGNAL
        // This changes the state, triggering any effects watching it
        this.lastUnlocked.set(a);

        saveNeeded = true;
      } else if (!a.completed && newValue > a.currentValue) {
        a.currentValue = newValue;
        saveNeeded = true;
      }
    };

    // ... loop logic (keep existing loops) ...
    // Update Counts
    this.achievements.filter(a => a.type === 'count').forEach(a => {
      checkUpdate(a, a.currentValue + 1);
    });

    // Update Streaks
    this.achievements.filter(a => a.type === 'streak').forEach(a => {
      checkUpdate(a, currentHabitStreak);
    });

    if (saveNeeded) this.saveData();
  }

  notifyInventoryUpdate(items: any[]) {
    this.achievements.filter(a => a.type === 'collection' && !a.completed).forEach(a => {
      const found = items.find(i => i.id === a.targetId);
      if (found) {
        a.currentValue = found.quantity;
        if (a.currentValue >= a.targetValue) a.completed = true;
      }
    });
    this.saveData();
  }

  // --- PERSISTENCE ---

  private loadData() {
    const data = localStorage.getItem(this.STORAGE_KEY);

    if (data) {
      this.achievements = JSON.parse(data);
      // Merge new definitions if we added quests in code updates
      this.MASTER_ACHIEVEMENTS.forEach(master => {
        if (!this.achievements.find(a => a.id === master.id)) {
          this.achievements.push(master);
        }
      });
    } else {
      // First Load
      this.achievements = JSON.parse(JSON.stringify(this.MASTER_ACHIEVEMENTS));
      this.saveData();
    }
  }

  private saveData() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.achievements));
  }
}

