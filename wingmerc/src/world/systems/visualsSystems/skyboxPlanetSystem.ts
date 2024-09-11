import { Color3, Color4, DeviceSourceManager, DeviceType, Engine, IDisposable, Matrix, Mesh, MeshBuilder, ParticleSystem, Quaternion, Scene, StandardMaterial, Texture, TransformNode, Vector3, VertexBuffer } from "@babylonjs/core";
import { pointOnSphere } from "../../../utils/math";
import { Planetoids } from "../../../utils/planetoids";
import { rand } from "../../../utils/random";

const createAtmo = false
const CAPACITY = 300
const EMIT_RATE = 10000
const SPAWN_RADIUS = 200
const DESPAWN_DISTANCE = 300
export class SkyboxPlanetSystem implements IDisposable {
  static pause = false
  paused = false

  planetoids: Planetoids[] = []

  constructor() {
    // for (let i = 0; i < rand(1, 3); i += 1) {
      this.planetoids.push(new Planetoids({
        ocean: true
      }))
    // }
  }

  dispose(): void {
    this.planetoids.forEach(planetoid => planetoid.dispose())
  }
  /**
   * 
   * @param dt delta time in milliseconds
   */
  update(dt: number) {
    
  }
}