import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonList,
  IonListHeader, IonItem, IonLabel, IonToggle, IonRange, IonIcon,
  IonButtons, IonButton, ModalController // <--- Import these 3
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { volumeHigh, volumeLow, volumeOff } from 'ionicons/icons';
import { SoundService } from 'src/app/services/sound';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonList,
    IonListHeader, IonItem, IonLabel, IonToggle, IonRange, IonIcon,
    IonButtons, IonButton // <--- Add to imports
  ]
})
export class SettingsPage {

  volume: number = 0.5;
  isMuted: boolean = false;

  constructor(
    private soundService: SoundService,
    private modalCtrl: ModalController // <--- Inject
  ) {
    addIcons({ volumeHigh, volumeLow, volumeOff });
    this.volume = this.soundService.getVolume();
    this.isMuted = this.soundService.getMuteStatus();
  }

  // Close the modal
  dismiss() {
    this.modalCtrl.dismiss();
  }

  toggleMute(ev: any) {
    this.isMuted = !ev.detail.checked;
    this.soundService.toggleMute(this.isMuted);
  }

  changeVolume(ev: any) {
    this.volume = ev.detail.value;
    this.soundService.setVolume(this.volume);
  }
}
