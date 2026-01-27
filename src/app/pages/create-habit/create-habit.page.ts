import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonSegment,
  IonSegmentButton, IonLabel, IonItem, IonInput, IonSelect,
  IonSelectOption, IonButton, IonFooter, IonIcon, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { gift, diceOutline } from 'ionicons/icons';
import { HabitService, Habit } from 'src/app/services/habit';
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
import { chevronDownOutline, chevronUpOutline } from 'ionicons/icons';

@Component({
  selector: 'app-create-habit',
  templateUrl: './create-habit.page.html',
  styleUrls: ['./create-habit.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonSegment,
    IonSegmentButton, IonLabel, IonItem, IonInput, IonSelect,
    IonSelectOption, IonButton, IonFooter, IonIcon
  ]
})
export class CreateHabitPage {

  habitType: 'regular' | 'random' = 'regular';
  habitName: string = '';

  // Regular Options
  frequency: string = 'daily';
  lootLevel: 'low' | 'medium' | 'high' = 'low';

  // Random Options
  randomCount: string = '1';
  randomPeriod: string = 'day';

  availableIcons = [
    'water', 'barbell', 'book', 'bed', 'bicycle', 'briefcase',
    'game-controller', 'fast-food', 'musical-notes', 'paw', 'sunny',
    'moon', 'alarm', 'cart', 'cafe', 'medkit', 'school', 'trash', 'skull',
    'trophy', 'rocket', 'rose', 'fitness', 'flask', 'hammer', 'heart',
    'hourglass', 'key', 'library', 'mail', 'map', 'mic', 'pencil',
    'people', 'pizza', 'planet', 'restaurant', 'shapes', 'shirt',
    'sparkles', 'star', 'storefront', 'terminal', 'thumbs-up',
    'timer', 'tv', 'umbrella', 'videocam', 'walk', 'wallet', 'wifi',
    'wine', 'accessibility', 'basket', 'beer', 'camera', 'car', 'chatbubble',
    'clipboard', 'color-palette', 'desktop', 'fitness', 'game-controller',
    'hammer', 'heart', 'hourglass', 'key', 'library', 'mail', 'map', 'mic',
    'pencil', 'people', 'pizza', 'planet', 'restaurant', 'shapes', 'shirt',
    'sparkles', 'star', 'storefront', 'terminal', 'thumbs-up', 'timer', 'tv',
    'umbrella', 'videocam', 'walk', 'wallet', 'wifi', 'wine', 'gift', 'dice-outline',
    'chevron-down-outline', 'chevron-up-outline'
  ];

  selectedIcon: string = 'water'; // Default selection
  isIconPickerExpanded: boolean = false;

  constructor(
    private habitService: HabitService,
    private router: Router,
    private toastCtrl: ToastController
  ) {
    addIcons({ gift, diceOutline });
    addIcons({
      water, barbell, book, bed, bicycle, briefcase, gameController,
      fastFood, musicalNotes, paw, sunny, moon, alarm, cart, cafe,
      medkit, school, trash, skull, trophy, rocket, rose, fitness, flask,
      hammer, heart, hourglass, key, library, mail, map, mic, pencil,
      people, pizza, planet, restaurant, shapes, shirt, sparkles, star,
      storefront, terminal, thumbsUp, timer, tv, umbrella, videocam, walk,
      wallet, wifi, wine, accessibility, basket, beer, camera, car,
      chatbubble, clipboard, colorPalette, desktop, diceOutline,chevronDownOutline, chevronUpOutline
    });

  }

  async saveHabit() {
    let freqString = '';

    if (this.habitType === 'regular') {
      freqString = this.frequency;
    } else {
      freqString = `${this.randomCount} times per ${this.randomPeriod}`;
    }

    const newHabit: Habit = {
      id: Date.now().toString(),
      title: this.habitName,
      icon: this.selectedIcon,
      type: this.habitType,
      frequency: freqString,
      reward: this.lootLevel,
      completed: false,
      streak: 0, history: []
    };

    this.habitService.addHabit(newHabit);

    const toast = await this.toastCtrl.create({
      message: 'Habit Created!',
      duration: 1500,
      color: 'success',
      position: 'top'
    });
    toast.present();

    // Go back to dashboard
    this.router.navigate(['/tabs/dashboard']);

    // Reset form
    this.habitName = '';
  }

  // Toggle the menu open/closed
  toggleIconPicker() {
    this.isIconPickerExpanded = !this.isIconPickerExpanded;
  }

  // Select icon and close menu
  selectIcon(iconName: string) {
    this.selectedIcon = iconName;
    this.isIconPickerExpanded = false; // Auto-close after selection
  }
}
