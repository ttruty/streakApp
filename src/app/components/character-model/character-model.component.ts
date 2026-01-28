import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
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
export class CharacterModelComponent {

  @ViewChild('rendererCanvas', { static: false }) rendererCanvas!: ElementRef;

  // Three.js variables
  renderer!: THREE.WebGLRenderer;
  scene!: THREE.Scene;
  camera!: THREE.PerspectiveCamera;
  mixer!: THREE.AnimationMixer;
  clock = new THREE.Clock();
  animationId: number = 0;
  spinSpeed: number = 0;
  model!: THREE.Object3D;

  constructor(public charService: CharacterService) { }

  ngAfterViewInit() {
    this.initThree();
  }

  ngOnEnter() {
    // Reload character when entering view
    this.loadCustomCharacter();
  }


  ngOnDestroy() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    if (this.renderer) this.renderer.dispose();
  }

  onCharacterTouch() {
    this.spinSpeed = 0.5;
  }

  initThree() {
    // 1. Setup Canvas
    const container = this.rendererCanvas.nativeElement.parentElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    if (width === 0 || height === 0) {
      setTimeout(() => this.initThree(), 100);
      return;
    }

    // 2. Setup Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x333333);

    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    this.camera.position.set(0, 0, 4); // Adjusted camera to look at torso

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.rendererCanvas.nativeElement,
      antialias: true
    });
    this.renderer.setSize(width, height);

    // 3. Lights
    const light = new THREE.DirectionalLight(0xffffff, 2);
    light.position.set(2, 2, 5);
    this.scene.add(light);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    // 4. LOAD THE CUSTOMIZED CHARACTER
    this.loadCustomCharacter();

    // 5. Start Loop
    this.animate();
  }

  loadCustomCharacter() {
    //if model exists, remove it
    if (this.model) {
      this.scene.remove(this.model);
    }
    const loadout = this.charService.getLoadout();
    console.log('Loading Character with Loadout:', loadout);
    const loader = new GLTFLoader();

    // A. Load the Base Model first
    loader.load(loadout.baseModel!, (gltf) => {
      this.model = gltf.scene;

      // Reset position/scale
      this.model.scale.set(1, 1, 1);
      this.model.position.set(0, -1, 0);
      this.scene.add(this.model);

      // Setup Animation
      if (gltf.animations.length > 0) {
        this.mixer = new THREE.AnimationMixer(gltf.scene);
        const action = this.mixer.clipAction(gltf.animations[0]);
        action.play();
      }

      // B. Load Accessories (now that the base skeleton exists)
      if (loadout.hat) this.attachAccessory(loadout.hat, 'mixamorigHead');
      if (loadout.backpack) this.attachAccessory(loadout.backpack, 'mixamorigSpine2');
      if (loadout.item) this.attachAccessory(loadout.item, 'mixamorigRightHand');

    }, undefined, (err) => console.error('Error loading base model:', err));
  }

  /**
   * Helper to load an accessory and stick it to a bone
   */
  attachAccessory(url: string, boneName: string) {
    const loader = new GLTFLoader();

    // Find the bone on the currently loaded model
    const bone = this.model.getObjectByName(boneName);

    if (!bone) {
      console.warn(`Could not find bone: ${boneName}`);
      return;
    }

    loader.load(url, (gltf) => {
      const accessory = gltf.scene;

      // Optional: Add manual offsets here if needed
      // accessory.position.set(0, 0.1, 0);

      bone.add(accessory);
    });
  }

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());
    const delta = this.clock.getDelta();
    if (this.mixer) this.mixer.update(delta);

    // Spin Logic
    if (this.model && this.spinSpeed > 0.001) {
      this.model.rotation.y += this.spinSpeed;
      this.spinSpeed *= 0.95;
    } else {
      this.spinSpeed = 0;
    }

    this.renderer.render(this.scene, this.camera);
  }
}
