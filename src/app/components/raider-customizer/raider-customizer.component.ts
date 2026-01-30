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
import { AssetCategory, CharacterService, GameAsset } from 'src/app/services/character';

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

  //90° = 1.57 (Math.PI / 2)
// 180° = 3.14 (Math.PI)
// 270° = 4.71 (3 * Math.PI / 2)
// 360° = 6.28 (2 * Math.PI)

  // --- Three.js Variables ---
  renderer!: THREE.WebGLRenderer;
  scene!: THREE.Scene;
  camera!: THREE.PerspectiveCamera;
  mixer!: THREE.AnimationMixer;
  clock = new THREE.Clock();

  // --- DRAG ROTATION STATE ---
  isDragging = false;
  previousMouseX = 0;
  rotationSpeed = 0.005; // Adjust sensitivity here

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
    this.restoreSession();
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
    return this.charService.ASSET_LIBRARY[this.selectedCategory];
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

  // Mouse Events
  onStart(event: MouseEvent) {
    this.isDragging = true;
    this.previousMouseX = event.clientX;
  }

  onMove(event: MouseEvent) {
    this.handleInput(event.clientX);
  }

  // Touch Events
  onTouchStart(event: TouchEvent) {
    this.isDragging = true;
    this.previousMouseX = event.touches[0].clientX;
  }

  onTouchMove(event: TouchEvent) {
    // Prevent scrolling while rotating character
    // event.preventDefault();
    this.handleInput(event.touches[0].clientX);
  }

  onEnd() {
    this.isDragging = false;
  }

  // Shared Logic
  handleInput(currentX: number) {
    if (!this.isDragging || !this.characterModel) return;

    const deltaX = currentX - this.previousMouseX;

    // Rotate model
    this.characterModel.rotation.y += deltaX * this.rotationSpeed;

    // Update previous position for next frame
    this.previousMouseX = currentX;
  }


  // --- Three.js Logic ---

  initThree() {
    const container = this.rendererCanvas.nativeElement.parentElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x222222);

    this.camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 1000);
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
    if (type === 'backpack') boneName = 'mixamorigSpine2'; // Upper spine
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
      const root = gltf.scene;
      // A. Traverse to fix Materials and identify Scaling issues
      root.traverse((child: any) => {
        if (child.isMesh) {
          // 1. Ensure it renders on both sides (fixes "inside-out" invisibility)
          if (child.material) {
            child.material.side = THREE.DoubleSide;
          }
          // 2. Enable Shadows
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      // B. Apply Config Configs (Scale/Rotation)
      // Backpacks often need to be rotated 180 degrees (Math.PI) to face backward
      if (asset.scale) root.scale.setScalar(asset.scale);
      if (asset.rotation) root.rotation.set(...asset.rotation);
      if (asset.offset) root.position.set(...asset.offset);

      // C. Debug Helper: If you still can't see it, uncomment this!
      // const box = new THREE.Box3().setFromObject(root);
      // const helper = new THREE.Box3Helper(box, 0xffff00); // Yellow Box
      // root.add(helper);
      // console.log(`Loaded ${type} size:`, box.getSize(new THREE.Vector3()));

      // --- FIX ENDS HERE ---

      bone.add(root);
      this.accessoryObjects[type] = root;
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    const delta = this.clock.getDelta();
    if (this.mixer) this.mixer.update(delta);
    this.renderer.render(this.scene, this.camera);
  }

  restoreSession() {
    // 1. Get saved data from Service
    const saved = this.charService.getLoadout();

    // 2. Resolve the Full Asset Objects
    // We need to look up the full object (with scale/offset) using the saved ID/URL
    // Note: Use 'this.charService.ASSET_LIBRARY' if you moved assets there,
    // otherwise use 'this.availableAssets' if they are still local.
    const library = (this.charService as any).ASSET_LIBRARY;

    const baseAsset = this.findAsset(library.base, saved?.base);
    const hatAsset = this.findAsset(library.hat, saved?.hat);
    const backpackAsset = this.findAsset(library.backpack, saved?.backpack);
    const itemAsset = this.findAsset(library.item, saved?.item);

    // 3. Fallback to Default Male if no save exists
    if (!baseAsset) {
      console.log('No save found, loading default.');
      this.selectOption(library.base[0]);
      return;
    }

    console.log('Restoring Session:', { baseAsset, hatAsset, backpackAsset, itemAsset });

    // 4. PRE-SET the Loadout State
    // We set these NOW so that when the base model finishes loading,
    // it sees these items waiting and attaches them automatically.
    this.currentLoadout = {
      base: baseAsset,
      hat: hatAsset || null,
      backpack: backpackAsset || null,
      item: itemAsset || null
    };

    // 5. Trigger the Chain Reaction
    // Loading the base model will trigger step 4 in your changeBaseModel() function
    this.changeBaseModel(baseAsset);
  }

  // Helper to match saved data (which might be a string URL or an object) to the real asset
  private findAsset(categoryList: GameAsset[], savedItem: any): GameAsset | null {
    if (!savedItem) return null;

    // If savedItem is just a string (URL or ID)
    if (typeof savedItem === 'string') {
      return categoryList.find(a => a.id === savedItem || a.modelUrl === savedItem) || null;
    }

    // If savedItem is the object itself
    return categoryList.find(a => a.id === savedItem.id) || null;
  }
}
