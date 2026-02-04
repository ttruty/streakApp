import { Component, ElementRef, ViewChild, OnDestroy, AfterViewInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons,
  IonMenuButton, IonButton, IonIcon, IonList, IonItem,
  IonLabel, IonCheckbox,
  IonItemSliding, IonItemOptions, IonItemOption, AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { settingsOutline, flame } from 'ionicons/icons';

// // Three.js Imports
// import * as THREE from 'three';
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { InventoryService } from 'src/app/services/inventory';
import { ToastController } from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular/standalone';
import { Habit, HabitService } from 'src/app/services/habit';
import {
  accessibility, alarm, barbell, basket, bed, beer, bicycle, book,
  briefcase, cafe, camera, car, cart, chatbubble, clipboard, colorPalette,
  desktop, fastFood, fitness, flask, gameController, hammer, heart,
  hourglass, key, library, mail, map, medkit, mic, moon, musicalNotes,
  paw, pencil, people, pizza, planet, restaurant, rocket, rose, school,
  shapes, shirt, skull, sparkles, star, storefront, sunny, terminal,
  thumbsUp, timer, trash, trophy, tv, umbrella, videocam, walk, wallet,
  water, wifi, wine
} from 'ionicons/icons';
import { CompletionModalComponent } from '../../components/completion-modal/completion-modal.component';
import { CharacterService } from 'src/app/services/character';
import { CharacterModelComponent } from 'src/app/components/character-model/character-model.component';
import { HabitDetailModalComponent } from 'src/app/components/habit-detail-modal/habit-detail-modal.component';
import { SoundService } from 'src/app/services/sound';
import { Router } from '@angular/router';
import { SettingsPage } from '../settings/settings.page';
import { AchievementService } from 'src/app/services/achievement';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CharacterModelComponent,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons,
    IonMenuButton, IonButton, IonIcon, IonList, IonItem,
    IonLabel, IonCheckbox, IonItemSliding, IonItemOptions, IonItemOption
  ]
})
export class DashboardPage {

  habits: Habit[] = []; // Change to use Habit interface

  constructor(
    private modalCtrl: ModalController,
    private habitService: HabitService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    public charService: CharacterService,
    private soundService: SoundService,
    private achService: AchievementService,
    private router: Router
  ) {
    addIcons({ settingsOutline });
    addIcons({
      water, barbell, book, bed, bicycle, briefcase, gameController,
      fastFood, musicalNotes, paw, sunny, moon, alarm, cart, cafe,
      medkit, school, trash, skull, trophy, rocket, rose, fitness, flask,
      hammer, heart, hourglass, key, library, mail, map, mic, pencil,
      people, pizza, planet, restaurant, shapes, shirt, sparkles, star,
      storefront, terminal, thumbsUp, timer, tv, umbrella, videocam, walk,
      wallet, wifi, wine, accessibility, basket, beer, camera, car,
      chatbubble, clipboard, colorPalette, desktop, flame
    });

    // 1. REGISTER EFFECT (Must be in constructor)
    effect(() => {
      // 2. READ SIGNAL (Creates dependency)
      const achievement = this.achService.lastUnlocked();

      // 3. REACT (If an achievement exists)
      if (achievement) {
        // We wrap the async call to keep the effect clean
        this.presentAchievementToast(achievement);
      }
    });
  }

  // Separated helper for the async UI logic
  async presentAchievementToast(ach: any) {
    const toast = await this.toastCtrl.create({
      header: 'Achievement Unlocked!',
      message: `${ach.title} - Click to Claim`,
      position: 'top',
      duration: 4000,
      color: 'warning',
      icon: 'trophy',
      buttons: [
        {
          side: 'end',
          text: 'CLAIM',
          handler: () => {
            this.router.navigate(['/tabs/character']);
          }
        }
      ]
    });

    await toast.present();
  }

  ionViewDidEnter() {
    this.habitService.checkDateAndReset();
    this.habits = this.habitService.getHabits();
  }

  async openHabitDetail(habit: Habit) {
    const modal = await this.modalCtrl.create({
      component: HabitDetailModalComponent,
      componentProps: { habit: habit }
    });
    return await modal.present();
  }



  // New Method: Delete with Confirmation
  async deleteHabit(habit: Habit) {
    const alert = await this.alertCtrl.create({
      header: 'Delete Habit?',
      message: `Are you sure you want to remove "${habit.title}"?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.habitService.deleteHabit(habit.id);
            this.refreshData(); // Reload list

            // Optional: Show feedback
            this.showToast('Habit deleted');
          }
        }
      ]
    });

    await alert.present();
  }

   getStatIcon(stat: string): string {
    switch(stat) {
      case 'strength': return 'barbell';
      case 'intelligence': return 'book';
      case 'constitution': return 'heart';
      case 'dexterity': return 'flash';
      case 'charisma': return 'chatbubble';
      default: return 'help-circle';
    }
  }

  // 4. OPTIONAL: HELPER FOR SHORT NAMES
  getStatLabel(stat: string): string {
    if (!stat) return '';
    return stat.substring(0, 3).toUpperCase(); // Returns STR, INT, etc.
  }

  async showToast(msg: string) {
    const toast = await this.toastCtrl.create({
      message: msg,
      duration: 1500,
      position: 'bottom'
    });
    toast.present();
  }

  async onToggleHabit(event: any, habit: Habit) {
    // Prevent default simple toggling behavior
    const isChecking = event.detail.checked;

    // If we are unchecking, just do it directly
    if (!isChecking) {
      this.habitService.uncompleteHabit(habit.id);
      this.charService.modifyStat(habit.associatedStat, habit.difficulty, true);
      this.refreshData(); // Helper to reload list
      return;
    } else {
      this.soundService.play('boop');
    }

    // If checking -> Reset box first (wait for modal)
    // We modify the array directly to visually revert check until confirmed
    habit.completed = false;

    const modal = await this.modalCtrl.create({
      component: CompletionModalComponent,
      breakpoints: [0, 0.5, 0.8], // Helper sheet style
      initialBreakpoint: 0.5,
      cssClass: 'custom-modal'
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();

    if (data) {
      // User selected a mood and confirmed
      // 1. Mark complete
      this.habitService.completeHabit(habit.id, data);
      this.achService.notifyHabitComplete(habit.streak); // <--- ADD THIS
      this.charService.modifyStat(habit.associatedStat, habit.difficulty, false);
      this.refreshData(); // Reload from service to show checked state
    } else {
      // User cancelled modal -> keep it unchecked (which we already did)
      this.refreshData();
    }
  }

  refreshData() {
    this.habits = this.habitService.getHabits();
  }

  async openSettings() {
    const modal = await this.modalCtrl.create({
      component: SettingsPage,
      // OPTIONAL: Make it a "Sheet Modal" (slides up partially)
      initialBreakpoint: 1,
      breakpoints: [0, 0.5, 1],
      handle: true
    });
    await modal.present();
  }
}
