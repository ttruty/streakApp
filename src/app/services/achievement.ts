import { Injectable, Injector, signal } from '@angular/core';
import { InventoryService } from './inventory';

export interface Achievement {
  id: string;
  groupId: string;
  tier: number;
  title: string;
  description: string;
  type: 'streak' | 'count' | 'collection';
  targetId?: string; // The item ID needed for collections
  targetValue: number;
  currentValue: number;
  xpReward: number;
  completed: boolean;
  claimed: boolean;
  isDynamic?: boolean; // Flag to identify auto-generated quests
}

@Injectable({
  providedIn: 'root'
})
export class AchievementService {
  private STORAGE_KEY = 'user_achievements_v2'; // Bumped version

  // Pool of items for Random Bounties
  // (Ideally, fetch these IDs from your InventoryService)
  private readonly ITEM_POOL = [
    'hammer', 'key', 'potion', 'shield', 'map', 'herb', 'skull'
  ];

  // --- THE MASTER LIST (Starting Points) ---
  private MASTER_ACHIEVEMENTS: Achievement[] = [
    // 1. QUEST COUNT CHAIN (Infinite)
    {
      id: 'quest_t1', groupId: 'quest_chain', tier: 1,
      title: 'First Steps', description: 'Complete your first habit',
      type: 'count', targetValue: 1, currentValue: 0, xpReward: 25, completed: false, claimed: false
    },

    // 2. STREAK CHAIN (Infinite)
    {
      id: 'streak_t1', groupId: 'streak_chain', tier: 1,
      title: 'Consistency', description: 'Reach a 3-day streak',
      type: 'streak', targetValue: 3, currentValue: 0, xpReward: 50, completed: false, claimed: false
    },

    // 3. BOUNTY BOARD (Infinite Random)
    {
      id: 'bounty_intro', groupId: 'bounty_board', tier: 1,
      title: 'Scavenger Hunt', description: 'Collect 1 Hammer',
      type: 'collection', targetId: 'hammer', targetValue: 1, currentValue: 0, xpReward: 30, completed: false, claimed: false
    }
  ];

  private achievements: Achievement[] = [];
  public lastUnlocked = signal<Achievement | null>(null);

  constructor(private injector: Injector) {
    this.loadData();
  }

  // --- PUBLIC API ---

  getVisibleAchievements(): Achievement[] {
    const visible: Achievement[] = [];
    // Get unique groups
    const groups = [...new Set(this.achievements.map(a => a.groupId))];

    groups.forEach(groupId => {
      // Get quests in group, sorted by tier
      const groupQuests = this.achievements
        .filter(a => a.groupId === groupId)
        .sort((a, b) => a.tier - b.tier);

      // Find first unclaimed one
      const active = groupQuests.find(a => !a.claimed);

      // Safety: If all are claimed (shouldn't happen with infinite logic, but just in case)
      // we don't show anything.
      if (active) visible.push(active);
    });

    return visible;
  }

  getTrophyCase(): Achievement[] {
    return this.achievements.filter(a => a.claimed).reverse(); // Newest first
  }

  /**
   * CLAIM LOGIC
   * 1. Mark Claimed
   * 2. Trigger Dynamic Generation (The Magic Step)
   * 3. Save & Return XP
   */
  // claim(id: string): number {
  //   const ach = this.achievements.find(a => a.id === id);

  //   if (ach && ach.completed && !ach.claimed) {
  //     ach.claimed = true;

  //     // --- TRIGGER DYNAMIC GENERATION ---
  //     this.generateNextStep(ach);

  //     this.saveData();
  //     return ach.xpReward;
  //   }
  //   return 0;
  // }

  claim(id: string): number {
    const ach = this.achievements.find(a => a.id === id);

    if (ach && ach.completed && !ach.claimed) {

      // --- NEW: REMOVE ITEMS IF COLLECTION ---
      if (ach.type === 'collection' && ach.targetId) {
        // Use Injector to get InventoryService lazily (prevents Circular Dependency errors)
        const inventoryService = this.injector.get(InventoryService);

        // Assume InventoryService has a removeItem(id, qty) method
        inventoryService.removeItem(ach.targetId, ach.targetValue);
      }

      ach.claimed = true;

      // --- TRIGGER DYNAMIC GENERATION ---
      this.generateNextStep(ach);

      this.saveData();
      return ach.xpReward;
    }
    return 0;
  }

  // --- DYNAMIC GENERATION LOGIC ---

  private generateNextStep(completedAch: Achievement) {

    // CASE 1: Infinite Scaling Chains (Streaks & Counts)
    if (completedAch.type === 'streak' || completedAch.type === 'count') {
      this.createScalingAchievement(completedAch);
    }

    // CASE 2: Random Bounty Board (Collections)
    else if (completedAch.groupId === 'bounty_board') {
      this.createRandomBounty(completedAch);
    }
  }

