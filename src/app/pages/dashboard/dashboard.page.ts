import { Component, ElementRef, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons,
  IonMenuButton, IonButton, IonIcon, IonList, IonItem,
  IonLabel, IonCheckbox
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { settingsOutline } from 'ionicons/icons';
import { ToastController } from '@ionic/angular/standalone';

// Three.js Imports
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RewardModalComponent } from 'src/app/components/reward-modal/reward-modal.component';
import { InventoryService, Item } from 'src/app/services/inventory';
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

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons,
    IonMenuButton, IonButton, IonIcon, IonList, IonItem,
    IonLabel, IonCheckbox
  ]
})
export class DashboardPage implements AfterViewInit, OnDestroy {

  @ViewChild('rendererCanvas', { static: false }) rendererCanvas!: ElementRef;

  // Three.js variables
  renderer!: THREE.WebGLRenderer;
  scene!: THREE.Scene;
  camera!: THREE.PerspectiveCamera;
  mixer!: THREE.AnimationMixer;
  clock = new THREE.Clock();
  animationId: number = 0;
  spinSpeed: number = 0; // How fast it is currently spinning
  model!: THREE.Object3D;


  habits: Habit[] = []; // Change to use Habit interface

  constructor(private modalCtrl: ModalController, private habitService: HabitService
    , private toastCtrl: ToastController
    , private inventoryService: InventoryService
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
      chatbubble, clipboard, colorPalette, desktop
    });
  }

  ionViewDidEnter() {
    this.habits = this.habitService.getHabits();
    // Re-initialize 3D logic if needed here or keep separate
  }

  // rewardsPool: Item[] = [
  //   { id: '1', name: 'Gold Coin', icon: 'cash-outline', rarity: 'common' },
  //   { id: '2', name: 'Diamond', icon: 'diamond-outline', rarity: 'legendary' },
  //   { id: '3', name: 'Potion', icon: 'flask-outline', rarity: 'rare' },
  //   { id: '4', name: 'Shield', icon: 'shield-outline', rarity: 'common' },
  // ];


  async openReward() {
    // 1. Generate 1 to 5 random items from the inventory system
    const randomLoot = this.inventoryService.getRandomItems(1, 5);

    console.log('Generated Loot Pool:', randomLoot);

    const modal = await this.modalCtrl.create({
      component: RewardModalComponent,
      componentProps: {
        // Pass the dynamic list instead of the hardcoded rewardsPool
        possibleRewards: randomLoot
      },
      cssClass: 'my-custom-modal-css',
      backdropDismiss: false
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();

    // 3. Handle Collection (actually add to inventory)
    if (data?.claimed && data?.reward) {
      console.log('User collected:', data.reward);

      // If the modal returns a specific chosen item, add it:
      this.inventoryService.addItem(data.reward);

      const toast = await this.toastCtrl.create({
        message: `Collected ${data.reward.name}!`,
        duration: 2000,
        color: 'success',
        position: 'top'
      });
      toast.present();
    }
  }

  // Initialize Three.js after the view loads
  ngAfterViewInit() {
    this.initThree();
  }

  // Clean up memory when leaving the page
  ngOnDestroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }

  onCharacterTouch() {
    // Set a sudden speed (30 degrees per frame roughly)
    this.spinSpeed = 0.5;
  }

  initThree() {
    // 1. Get the container dimensions
    const container = this.rendererCanvas.nativeElement.parentElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    console.log(`Canvas Size: ${width}px x ${height}px`); // <--- CHECK THIS LOG

    if (width === 0 || height === 0) {
      console.error('Canvas has no size! Waiting for layout...');
      setTimeout(() => this.initThree(), 100); // Try again in 100ms
      return;
    }

    console.log('Initializing Three.js scene');

    // 2. Setup Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x333333); // Dark Grey

    // 3. Camera (FOV, Aspect, Near, Far)
    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    this.camera.position.z = 3; // Move back 3 units
    this.camera.position.y = -0.2; // Move back 3 units

    // 4. Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.rendererCanvas.nativeElement,
      antialias: true
    });
    this.renderer.setSize(width, height);

    // 5. DEBUG CUBE (Bright Red)
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const cube = new THREE.Mesh(geometry, material);
    // this.scene.add(cube);

    // 6. Lights
    const light = new THREE.DirectionalLight(0xffffff, 2);
    light.position.set(2, 2, 5);
    this.scene.add(light);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    // 7. Load Model
    const loader = new GLTFLoader();
    loader.load('assets/character.glb', (gltf) => {
      console.log('Model loaded!');
      this.model = gltf.scene;

      // Scale might be huge or tiny, let's normalize it
      this.model.scale.set(1, 1, 1);
      this.model.position.set(0, -1, 0);

      this.scene.add(this.model);

      console.log('Animations found:', gltf.animations); // <--- CHECK CONSOLE

      if (gltf.animations && gltf.animations.length > 0) {
        this.mixer = new THREE.AnimationMixer(gltf.scene);

        // Play the first animation (usually "Armature|mixamo.com|Layer0")
        const action = this.mixer.clipAction(gltf.animations[0]);
        action.play();
      } else {
        console.warn('No animations found in this GLB!');
      }

      // If we see the model, remove the cube
      // this.scene.remove(cube);

    }, undefined, (err) => console.error(err));

    // Start Loop
    this.animate();
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // 1. Get the time passed since the last frame
    const delta = this.clock.getDelta();

    // 2. Update the mixer (this moves the bones)
    if (this.mixer) {
      this.mixer.update(delta);
    }

    if (this.model && this.spinSpeed > 0.001) {
      // 1. Rotate the model by current speed
      this.model.rotation.y += this.spinSpeed;

      // 2. Apply Friction (slow it down by 5% every frame)
      this.spinSpeed *= 0.95;
    } else {
        // Stop completely if very slow
        this.spinSpeed = 0;
    }

    this.renderer.render(this.scene, this.camera);
  }

  async onToggleHabit(event: any, habit: Habit) {
    // Prevent default simple toggling behavior
    const isChecking = event.detail.checked;

    // If we are unchecking, just do it directly
    if (!isChecking) {
      this.habitService.uncompleteHabit(habit.id);
      this.refreshData(); // Helper to reload list
      return;
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

      this.openReward();
      this.refreshData();

      this.refreshData(); // Reload from service to show checked state
    } else {
      // User cancelled modal -> keep it unchecked (which we already did)
      this.refreshData();
    }
  }

  refreshData() {
    this.habits = this.habitService.getHabits();
  }
}
