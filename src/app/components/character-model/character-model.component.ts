import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, effect } from '@angular/core';
import { CharacterService } from 'src/app/services/character';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

@Component({
  selector: 'app-character-model',
  templateUrl: './character-model.component.html',
  styleUrls: ['./character-model.component.scss'],
  standalone: true,
  imports: []
})
export class CharacterModelComponent implements AfterViewInit, OnDestroy {

  @ViewChild('rendererCanvas', { static: false }) rendererCanvas!: ElementRef;

  renderer!: THREE.WebGLRenderer;
  scene!: THREE.Scene;
  camera!: THREE.PerspectiveCamera;
  mixer!: THREE.AnimationMixer;
  clock = new THREE.Clock();
  model!: THREE.Object3D;
  animationId: number = 0;
  spinSpeed: number = 0;

  // --- DRAG ROTATION STATE ---
  isDragging = false;
  previousMouseX = 0;
  rotationSpeed = 0.005; // Adjust sensitivity here

  currentEffect: 'stars' | 'grid' = 'stars';

  toggleEffect() {
    this.currentEffect = this.currentEffect === 'stars' ? 'grid' : 'stars';
  }

  constructor(public charService: CharacterService) {
    effect(() => {
      // access the signal (this creates the dependency)
      const currentData = this.charService.loadout();

      // Only try to load if ThreeJS is already running
      if (this.scene) {
        console.log('Signal detected change! Reloading...');
        this.loadCustomCharacter(currentData);
      }
    });
  }

  ngAfterViewInit() {
    this.initThree();
  }

  ngOnDestroy() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    if (this.renderer) this.renderer.dispose();
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
    if (!this.isDragging || !this.model) return;

    const deltaX = currentX - this.previousMouseX;

    // Rotate model
    this.model.rotation.y += deltaX * this.rotationSpeed;

    // Update previous position for next frame
    this.previousMouseX = currentX;
  }

  initThree() {
    // 1. Setup Canvas (Standard ThreeJS Boilerplate)
    const container = this.rendererCanvas.nativeElement.parentElement;
    const width = container.clientWidth || 300; // Fallback width
    const height = container.clientHeight || 400;

    this.scene = new THREE.Scene();
    // Transparent background so CSS gradient shows through
    // this.scene.background = null;

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, -0.25, 4); // Look at center

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.rendererCanvas.nativeElement,
      antialias: true,
      alpha: true // Important for transparency
    });
    this.renderer.setSize(width, height);

    // Lights
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
    hemiLight.position.set(0, 20, 0);
    this.scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(3, 10, 10);
    this.scene.add(dirLight);

    // LOAD
    this.loadCustomCharacter();

    // Loop
    this.animate();
  }

loadCustomCharacter(signalData: any = null) {
    if (this.model) this.scene.remove(this.model);


    // 1. Get Saved Data
    let loadout = signalData || this.charService.loadRaiderFromStorage();
    // 2. Fallback Default
    if (!loadout || !loadout.base) {
      loadout = {
        base: this.charService.ASSET_LIBRARY.base[0], // Default Male
        hat: null,
        backpack: null,
        item: null
      };
    }

    // 3. Resolve Base Model URL
    // The save might be an object OR just a URL string.
    // We use the helper to get the full GameAsset object.
    const baseAsset = this.charService.getAssetDetails('base', loadout.base);

    if (!baseAsset) {
        console.error("Could not resolve base model"); return;
    }

    const loader = new GLTFLoader();

    loader.load(baseAsset.modelUrl, (gltf) => {
      this.model = gltf.scene;
      this.model.scale.set(1, 1, 1);
      this.model.position.set(0, -1, 0);
      this.scene.add(this.model);

      // Animation
      if (gltf.animations.length > 0) {
        this.mixer = new THREE.AnimationMixer(this.model);
        this.mixer.clipAction(gltf.animations[0]).play();
      }

      // 4. Attach Accessories using the "Smart" Helper
      if (loadout.hat) this.attachSmartAccessory('hat', loadout.hat, 'mixamorigHead');
      if (loadout.backpack) this.attachSmartAccessory('backpack', loadout.backpack, 'mixamorigSpine2');
      if (loadout.item) this.attachSmartAccessory('item', loadout.item, 'mixamorigRightHand');

    });
  }

  /**
   * Looks up the asset config (scale, offset) and attaches it correctly
   */
  attachSmartAccessory(category: string, identifier: any, boneName: string) {
    // 1. Find the full configuration from the Service
    const asset = this.charService.getAssetDetails(category, identifier);

    if (!asset) return;

    // 2. Find Bone
    const bone = this.model.getObjectByName(boneName);
    if (!bone) return;

    // 3. Load & Transform
    const loader = new GLTFLoader();
    loader.load(asset.modelUrl, (gltf) => {
      const root = gltf.scene;

      // --- APPLY CONFIGS (The key part!) ---
      // Fix Materials
      root.traverse((child: any) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (child.material) child.material.side = THREE.DoubleSide;
        }
      });

      // Apply Scale
      if (asset.scale) root.scale.setScalar(asset.scale);

      // Apply Rotation
      if (asset.rotation) root.rotation.set(...asset.rotation);

      // Apply Offset
      if (asset.offset) root.position.set(...asset.offset);

      // Attach
      bone.add(root);
    });
  }

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());
    const delta = this.clock.getDelta();
    if (this.mixer) this.mixer.update(delta);

    // Spin Effect
    if (this.model && this.spinSpeed > 0.001) {
      this.model.rotation.y += this.spinSpeed;
      this.spinSpeed *= 0.95;
    } else {
      this.spinSpeed = 0;
    }

    this.renderer.render(this.scene, this.camera);
  }
}