  /**
   * Generates the next tier mathematically (Target * 1.5, XP + 25)
   */
  private createScalingAchievement(prev: Achievement) {
    const nextTier = prev.tier + 1;

    // Calculate new target (e.g. 3 -> 5 -> 8 -> 12...)
    const newTarget = Math.ceil(prev.targetValue * 1.5);
    const newXp = prev.xpReward + 25; // Linear XP growth

    const newAch: Achievement = {
      id: `${prev.groupId}_t${nextTier}`, // e.g. streak_chain_t2
      groupId: prev.groupId,
      tier: nextTier,
      title: this.getDynamicTitle(prev.type, nextTier),
      description: `Reach ${newTarget} ${prev.type === 'streak' ? 'day streak' : 'total quests'}`,
      type: prev.type,
      targetValue: newTarget,
      currentValue: prev.type === 'count' ? prev.currentValue : 0, // Counts carry over, Streaks reset logic? Usually counts carry over.
      xpReward: newXp,
      completed: false,
      claimed: false,
      isDynamic: true
    };

    // For generic counts, the currentValue is already high (e.g. 10), so the new goal is 15.
    // For streaks, we usually want to check if the CURRENT streak satisfies the new one immediately.
    // But simplified, we just push it.
    this.achievements.push(newAch);
  }

  /**
   * Generates a random item collection quest
   */
  private createRandomBounty(prev: Achievement) {
    const nextTier = prev.tier + 1;

    // 1. Pick Random Item
    const randomItem = this.ITEM_POOL[Math.floor(Math.random() * this.ITEM_POOL.length)];

    // 2. Pick Random Amount (1 to 3) based on tier difficulty
    const amount = Math.floor(Math.random() * 3) + 1;

    // 3. Generate XP
    const newXp = 30 + (amount * 10);

    const newAch: Achievement = {
      id: `bounty_${Date.now()}`, // Unique ID based on time
      groupId: 'bounty_board',    // Keep them in the same group so they replace each other
      tier: nextTier,
      title: `Bounty: ${randomItem.toUpperCase()}`,
      description: `Collect ${amount} ${randomItem}(s)`,
      type: 'collection',
      targetId: randomItem,
      targetValue: amount,
      currentValue: 0, // Need to check inventory immediately? handled by notifyInventoryUpdate later
      xpReward: newXp,
      completed: false,
      claimed: false,
      isDynamic: true
    };

    this.achievements.push(newAch);
  }

  // Helper for fun titles
  private getDynamicTitle(type: string, tier: number): string {
    if (type === 'streak') {
      if (tier === 2) return 'Unstoppable';
      if (tier === 3) return 'On Fire';
      if (tier === 4) return 'Legendary Consistency';
      return `Streak Master ${tier}`;
    }
    if (type === 'count') {
      if (tier === 2) return 'Getting Serious';
      if (tier === 3) return 'Quest Master';
      if (tier === 4) return 'Habit Hero';
      return `Veteran Tier ${tier}`;
    }
    return `Tier ${tier}`;
  }


  // --- PROGRESS UPDATES (Unchanged) ---

  notifyHabitComplete(currentHabitStreak: number) {
    let saveNeeded = false;

    const checkUpdate = (a: Achievement, newValue: number) => {
      if (!a.completed && newValue >= a.targetValue) {
        a.currentValue = newValue;
        a.completed = true;
        this.lastUnlocked.set(a);
        saveNeeded = true;
      } else if (!a.completed && newValue > a.currentValue) {
        a.currentValue = newValue;
        saveNeeded = true;
      }
    };

    this.achievements.filter(a => a.type === 'count').forEach(a => {
      checkUpdate(a, a.currentValue + 1);
    });

    this.achievements.filter(a => a.type === 'streak').forEach(a => {
      checkUpdate(a, currentHabitStreak);
    });

    if (saveNeeded) this.saveData();
  }

  notifyInventoryUpdate(items: any[]) {
    // When inventory changes, check active collection quests
    let saveNeeded = false;

    console.log('Notifying inventory update for achievements. Current items:', items);
    this.achievements.filter(a => a.type === 'collection' && !a.completed).forEach(a => {
      const found = items.find(i => i.id.split('_')[0] === a.targetId);
      console.log(`Checking collection quest ${found}`);
      console.log(`Achievement ${a.targetId} requires ${a.targetValue}, player has ${found ? found.quantity : 0}`);

      if (found) {
        console.log(`Checking collection quest ${a.title}: found ${found.quantity} of ${a.targetValue} ${a.targetId}`);
        a.currentValue = found.quantity;
        if (a.currentValue >= a.targetValue) {
           a.completed = true;
           this.lastUnlocked.set(a);
        }
        saveNeeded = true;
      }
    });

    if (saveNeeded) this.saveData();
  }

  // --- PERSISTENCE ---

  private loadData() {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (data) {
      this.achievements = JSON.parse(data);
      // Ensure master quests exist (for new users or app updates)
      this.MASTER_ACHIEVEMENTS.forEach(master => {
        if (!this.achievements.find(a => a.id === master.id)) {
          this.achievements.push(master);
        }
      });
    } else {
      this.achievements = JSON.parse(JSON.stringify(this.MASTER_ACHIEVEMENTS));
      this.saveData();
    }
  }

  private saveData() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.achievements));
  }
}
