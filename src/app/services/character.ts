import { Injectable, signal, WritableSignal } from '@angular/core';
import { RewardModalComponent } from '../components/reward-modal/reward-modal.component';
import { InventoryService } from './inventory';
import { ToastController } from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular/standalone';

// --- Interfaces for our data ---
export interface GameAsset {
  id: string;
  name: string;
  modelUrl: string;
  thumbnail: string; // URL to an image
  scale?: number;     // Optional scale override
  offset?: [number, number, number]; // Optional position offset
  rotation?: [number, number, number]; // Optional rotation offset
}

export interface AssetCategory {
  id: 'base' | 'hat' | 'backpack' | 'item';
  label: string;
  icon: string; // Ionic icon name
}

export interface Loadout {
  base?: string;  // URL to base GLB
  hat?: string;       // URL to hat GLB
  backpack?: string;  // URL to backpack GLB
  item?: string;      // URL to item GLB
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

  public loadout = signal<any>(this.getInitialLoadout());
  readonly ASSET_LIBRARY = {
    base: [
      {
        id: 'male_raider',
        name: 'Male Raider',
        modelUrl: 'assets/raider_male.glb',
        thumbnail: 'assets/thumbs/male.png'
      },
      {
        id: 'female_raider',
        name: 'Female Raider',
        modelUrl: 'assets/raider_female.glb',
        thumbnail: 'assets/thumbs/female.png'
      }
    ],
    hat: [
      {
        id: 'cowboy',
        name: 'Cowboy Hat',
        modelUrl: 'assets/cowboy.glb',
        thumbnail: 'assets/thumbs/cowboy.png',
        scale: 0.15,
        offset: [0, 21, 0]
      },
      {
        id: 'tophat',
        name: 'Top Hat',
        modelUrl: 'assets/tophat.glb',
        thumbnail: 'assets/thumbs/tophat.png', // Ensure this image exists
        scale: 10,
        offset: [0, 24, 0]
      },
      {
        id: 'pirate',
        name: 'Pirate Hat',
        modelUrl: 'assets/pirate.glb',
        thumbnail: 'assets/thumbs/pirate.png', // Ensure this image exists
        scale: 4,
        offset: [0, 15, 0]
      },
      {
        id: 'propeller',
        name: 'Propeller Hat',
        modelUrl: 'assets/propeller.glb',
        thumbnail: 'assets/thumbs/propeller.png', // Ensure this image exists
        scale: 3,
        offset: [0, 14, 5]
      }
    ],
    backpack: [
      {
        id: 'jetpack',
        name: 'Jetpack',
        modelUrl: 'assets/jetpack.glb',
        thumbnail: 'assets/thumbs/jet.png',
        scale: 20,
        offset: [0, 0, -20],
        rotation: [0, Math.PI / 2, 0]
      },
      {
        id: 'rucksack',
        name: 'Survival Bag',
        modelUrl: 'assets/rucksack.glb',
        thumbnail: 'assets/thumbs/bag.png',
        scale: 50,
        offset: [0, 0, -10],
        rotation: [0, Math.PI, 0]
      },
      {
        id: 'trash',
        name: 'Trash Bag',
        modelUrl: 'assets/trash.glb',
        thumbnail: 'assets/thumbs/trash.png', // Ensure this image exists
        scale: 130,
        offset: [0, 0, -10],
        rotation: [0, Math.PI, 0]
      },
      {
        id: 'pack',
        name: 'Pack Bag',
        modelUrl: 'assets/pack.glb',
        thumbnail: 'assets/thumbs/pack.png', // Ensure this image exists
        scale: 20,
        offset: [0, 0, -10],
        rotation: [0, Math.PI, 0]
      }
    ],
    item: [
      {
        id: 'saber',
        name: 'Light Saber',
        modelUrl: 'assets/saber.glb',
        thumbnail: 'assets/thumbs/saber.png', // Ensure this image exists
        scale: 200,
        offset: [20, 10, 0],
        rotation: [0, 3*Math.PI/2, 0]
      },
      {
        id: 'sword',
        name: 'Katana',
        modelUrl: 'assets/sword.glb',
        thumbnail: 'assets/thumbs/katana.png',
        scale: 50,
        offset: [0, 10, 0],
        rotation: [0, 0, 3 * Math.PI / 2]
      },
      {
        id: 'culver',
        name: 'Ancient Saber',
        modelUrl: 'assets/culver.glb',
        thumbnail: 'assets/thumbs/culver.png', // Ensure this image exists
        scale: 100,
        offset: [0, 10, 0],
        rotation: [0, 0, 3 * Math.PI / 2]
      },
    ]
  };

  private currentLoadout: Loadout = {
    base: 'assets/raider_male.glb',
    hat: undefined,
    backpack: undefined,
    item: undefined
  };

  private STORAGE_KEY = 'user_character_v1';
  private RAIDER_STORAGE_KEY = 'raider_loadout';


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

  constructor(
        private modalCtrl: ModalController,
        private toastCtrl: ToastController,
        private inventoryService: InventoryService,
  ) {
    this.loadData();
  }

  private getInitialLoadout() {
    const data = localStorage.getItem(this.RAIDER_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  }

  // Helper to find full details by URL or ID
  getAssetDetails(category: string, identifier: string | GameAsset): GameAsset | undefined {
    // If identifier is already the object, return it
    if (typeof identifier === 'object' && identifier !== null) return identifier as GameAsset;

    // Otherwise search by ID or URL
    const list = (this.ASSET_LIBRARY as any)[category];
    return list.find((a: GameAsset) => a.id === identifier || a.modelUrl === identifier);
  }

  setLoadout(newLoadout: Loadout) {
    this.currentLoadout = newLoadout;
    this.saveRaiderToStorage();
    this.loadout.set({ ...newLoadout });

  }

  private saveRaiderToStorage() {
    localStorage.setItem(this.RAIDER_STORAGE_KEY, JSON.stringify(this.currentLoadout));
  }

  public loadRaiderFromStorage() {
    const data = localStorage.getItem(this.RAIDER_STORAGE_KEY);
    if (data) {
      try {
        this.currentLoadout = JSON.parse(data);
      } catch (e) {
        console.error('Error parsing saved loadout', e);
      }
    }
    return this.currentLoadout;
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
    } else {
      // First time setup
      this.saveData();
    }
  }

  private saveData() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
      state: this.state,
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

    async openReward() {
      // 1. Generate 1 to 5 random items from the inventory system
      const randomLoot = this.inventoryService.getRandomItems(1, 5);

      console.log('Generated Loot Pool:', randomLoot);

      const modal = await this.modalCtrl.create({
        component: RewardModalComponent,
        componentProps: {
          // Pass the dynamic list instead of the hardcoded rewardsPool
          possibleRewards: randomLoot
        },
        cssClass: 'my-custom-modal-css',
        backdropDismiss: false
      });

      await modal.present();

      const { data } = await modal.onDidDismiss();

      // 3. Handle Collection (actually add to inventory)
      if (data?.claimed && data?.reward) {
        console.log('User collected:', data.reward);

        // If the modal returns a specific chosen item, add it:
        this.inventoryService.addItem(data.reward);

        const toast = await this.toastCtrl.create({
          message: `Collected ${data.reward.name}!`,
          duration: 2000,
          color: 'success',
          position: 'top'
        });
        toast.present();
      }
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
