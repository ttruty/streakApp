import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { cafe, book, bed, flame, closeCircleOutline } from 'ionicons/icons';
import { Buff, BuffService } from 'src/app/services/buff';

@Component({
  selector: 'app-buff-modal',
  templateUrl: './buff-modal.component.html',
  styleUrls: ['./buff-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class BuffModalComponent {

  buffs: Buff[] = [];

  constructor(
    private modalCtrl: ModalController,
    public buffService: BuffService
  ) {
    this.buffs = this.buffService.AVAILABLE_BUFFS;
    addIcons({ cafe, book, bed, flame, closeCircleOutline });
  }

  // Helper to get signal value cleanly in HTML
  activeId() {
    return this.buffService.activeBuff()?.id || null;
  }

  selectBuff(buff: Buff | null) {
    this.buffService.activateBuff(buff);
    // Optional: Close immediately or let them read it
    // this.modalCtrl.dismiss();
  }

  close() {
    this.modalCtrl.dismiss();
  }
}
