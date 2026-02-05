import { Component, Input } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { star } from 'ionicons/icons';

@Component({
  selector: 'app-level-up-modal',
  templateUrl: './level-up-modal.component.html',
  styleUrls: ['./level-up-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class LevelUpModalComponent {
  @Input() level: number = 1;

  constructor(private modalCtrl: ModalController) {
    addIcons({ star });
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }
}
