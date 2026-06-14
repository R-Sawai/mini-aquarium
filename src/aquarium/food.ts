import * as THREE from "three";
import { TANK_HEIGHT } from "./constants";

export class Food {
  mesh: THREE.Mesh;
  isAlive = true;
  private fallSpeed: number;
  private scene: THREE.Scene;
  private onDestroyCallback: (food: Food) => void;

  constructor(
    x: number,
    z: number,
    scene: THREE.Scene,
    onDestroy: (food: Food) => void,
  ) {
    this.scene = scene;
    this.onDestroyCallback = onDestroy;

    const geo = new THREE.SphereGeometry(0.18, 6, 6);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.9,
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.set(x, TANK_HEIGHT / 2 - 0.5, z);
    scene.add(this.mesh);

    this.fallSpeed = 0.015 + Math.random() * 0.01;
  }

  update() {
    if (!this.isAlive) return;
    this.mesh.position.y -= this.fallSpeed;
    if (this.mesh.position.y <= -TANK_HEIGHT / 2 + 0.2) {
      this.destroy();
    }
  }

  destroy() {
    if (!this.isAlive) return;
    this.isAlive = false;
    this.scene.remove(this.mesh);
    this.onDestroyCallback(this);
  }
}
