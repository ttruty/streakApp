import { Injectable } from '@angular/core';

export interface Item {
  id: string;
  name: string;
  icon: string;
  type: 'consumable' | 'equipment' | 'material';
  description: string;
  sellValue: number;
  rarity: 'common' | 'rare' | 'legendary';
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private STORAGE_KEY = 'user_inventory';
  private GOLD_KEY = 'user_gold';

  constructor() {}

  // --- GETTERS ---
  getInventory(): Item[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  getGold(): number {
    return parseInt(localStorage.getItem(this.GOLD_KEY) || '0', 10);
  }

  // --- ACTIONS ---

  // Add Gold
  addGold(amount: number) {
    const current = this.getGold();
    localStorage.setItem(this.GOLD_KEY, (current + amount).toString());
  }

  // Add Item (Stacks if exists)
  addItem(newItem: Item) {
    const items = this.getInventory();
    const existing = items.find(i => i.id === newItem.id);

    if (existing) {
      existing.quantity += newItem.quantity;
    } else {
      items.push(newItem);
    }
    this.saveInventory(items);
  }

  // Remove Item (Reduce quantity or delete)
  removeItem(itemId: string, amount: number = 1) {
    let items = this.getInventory();
    const index = items.findIndex(i => i.id === itemId);

    if (index > -1) {
      items[index].quantity -= amount;
      if (items[index].quantity <= 0) {
        items.splice(index, 1); // Remove completely
      }
      this.saveInventory(items);
    }
  }

  // Generate Loot based on Habit Tier
  generateLoot(tier: 'low' | 'medium' | 'high') {
    // 1. Always give some gold
    const goldReward = tier === 'high' ? 100 : tier === 'medium' ? 50 : 10;
    this.addGold(goldReward);

    // 2. Chance to get an item
    const roll = Math.random();
    let item: Item | null = null;

    if (roll > 0.5) { // 50% chance to get item
      if (tier === 'low') item = this.LOOT_TABLE.potion;
      if (tier === 'medium') item = this.LOOT_TABLE.gem;
      if (tier === 'high') item = this.LOOT_TABLE.sword;
    }

    if (item) {
      // Create a copy so we don't mess up reference
      this.addItem({ ...item, quantity: 1 });
      return { gold: goldReward, item: item.name };
    }

    return { gold: goldReward, item: null };
  }

  private saveInventory(items: Item[]) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
  }

  // NEW: Get a random batch of items (for the Reward Modal)
  getRandomItems(min: number, max: number): Item[] {
    const count = Math.floor(Math.random() * (max - min + 1)) + min;
    const items: Item[] = [];

    // Get all possible item keys (potion, gem, sword...)
    const keys = Object.keys(this.LOOT_TABLE);

    for (let i = 0; i < count; i++) {
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      // Create a copy of the item so we don't mess up the master list
      const itemCopy = { ...this.LOOT_TABLE[randomKey] };
      // Give it a unique random ID so duplicates (e.g. 2 potions) are distinct
      itemCopy.id = itemCopy.id + '_' + Math.random().toString(36).substr(2, 9);
      items.push(itemCopy);
    }
    return items;
  }

  // --- MOCK DATABASE OF ITEMS ---
  private LOOT_TABLE: any = {
    // --- ORIGINAL ---
    gold_coin: {
      id: 'gold_coin', name: 'Gold Coin', icon: 'cash-outline',
      type: 'material', description: 'Currency.', sellValue: 1, rarity: 'common', quantity: 1
    },
    diamond: {
      id: 'diamond', name: 'Diamond', icon: 'diamond-outline',
      type: 'material', description: 'Sparkling gem.', sellValue: 100, rarity: 'legendary', quantity: 1
    },
    potion: {
      id: 'potion', name: 'Potion', icon: 'flask-outline',
      type: 'consumable', description: 'Restores health.', sellValue: 15, rarity: 'rare', quantity: 1
    },
    shield: {
      id: 'shield', name: 'Shield', icon: 'shield-outline',
      type: 'equipment', description: 'Protection.', sellValue: 10, rarity: 'common', quantity: 1
    },

    // --- NEW ITEMS ---
    hammer: {
      id: 'hammer', name: 'Iron Hammer', icon: 'hammer-outline',
      type: 'equipment', description: 'Good for smashing.', sellValue: 20, rarity: 'common', quantity: 1
    },
    key: {
      id: 'key', name: 'Mystery Key', icon: 'key-outline',
      type: 'material', description: 'Opens something...', sellValue: 50, rarity: 'rare', quantity: 1
    },
    map: {
      id: 'map', name: 'Old Map', icon: 'map-outline',
      type: 'consumable', description: 'Reveals secrets.', sellValue: 5, rarity: 'common', quantity: 1
    },
    herb: {
      id: 'herb', name: 'Magic Herb', icon: 'leaf-outline',
      type: 'material', description: 'Medicinal plant.', sellValue: 2, rarity: 'common', quantity: 1
    },
    skull: {
      id: 'skull', name: 'Cursed Skull', icon: 'skull-outline',
      type: 'material', description: 'Spooky vibes.', sellValue: 200, rarity: 'legendary', quantity: 1
    }
  };
}
