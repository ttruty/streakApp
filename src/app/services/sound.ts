import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SoundService {

  private sounds: any = {};
  private isMuted: boolean = false;
  private volume: number = 0.5; // Default 50%

  constructor() {
    this.loadSettings();
    this.preloadSounds();
  }

  // 1. Load Audio Objects
  private preloadSounds() {
    this.sounds['beep-beep'] = new Audio('assets/sounds/beep-beep.mp3');
    this.sounds['beep'] = new Audio('assets/sounds/beep.mp3');
    this.sounds['boop'] = new Audio('assets/sounds/boop.mp3');
    this.sounds['fail'] = new Audio('assets/sounds/fail.mp3');
    this.sounds['ting'] = new Audio('assets/sounds/ting.mp3');
    this.sounds['reveal'] = new Audio('assets/sounds/reveal.mp3');

  }

  // 2. Play Method
  play(key: 'beep-beep' | 'beep' | 'boop' | 'fail' | 'ting' | 'reveal') {
    if (this.isMuted || !this.sounds[key]) return;

    const audio = this.sounds[key];
    audio.volume = this.volume;
    audio.currentTime = 0; // Reset to start if already playing
    audio.play().catch((err: any) => console.warn('Audio play failed:', err));
  }

  // 3. Settings Control
  setVolume(val: number) {
    this.volume = val;
    this.saveSettings();
  }

  toggleMute(isMuted: boolean) {
    this.isMuted = isMuted;
    this.saveSettings();
  }

  getVolume() { return this.volume; }
  getMuteStatus() { return this.isMuted; }

  // 4. Persistence
  private saveSettings() {
    localStorage.setItem('app_sound_volume', this.volume.toString());
    localStorage.setItem('app_sound_mute', JSON.stringify(this.isMuted));
  }

  private loadSettings() {
    const savedVol = localStorage.getItem('app_sound_volume');
    const savedMute = localStorage.getItem('app_sound_mute');

    if (savedVol) this.volume = parseFloat(savedVol);
    if (savedMute) this.isMuted = JSON.parse(savedMute);
  }
}
