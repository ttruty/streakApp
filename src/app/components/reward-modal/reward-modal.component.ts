import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { Item, InventoryService } from 'src/app/services/inventory';
import { flame, checkmarkCircle, ellipseOutline, closeCircleOutline, diamondOutline, shieldOutline, flaskOutline, cashOutline, mapOutline, hammerOutline, keyOutline, leafOutline, skullOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';

interface GridSlot {
  item: Item | null; // null means empty slot
  isRevealed: boolean;
}

@Component({
  selector: 'app-reward-modal',
  templateUrl: './reward-modal.component.html',
  styleUrls: ['./reward-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class RewardModalComponent implements OnInit {
  @Input() possibleRewards: Item[] = [];

  gridSlots: GridSlot[] = [];
  collectedItems: Item[] = []; // Keep track of what we actually won
  animationComplete = false;

  constructor(
    private modalCtrl: ModalController,
    private inventoryService: InventoryService
  ) {
    addIcons({ flame, checkmarkCircle, ellipseOutline, closeCircleOutline, diamondOutline, shieldOutline, flaskOutline, cashOutline, mapOutline, hammerOutline, keyOutline,leafOutline,skullOutline,  });

  }

  ngOnInit() {
    this.initializeGrid();
    setTimeout(() => {
      this.startWipeAnimation();
    }, 500);
  }

  initializeGrid() {
  const gridSize = 9;

  // 1. Determine how many items to drop (e.g., Random between 1 and 5)
  const itemsToDropCount = Math.floor(Math.random() * 5) + 1;

  // 2. Select random items from the pool
  const selectedItems: Item[] = [];
  for (let i = 0; i < itemsToDropCount; i++) {
    const randomItem = this.possibleRewards[Math.floor(Math.random() * this.possibleRewards.length)];
    selectedItems.push({ ...randomItem });
  }
  this.collectedItems = selectedItems;

  // 3. Create the grid with NULLs (empty)
  let slots: (Item | null)[] = Array(gridSize).fill(null);

  // 4. Fill slots sequentially (Top-left to Bottom-right)
  // We simply loop through our selected items and place them in the slots array at matching indices.
  selectedItems.forEach((item, index) => {
    if (index < gridSize) {
      slots[index] = item;
    }
  });

  // 5. Map to GridSlot interface for the view
  this.gridSlots = slots.map(item => ({
    item: item,
    isRevealed: false
  }));
}

  startWipeAnimation() {
    let currentIndex = 0;

    // Safety: If for some reason there are 0 items, finish immediately
    if (this.collectedItems.length === 0) {
      this.finishAnimation();
      return;
    }

    const interval = setInterval(() => {
      // 1. Reveal the current slot
      this.gridSlots[currentIndex].isRevealed = true;
      currentIndex++;

      // 2. Stop condition:
      // Instead of gridSlots.length, we stop at collectedItems.length.
      // Since items are at the top, we stop exactly when we run out of rewards.
      if (currentIndex >= this.collectedItems.length) {
        clearInterval(interval);
        this.finishAnimation();
      }
    }, 150);
  }

  finishAnimation() {
    this.animationComplete = true;

    // Save ALL collected items to inventory
    // Ideally, update your service to accept an array,
    // but looping here works for now.
    this.collectedItems.forEach(item => {
      this.inventoryService.addItem(item);
    });
  }

  claimAndClose() {
    this.modalCtrl.dismiss({
      claimed: true,
      rewards: this.collectedItems
    });
  }
}
