import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router'; // <--- Added this for routerLink
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonIcon, IonApp, IonButton // <--- Added IonButton here
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { flame, checkmarkCircle, ellipseOutline, closeCircleOutline } from 'ionicons/icons';
import { DayStatus, StreakService } from '../services/streak';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterLink, // <--- Added to imports array
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonIcon,
    IonButton   // <--- Added to imports array
  ]
})
export class HomePage {
  currentStreak: number = 0;
  weekProgress: DayStatus[] = [];

  constructor(private streakService: StreakService) {
    // Register the icons
    addIcons({ flame, checkmarkCircle, ellipseOutline, closeCircleOutline });
  }

  ionViewWillEnter() {
    this.currentStreak = this.streakService.checkIn();
    this.weekProgress = this.streakService.getCurrentWeekProgress();
  }
}
