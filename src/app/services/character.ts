import { Injectable } from '@angular/core';

export interface Loadout {
  baseModel?: string;  // URL to base GLB
  hat?: string;       // URL to hat GLB
  backpack?: string;  // URL to backpack GLB
  item?: string;      // URL to item GLB
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  type: 'streak' | 'count' | 'collection'; // What does it track?
  targetId?: string; // e.g., 'hammer' for collection
  targetValue: number; // e.g., 5 days, 10 quests
  currentValue: number;
  xpReward: number;
  completed: boolean;
  claimed: boolean; // Has user clicked "Claim"?
}

export interface CharacterStats {
  strength: number;
  intelligence: number;
  constitution: number;
  dexterity: number;
  charisma: number;
}

export interface CharacterState {
  level: number;
  currentXp: number;
  maxXp: number;
  stats: CharacterStats;
}

@Injectable({
  providedIn: 'root'
})
export class CharacterService {
  private currentLoadout: Loadout = {
    baseModel: 'assets/raider_male.glb',
    hat: undefined,
    backpack: undefined,
    item: undefined
  };

  private STORAGE_KEY = 'user_character_v1';
  private RAIDER_STORAGE_KEY = 'raider_loadout';

  // 1. The Master List of Possible Achievements
  // You can easily add more here later!
  private MASTER_ACHIEVEMENTS: Achievement[] = [
    {
      id: 'streak_3', title: 'Consistency is Key', description: 'Reach a 3-day streak on any habit',
      type: 'streak', targetValue: 3, currentValue: 0, xpReward: 50, completed: false, claimed: false
    },
    {
      id: 'streak_7', title: 'Unstoppable', description: 'Reach a 7-day streak on any habit',
      type: 'streak', targetValue: 7, currentValue: 0, xpReward: 150, completed: false, claimed: false
    },
    {
      id: 'quest_10', title: 'Busy Bee', description: 'Complete 10 total quests',
      type: 'count', targetValue: 10, currentValue: 0, xpReward: 100, completed: false, claimed: false
    },
    {
      id: 'collector_hammer', title: 'Hammer Time', description: 'Collect 3 Hammers',
      type: 'collection', targetId: 'hammer', targetValue: 3, currentValue: 0, xpReward: 200, completed: false, claimed: false
    }
  ];

 state: CharacterState = {
    level: 1,
    currentXp: 0,
    maxXp: 100,
    stats: {
      strength: 10,
      intelligence: 10,
      constitution: 10,
      dexterity: 10,
      charisma: 10
    }
  };

  achievements: Achievement[] = [];

  constructor() {
    this.loadData();
  }

  setLoadout(newLoadout: Loadout) {
    this.currentLoadout = newLoadout;
    this.saveRaiderToStorage();
  }

  private saveRaiderToStorage() {
    localStorage.setItem(this.RAIDER_STORAGE_KEY, JSON.stringify(this.currentLoadout));
  }

  private loadRaiderFromStorage() {
    const data = localStorage.getItem(this.RAIDER_STORAGE_KEY);
    if (data) {
      try {
        this.currentLoadout = JSON.parse(data);
      } catch (e) {
        console.error('Error parsing saved loadout', e);
      }
    }
  }

  getLoadout() {
    return this.currentLoadout;
  }

  // --- SAVE / LOAD ---
  private loadData() {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      this.state = parsed.state;
      this.achievements = parsed.achievements;

      // Merge new master achievements if they don't exist yet
      this.MASTER_ACHIEVEMENTS.forEach(master => {
        if (!this.achievements.find(a => a.id === master.id)) {
          this.achievements.push(master);
        }
      });
    } else {
      // First time setup
      this.achievements = [...this.MASTER_ACHIEVEMENTS];
      this.saveData();
    }
  }

  private saveData() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
      state: this.state,
      achievements: this.achievements
    }));
  }

  // --- XP SYSTEM ---
  addXp(amount: number) {
    this.state.currentXp += amount;
    this.checkLevelUp();
    this.saveData();
  }

  private checkLevelUp() {
    if (this.state.currentXp >= this.state.maxXp) {
      this.state.currentXp -= this.state.maxXp;
      this.state.level++;
      this.state.maxXp = Math.floor(this.state.maxXp * 1.5); // Harder each level
      // Recursively check in case we gained HUGE xp
      this.checkLevelUp();
    }
  }

  // --- EVENT LISTENERS (Call these from other services) ---

  // Call this when a habit is completed
  notifyHabitComplete(streak: number) {
    // 1. Update 'count' achievements
    this.achievements.filter(a => a.type === 'count' && !a.completed).forEach(a => {
      a.currentValue++;
      if (a.currentValue >= a.targetValue) a.completed = true;
    });

    // 2. Update 'streak' achievements (Only update if this streak is higher)
    this.achievements.filter(a => a.type === 'streak' && !a.completed).forEach(a => {
      if (streak > a.currentValue) {
        a.currentValue = streak;
        if (a.currentValue >= a.targetValue) a.completed = true;
      }
    });

    this.saveData();
  }

  // Call this when inventory changes
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

  // --- UI ACTIONS ---
  claimAchievement(id: string) {
    const ach = this.achievements.find(a => a.id === id);
    if (ach && ach.completed && !ach.claimed) {
      ach.claimed = true;
      this.addXp(ach.xpReward);
      this.saveData();
      return ach.xpReward;
    }
    return 0;
  }

  // Call this when habit is done (isPenalty = false) or missed (isPenalty = true)
  modifyStat(stat: keyof CharacterStats, difficulty: 'easy' | 'medium' | 'hard', isPenalty: boolean = false) {
    let amount = 0;

    // 1. Determine base value
    switch(difficulty) {
      case 'easy': amount = 0.1; break;   // Small incremental growth
      case 'medium': amount = 0.3; break;
      case 'hard': amount = 0.5; break;
    }

    // 2. Flip if penalty
    if (isPenalty) {
      amount = amount * -1; // Lose stats
    }

    // 3. Apply Update
    if (this.state.stats[stat] !== undefined) {
      this.state.stats[stat] = parseFloat((this.state.stats[stat] + amount).toFixed(1));

      // Cap stats so they don't go below 1
      if (this.state.stats[stat] < 1) this.state.stats[stat] = 1;

      this.saveData();
    }
  }
}
