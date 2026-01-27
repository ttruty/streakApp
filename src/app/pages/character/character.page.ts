import { Component, OnInit } from '@angular/core'; // <--- Import OnInit
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonProgressBar,
  IonIcon, IonButton, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkCircle } from 'ionicons/icons';
import { ViewDidEnter } from '@ionic/angular/standalone';
import { Achievement, CharacterService, CharacterState } from 'src/app/services/character';

@Component({
  selector: 'app-character',
  templateUrl: './character.page.html',
  styleUrls: ['./character.page.scss'],
  standalone: true,
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonProgressBar, IonIcon, IonButton]
})
export class CharacterPage implements OnInit, ViewDidEnter { // <--- Add implements OnInit

  // FIX: Initialize with default values so HTML never crashes
  state: CharacterState = {
    level: 1,
    currentXp: 0,
    maxXp: 100
  };

  achievements: Achievement[] = [];

  constructor(
    private charService: CharacterService,
    private toastCtrl: ToastController
  ) {
    addIcons({ checkmarkCircle });
  }

  // FIX: Load data immediately when Angular creates the component
  ngOnInit() {
    this.refresh();
  }

  // Keep this to refresh data when you tab back to the page
  ionViewDidEnter() {
    this.refresh();
  }

  refresh() {
    // Safety check: ensure service actually has data
    if (this.charService.state) {
      this.state = this.charService.state;
      this.achievements = this.charService.achievements;
    }
  }

  async claim(ach: Achievement) {
    const xp = this.charService.claimAchievement(ach.id);

    const toast = await this.toastCtrl.create({
      message: `Claimed ${xp} XP! Level up progress!`,
      duration: 2000,
      color: 'tertiary',
      position: 'top'
    });
    toast.present();

    this.refresh();
  }
}
