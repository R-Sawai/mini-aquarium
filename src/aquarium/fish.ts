import * as THREE from "three";
import { TANK_WIDTH, TANK_HEIGHT, TANK_DEPTH } from "./constants";
import type { Food } from "./food";

export class Fish {
  group: THREE.Group;
  private velocity: THREE.Vector3;
  private speedLimit: number;
  private wiggleSpeed: number;
  private wigglePhase: number;
  private tailJoint: THREE.Group;
  private scene: THREE.Scene;
  private getFoods: () => Food[];

  constructor(color: number, scene: THREE.Scene, getFoods: () => Food[]) {
    this.scene = scene;
    this.getFoods = getFoods;

    const scale = 0.8 + Math.random() * 0.4;
    this.group = new THREE.Group();

    const bodyGeo = new THREE.SphereGeometry(0.6, 16, 8);
    bodyGeo.scale(1.8, 1, 0.5);
    const bodyMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.3,
      metalness: 0.1,
      flatShading: true,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    this.group.add(body);

    this.tailJoint = new THREE.Group();
    this.tailJoint.position.set(-1.0, 0, 0);
    this.group.add(this.tailJoint);

    const tailGeo = new THREE.ConeGeometry(0.4, 0.8, 4);
    tailGeo.rotateZ(-Math.PI / 2);
    tailGeo.scale(1, 0.2, 1.5);
    const tailMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.4,
      flatShading: true,
    });
    const tail = new THREE.Mesh(tailGeo, tailMat);
    tail.position.set(-0.4, 0, 0);
    tail.castShadow = true;
    this.tailJoint.add(tail);

    const eyeGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(0.6, 0.2, 0.3);
    this.group.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.6, 0.2, -0.3);
    this.group.add(rightEye);

    this.group.scale.set(scale, scale, scale);
    this.group.position.set(
      (Math.random() - 0.5) * (TANK_WIDTH - 4),
      (Math.random() - 0.5) * (TANK_HEIGHT - 4),
      (Math.random() - 0.5) * (TANK_DEPTH - 4),
    );

    this.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.08,
      (Math.random() - 0.5) * 0.04,
      (Math.random() - 0.5) * 0.08,
    );
    this.speedLimit = 0.06 + Math.random() * 0.04;
    this.wiggleSpeed = 10 + Math.random() * 8;
    this.wigglePhase = Math.random() * Math.PI * 2;

    scene.add(this.group);
  }

  update(time: number) {
    this.boundaryAvoidance();
    this.seekFood();
    this.velocity.clampLength(0, this.speedLimit);
    this.group.position.add(this.velocity);

    if (this.velocity.lengthSq() > 0.0001) {
      const targetRotation = Math.atan2(-this.velocity.z, this.velocity.x);
      let diff = targetRotation - this.group.rotation.y;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.group.rotation.y += diff * 0.08;
      const pitch = this.velocity.y * 5;
      this.group.rotation.z += (pitch - this.group.rotation.z) * 0.1;
    }

    const wiggle = Math.sin(time * this.wiggleSpeed + this.wigglePhase) * 0.5;
    this.tailJoint.rotation.y = wiggle;
  }

  private boundaryAvoidance() {
    const boundX = TANK_WIDTH / 2 - 2;
    const boundY = TANK_HEIGHT / 2 - 1.5;
    const boundZ = TANK_DEPTH / 2 - 2;
    const force = 0.005;

    if (this.group.position.x > boundX) this.velocity.x -= force;
    if (this.group.position.x < -boundX) this.velocity.x += force;
    if (this.group.position.y > boundY) this.velocity.y -= force;
    if (this.group.position.y < -boundY) this.velocity.y += force;
    if (this.group.position.z > boundZ) this.velocity.z -= force;
    if (this.group.position.z < -boundZ) this.velocity.z += force;

    this.velocity.x += (Math.random() - 0.5) * 0.002;
    this.velocity.y += (Math.random() - 0.5) * 0.001;
    this.velocity.z += (Math.random() - 0.5) * 0.002;
  }

  private seekFood() {
    const foods = this.getFoods();
    if (foods.length === 0) return;

    let closestFood: Food | null = null;
    let minDist = 999;

    for (const food of foods) {
      const dist = this.group.position.distanceTo(food.mesh.position);
      if (dist < minDist) {
        minDist = dist;
        closestFood = food;
      }
    }

    if (closestFood && minDist < 15) {
      const dir = new THREE.Vector3().subVectors(
        closestFood.mesh.position,
        this.group.position,
      );
      dir.normalize();
      this.velocity.addScaledVector(dir, 0.008);

      if (minDist < 1.0) {
        closestFood.destroy();
        this.speedLimit = 0.15;
        setTimeout(() => {
          this.speedLimit = 0.06 + Math.random() * 0.04;
        }, 1000);
      }
    }
  }

  destroy() {
    this.scene.remove(this.group);
  }
}
