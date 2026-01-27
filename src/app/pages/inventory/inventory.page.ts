import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
  IonIcon, ActionSheetController, ToastController, IonButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  cubeOutline, cashOutline, flask, diamond, flame,
  trash, handLeft, pricetag
} from 'ionicons/icons';
import { ViewDidEnter } from '@ionic/angular/standalone';
import { Item, InventoryService } from 'src/app/services/inventory';

@Component({
  selector: 'app-inventory',
  templateUrl: './inventory.page.html',
  styleUrls: ['./inventory.page.scss'],
  standalone: true,
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonIcon]
})
export class InventoryPage implements ViewDidEnter {

  items: Item[] = [];
  gold: number = 0;

  constructor(
    private inventoryService: InventoryService,
    private actionSheetCtrl: ActionSheetController,
    private toastCtrl: ToastController
  ) {
    addIcons({ cubeOutline, cashOutline, flask, diamond, flame, trash, handLeft, pricetag });
  }

  ionViewDidEnter() {
    this.loadData();
  }

  loadData() {
    this.items = this.inventoryService.getInventory();
    this.gold = this.inventoryService.getGold();
  }

  async openItemOptions(item: Item) {
    const actionSheet = await this.actionSheetCtrl.create({
      header: item.name,
      subHeader: item.description,
      buttons: [
        {
          text: 'Use Item',
          icon: 'hand-left',
          handler: () => {
            this.useItem(item);
          }
        },
        {
          text: `Sell for ${item.sellValue}g`,
          icon: 'pricetag',
          handler: () => {
            this.sellItem(item);
          }
        },
        {
          text: 'Drop',
          icon: 'trash',
          role: 'destructive',
          handler: () => {
            this.inventoryService.removeItem(item.id, 1);
            this.loadData();
          }
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  async useItem(item: Item) {
    if (item.type !== 'consumable') {
      const toast = await this.toastCtrl.create({
        message: 'You cannot use this item right now.',
        duration: 2000,
        color: 'warning'
      });
      toast.present();
      return;
    }

    // Logic for "Using" (Just a toast for now)
    this.inventoryService.removeItem(item.id, 1);
    this.loadData();

    const toast = await this.toastCtrl.create({
      message: `Used ${item.name}! Effect Applied.`,
      duration: 2000,
      color: 'success'
    });
    toast.present();
  }

  async sellItem(item: Item) {
    this.inventoryService.removeItem(item.id, 1);
    this.inventoryService.addGold(item.sellValue);
    this.loadData();

    const toast = await this.toastCtrl.create({
      message: `Sold ${item.name} for ${item.sellValue}g`,
      duration: 2000,
      color: 'warning'
    });
    toast.present();
  }
}
