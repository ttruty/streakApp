import { Component, OnInit } from '@angular/core'; // <--- Import OnInit
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonProgressBar,
  IonIcon, IonButton, ToastController, IonSegment, IonSegmentButton, IonLabel,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkCircle, barbell, book, heart, flash, chatbubble } from 'ionicons/icons';
import { ViewDidEnter } from '@ionic/angular/standalone';
import { CharacterService, CharacterState } from 'src/app/services/character';
import { FormsModule } from '@angular/forms';
import { RaiderCustomizerComponent } from 'src/app/components/raider-customizer/raider-customizer.component';
import { Achievement, AchievementService } from 'src/app/services/achievement';

@Component({
  selector: 'app-character',
  templateUrl: './character.page.html',
  styleUrls: ['./character.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonHeader, IonToolbar, IonContent, IonProgressBar, IonIcon, IonButton,
    IonSegment, IonSegmentButton, IonLabel, RaiderCustomizerComponent]
})
export class CharacterPage implements OnInit, ViewDidEnter { // <--- Add implements OnInit
  selectedTab: string = 'stats';

  private STAT_DESCRIPTIONS: any = {
    strength: {
      title: 'Strength (STR)',
      desc: 'Physical power. Leveled up by gym workouts, pushups, and heavy labor tasks.'
    },
    intelligence: {
      title: 'Intelligence (INT)',
      desc: 'Mental acuity. Leveled up by reading, studying, coding, and solving puzzles.'
    },
    constitution: {
      title: 'Constitution (CON)',
      desc: 'Health & Vitality. Leveled up by drinking water, sleeping well, and eating healthy.'
    },
    dexterity: {
      title: 'Dexterity (DEX)',
      desc: 'Agility & Coordination. Leveled up by yoga, sports, playing instruments, or crafting.'
    },
    charisma: {
      title: 'Charisma (CHA)',
      desc: 'Social Force. Leveled up by socializing, networking, public speaking, and kindness.'
    }
  };

  // FIX: Initialize with default values so HTML never crashes
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
  activeQuests: Achievement[] = [];
  trophyCase: Achievement[] = [];

  constructor(
    private charService: CharacterService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private achievementService: AchievementService,
  ) {
    addIcons({barbell,book,heart,flash,chatbubble,checkmarkCircle});
  }

  // FIX: Load data immediately when Angular creates the component
  ngOnInit() {
    this.refresh();
    this.charService.loadRaiderFromStorage();
  }

  // Keep this to refresh data when you tab back to the page
  ionViewDidEnter() {
    this.refresh();
    this.refreshView();
  }

  refresh() {
    // Safety check: ensure service actually has data
    if (this.charService.state) {
      this.state = this.charService.state;
      this.achievements = this.achievementService.getVisibleAchievements();
    }
  }

  refreshView() {
    this.activeQuests = this.achievementService.getVisibleAchievements();
    this.trophyCase = this.achievementService.getTrophyCase();
  }

  async claim(ach: Achievement) {
    const xp = this.achievementService.claim(ach.id);

    this.charService.openReward(); // Generate loot based on achievement

    const toast = await this.toastCtrl.create({
      message: `Claimed ${xp} XP! Level up progress!`,
      duration: 2000,
      color: 'tertiary',
      position: 'top'
    });
    toast.present();

    this.charService.addXp(xp);

    this.refresh();
  }

  onTabChange(event: any) {
  this.selectedTab = event.detail.value;
}
async showStatDetails(statKey: string) {
    const info = this.STAT_DESCRIPTIONS[statKey];

    if (!info) return;

    const alert = await this.alertCtrl.create({
      header: info.title,
      message: info.desc,
      buttons: ['Got it'],
      cssClass: 'stat-alert' // Optional custom class
    });

    await alert.present();
  }
}
