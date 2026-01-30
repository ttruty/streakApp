import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';

@Component({
  selector: 'app-three-background',
  standalone: true,
  imports: [CommonModule],
  template: `
    <canvas #bgCanvas></canvas>
  `,
  styles: [`
    :host {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: -1;
      overflow: hidden;
      pointer-events: none;
    }
    canvas {
      display: block;
      width: 100%;
      height: 100%;
    }
  `]
})
export class ThreeBackgroundComponent implements OnInit, OnDestroy {
  @ViewChild('bgCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  @Input() set effect(value: 'stars' | 'grid') {
    this._effect = value;
    if (this.scene) this.loadEffect(value);
  }

  private _effect: 'stars' | 'grid' = 'stars';
  private renderer!: THREE.WebGLRenderer;

  // --- TYPO FIXED HERE ---
  private scene!: THREE.Scene;
  // -----------------------

  private camera!: THREE.PerspectiveCamera;
  private frameId: number = 0;

  private particles!: THREE.Points;
  private grid!: THREE.GridHelper;

  constructor() {}

  ngOnInit() {
    this.initThree();
    this.loadEffect(this._effect);
    this.animate();
    window.addEventListener('resize', this.onResize);
  }

  ngOnDestroy() {
    if (this.frameId) cancelAnimationFrame(this.frameId);
    window.removeEventListener('resize', this.onResize);
    if (this.renderer) this.renderer.dispose();
  }

  private initThree() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.scene = new THREE.Scene(); // Now this works

    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.camera.position.z = 5;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvasRef.nativeElement,
      alpha: true,
      antialias: true
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
  }

  private loadEffect(type: 'stars' | 'grid') {
    while(this.scene.children.length > 0){
      this.scene.remove(this.scene.children[0]);
    }

    if (type === 'stars') {
      this.createStarfield();
    } else {
      this.createDigitalGrid();
    }
  }

  private createStarfield() {
    // this.scene.background = new THREE.Color(0x050510); // Optional: Use if not transparent

    const geometry = new THREE.BufferGeometry();
    const count = 2000;
    const posArray = new Float32Array(count * 3);

    for(let i = 0; i < count * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 15;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    const material = new THREE.PointsMaterial({
      size: 0.02,
      color: 0xffffff,
      transparent: true,
      opacity: 0.8
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  private createDigitalGrid() {
    // this.scene.background = new THREE.Color(0x110011); // Optional

    this.grid = new THREE.GridHelper(50, 50, 0x00ffff, 0xff00ff);
    this.grid.position.y = -1;
    this.scene.add(this.grid);

    this.scene.fog = new THREE.FogExp2(0x110011, 0.15);
  }

  private animate() {
    this.frameId = requestAnimationFrame(() => this.animate());

    if (this._effect === 'stars' && this.particles) {
      this.particles.rotation.y += 0.0005;
      this.particles.rotation.x += 0.0002;
    }

    if (this._effect === 'grid' && this.grid) {
      this.grid.position.z = (Date.now() * 0.002) % 1;
    }

    this.renderer.render(this.scene, this.camera);
  }

  private onResize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }
}
