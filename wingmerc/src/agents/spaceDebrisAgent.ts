import { DeviceSourceManager, DeviceType, Engine, ParticleSystem, Quaternion, Scene, Texture, TransformNode, Vector3 } from "@babylonjs/core";
import { Entity, FireCommand, MovementCommand, ShipArmor, ShipShields, world } from "../world/world";
import { DegreeToRadian } from "../utils/math";
import { net } from "../net";
import { Dirk } from "../data/ships";
import * as Guns from "../data/guns";
import { Inspector } from "@babylonjs/inspector";
import { AppContainer } from "../app.container";

const CAPACITY = 300
const EMIT_RATE = 10000
const SPAWN_RADIUS = 200
const DESPAWN_DISTANCE = 300
export class SpaceDebrisAgent {
  particleSystem: ParticleSystem

  constructor(scene: Scene) {
    const myParticleSystem = new ParticleSystem("space_debris", CAPACITY, scene)
    myParticleSystem.particleTexture = new Texture("assets/space_debris.png")

    myParticleSystem.emitter = Vector3.Zero()
    myParticleSystem.gravity = Vector3.Zero()
    myParticleSystem.emitRate = EMIT_RATE
    this.particleSystem = myParticleSystem
    
    myParticleSystem.startPositionFunction = (worldMatrix, positionToUpdate, particle, isLocal) => {
        const r = SPAWN_RADIUS// * Math.random()
        const phi = Math.random() * Math.PI * 2;
        const costheta = 2 * Math.random() - 1;
        const theta = Math.acos(costheta);
        const x = r * Math.sin(theta) * Math.cos(phi);
        const y = r * Math.sin(theta) * Math.sin(phi);
        const z = r * Math.cos(theta);
        // particle.position.copyFromFloats(particleSystem.emitter.x+x, particleSystem.emitter.y+y, particleSystem.emitter.z+z)
        Vector3.TransformCoordinatesFromFloatsToRef(x, y, z, worldMatrix, positionToUpdate);
    };

    myParticleSystem.updateFunction = function (particles) {
        for (let index = 0; index < particles.length; index++) {
            var particle = particles[index];
            // particle.age += this._scaledUpdateSpeed;
            if (particle.position.subtract(myParticleSystem.emitter as Vector3).length() > DESPAWN_DISTANCE) {
                // Recycle
                particles.splice(index, 1);
                this._stockParticles.push(particle);
                index--;
                continue;
            }
        }
    };
  }
  /**
   * 
   * @param dt delta time in milliseconds
   */
  update(dt: number) {
    if (AppContainer.instance.player.playerEntity == undefined) {
      if (this.particleSystem.isStarted()) {
        this.particleSystem.stop()
      }
      return
    }
    const playerPosition = AppContainer.instance.player.playerEntity.position;
    (this.particleSystem.emitter as Vector3).copyFromFloats(playerPosition.x, playerPosition.y, playerPosition.z)
    if (this.particleSystem.isStarted() == false) {
      this.particleSystem.start()
    }
  }
}