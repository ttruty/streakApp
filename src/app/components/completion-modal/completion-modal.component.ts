import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalController, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonContent } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close, sadOutline, sad, happyOutline, happy } from 'ionicons/icons';

@Component({
  selector: 'app-completion-modal',
  templateUrl: './completion-modal.component.html',
  styleUrls: ['./completion-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonContent]
})
export class CompletionModalComponent {

  selectedMood: 'sad' | 'neutral' | 'happy' | null = null;

  constructor(private modalCtrl: ModalController) {
    addIcons({ close, sadOutline, sad, happyOutline, happy });
  }

  close(mood: string | null) {
    return this.modalCtrl.dismiss(mood);
  }

  confirm() {
    this.close(this.selectedMood);
  }
}
