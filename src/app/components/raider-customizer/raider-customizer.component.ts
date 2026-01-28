import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import { addIcons } from 'ionicons';
import {
  person,
  happy,
  bagHandle,
  flash,
  closeCircleOutline,
  saveOutline
} from 'ionicons/icons';
import { CharacterService } from 'src/app/services/character';

// --- Interfaces for our data ---
interface GameAsset {
  id: string;
  name: string;
  modelUrl: string;
  thumbnail: string; // URL to an image
  scale?: number;     // Optional scale override
  offset?: [number, number, number]; // Optional position offset
  rotation?: [number, number, number]; // Optional rotation offset
}

interface AssetCategory {
  id: 'base' | 'hat' | 'backpack' | 'item';
  label: string;
  icon: string; // Ionic icon name
}

@Component({
  selector: 'app-raider-customizer',
  templateUrl: './raider-customizer.component.html',
  styleUrls: ['./raider-customizer.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class RaiderCustomizerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('rendererCanvas', { static: false }) rendererCanvas!: ElementRef;

  // --- UI State ---
  isLoading = false;
  selectedCategory: 'base' | 'hat' | 'backpack' | 'item' = 'base';

  // Track what is currently equipped
  currentLoadout = {
    base: null as GameAsset | null,
    hat: null as GameAsset | null,
    backpack: null as GameAsset | null,
    item: null as GameAsset | null
  };

  // --- Configuration ---
  categories: AssetCategory[] = [
    { id: 'base', label: 'Raider', icon: 'person' },
    { id: 'hat', label: 'Headgear', icon: 'happy' },
    { id: 'backpack', label: 'Back', icon: 'bag-handle' },
    { id: 'item', label: 'Weapon', icon: 'flash' }
  ];

  // MOCK DATA - Replace URLs with your actual assets
  availableAssets = {
    base: [
      { id: 'male_raider', name: 'Male Raider', modelUrl: 'assets/raider_male.glb', thumbnail: 'assets/thumbs/male.png' },
      { id: 'female_raider', name: 'Female Raider', modelUrl: 'assets/raider_female.glb', thumbnail: 'assets/thumbs/female.png' }
    ],
    hat: [
      { id: 'helmet_sci', name: 'SciFi Helm', modelUrl: 'assets/helmet_sci.glb', thumbnail: 'assets/thumbs/helm.png', scale: 0.15, offset: [0, 21, 0] },
      { id: 'cowboy', name: 'Cowboy Hat', modelUrl: 'assets/cowboy.glb', thumbnail: 'assets/thumbs/cowboy.png', offset: [0, 0.1, 0] }
    ],
    backpack: [
      { id: 'jetpack', name: 'Jetpack', modelUrl: 'assets/jetpack.glb', thumbnail: 'assets/thumbs/jet.png',scale: 0.5, offset: [0, 0, 0] },
      { id: 'rucksack', name: 'Survival Bag', modelUrl: 'assets/rucksack.glb', thumbnail: 'assets/thumbs/bag.png', scale: 0.5, offset: [0, 0, 0] }
    ],
    item: [
      { id: 'rifle', name: 'Plasma Rifle', modelUrl: 'assets/rifle.glb', thumbnail: 'assets/thumbs/rifle.png', scale: .01, offset: [0, 0, 0] },
      { id: 'sword', name: 'Katana', modelUrl: 'assets/sword.glb', thumbnail: 'assets/thumbs/katana.png', scale: .01, offset: [0, 0, 0] }
    ]
  };

  // --- Three.js Variables ---
  renderer!: THREE.WebGLRenderer;
  scene!: THREE.Scene;
  camera!: THREE.PerspectiveCamera;
  mixer!: THREE.AnimationMixer;
  clock = new THREE.Clock();

  // The Main Character Model Group
  characterModel: THREE.Object3D | null = null;

  // References to the currently loaded accessory Objects (so we can remove them later)
  accessoryObjects = {
    hat: null as THREE.Object3D | null,
    backpack: null as THREE.Object3D | null,
    item: null as THREE.Object3D | null
  };

  constructor(private charService: CharacterService) {
    addIcons({
      'person': person,
      'happy': happy,
      'bag-handle': bagHandle,
      'flash': flash,
      'close-circle-outline': closeCircleOutline,
      'save-outline': saveOutline
    });
  }

  ngAfterViewInit() {
  this.initThree();

  // FIX: Wrap this in setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
  setTimeout(() => {
    // Load default character
    this.selectOption(this.availableAssets.base[0]);
  }, 0);
}

  ngOnDestroy() {
    this.renderer.dispose();
  }

  // --- UI Interaction ---

  selectCategory(catId: any) {
    this.selectedCategory = catId;
  }

  getOptionsForCategory() {
    return this.availableAssets[this.selectedCategory];
  }

  isEquipped(item: GameAsset) {
    // Check if this item ID matches the current loadout for this category
    return this.currentLoadout[this.selectedCategory]?.id === item.id;
  }

  selectOption(item: GameAsset | null) {
    // 1. Handle "Base" Model logic separately
    if (this.selectedCategory === 'base') {
      // We ignore null here because you can't have "no body"
      if (item) {
        this.changeBaseModel(item);
      }
      return; // STOP execution here
    }

    // 2. Handle Accessories
    // Now TypeScript knows 'selectedCategory' cannot be 'base' because we returned above.
    // We strictly cast it to the allowed types to silence the error completely.
    this.changeAccessory(
      this.selectedCategory as 'hat' | 'backpack' | 'item',
      item
    );
  }

  onCharacterTouch() {
    // Quick spin feedback
    if(this.characterModel) this.characterModel.rotation.y += 0.5;
    // Inside your loader callback
    console.log('Scene Dump:');
    this.characterModel!.traverse((child) => {
      if (child.type === 'Bone') console.log(child.name);
    });
  }

  saveLoadout() {
    console.log('Saving Loadout:', this.currentLoadout);
    this.charService.setLoadout(this.currentLoadout as any);
    // TODO: Send to your backend
  }

  // --- Three.js Logic ---

  initThree() {
    const container = this.rendererCanvas.nativeElement.parentElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x222222);

    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    this.camera.position.set(0, 0, 4); // Adjusted for character height

    this.renderer = new THREE.WebGLRenderer({ canvas: this.rendererCanvas.nativeElement, antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    // Lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
    hemiLight.position.set(0, 20, 0);
    this.scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(3, 10, 10);
    this.scene.add(dirLight);

    this.animate();
  }

  /**
   * Loads the main character body.
   * When switching base models, we must re-attach all accessories.
   */
  changeBaseModel(asset: GameAsset) {
    if (this.isLoading) return;
    this.isLoading = true;

    const loader = new GLTFLoader();
    loader.load(asset.modelUrl, (gltf) => {

      // 1. Remove old model
      if (this.characterModel) this.scene.remove(this.characterModel);

      // 2. Setup new model
      this.characterModel = gltf.scene;
      this.characterModel.scale.set(1, 1, 1); // Normalize
      this.characterModel.position.set(0, -1, 0);

      this.scene.add(this.characterModel);


      // 3. Setup Animation
      if (gltf.animations.length > 0) {
        this.mixer = new THREE.AnimationMixer(this.characterModel);
        // Usually idle is the first animation
        this.mixer.clipAction(gltf.animations[0]).play();
      }

      // 4. Update State
      this.currentLoadout.base = asset;

      // 5. Re-attach existing accessories to the new skeleton
      // (Because the old skeleton is gone!)
      if (this.currentLoadout.hat) this.changeAccessory('hat', this.currentLoadout.hat);
      if (this.currentLoadout.backpack) this.changeAccessory('backpack', this.currentLoadout.backpack);
      if (this.currentLoadout.item) this.changeAccessory('item', this.currentLoadout.item);

      this.isLoading = false;
    });
  }

  /**
   * Loads an accessory and attaches it to a specific bone.
   */
  changeAccessory(type: 'hat' | 'backpack' | 'item', asset: GameAsset | null) {
    if (!this.characterModel) return;

    // 1. Clear existing accessory of this type
    if (this.accessoryObjects[type]) {
      this.accessoryObjects[type]?.removeFromParent();
      this.accessoryObjects[type] = null;
    }

    // Update Loadout State
    this.currentLoadout[type] = asset;

    // If we selected "None" (null), we stop here.
    if (!asset) return;

    // 2. Determine target bone based on type
    // !!! CHECK YOUR GLB BONE NAMES !!!
    let boneName = '';
    if (type === 'hat') boneName = 'mixamorigHead';
    if (type === 'backpack') boneName = 'mixamorigHead'; // Upper spine
    if (type === 'item') boneName = 'mixamorigRightHand';

    const bone = this.characterModel.getObjectByName(boneName);

    if (!bone) {
      console.error(`Bone ${boneName} not found in model!`);
      return;
    }

    console.log(`Attaching ${asset.name} to bone ${boneName}`);

    // 3. Load the new accessory
    const loader = new GLTFLoader();
    loader.load(asset.modelUrl, (gltf) => {
      const mesh = gltf.scene;

      // Apply asset-specific tweaks
      if (asset.scale) mesh.scale.setScalar(asset.scale);
      if (asset.offset) mesh.position.set(...asset.offset);
      if (asset.rotation) mesh.rotation.set(...asset.rotation);

      console.log('Accessory Mesh:', mesh);

      // Attach to bone
      bone.add(mesh);

      // Save reference so we can remove it later
      this.accessoryObjects[type] = mesh;
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    const delta = this.clock.getDelta();
    if (this.mixer) this.mixer.update(delta);
    this.renderer.render(this.scene, this.camera);
  }

  restoreSession() {
    const saved = this.charService.getLoadout();

    // 1. Restore Base Model
    // We look for the asset object that matches the saved URL
    const baseAsset = this.availableAssets.base.find(a => a.modelUrl === saved.baseModel);

    // If we found a match, load it. Otherwise default to the first one.
    if (baseAsset) {
      this.changeBaseModel(baseAsset);
    } else {
      this.changeBaseModel(this.availableAssets.base[0]);
    }

    // 2. Restore Accessories
    // We pass the URL from the saved data to a helper to find the Asset Object
    if (saved.hat) this.restoreAccessory('hat', saved.hat);
    if (saved.backpack) this.restoreAccessory('backpack', saved.backpack);
    if (saved.item) this.restoreAccessory('item', saved.item);
  }

  private restoreAccessory(category: 'hat' | 'backpack' | 'item', url: string) {
    // Find the full Asset Object (with scale/offset info) that matches the saved URL
    const asset = this.availableAssets[category].find(a => a.modelUrl === url);

    if (asset) {
      // this.changeAccessory(category, asset);
    }
  }
}
