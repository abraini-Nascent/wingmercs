import { DeviceSourceManager, DeviceType, Engine, IDisposable, ParticleSystem, Quaternion, Scene, Texture, TransformNode, Vector3 } from "@babylonjs/core";
import { AppContainer } from "../app.container";

const CAPACITY = 300
const EMIT_RATE = 10000
const SPAWN_RADIUS = 200
const DESPAWN_DISTANCE = 300
export class SpaceDebrisAgent implements IDisposable {
  particleSystem: ParticleSystem

  constructor(scene: Scene) {
    const myParticleSystem = new ParticleSystem("space_debris", CAPACITY, scene)
    myParticleSystem.particleTexture = new Texture("assets/particles/space_debris.png", scene, null, null, Texture.NEAREST_SAMPLINGMODE)

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
  dispose(): void {
    this.particleSystem.dispose()
    this.particleSystem.updateFunction = undefined
    this.particleSystem.startPositionFunction = undefined
    this.particleSystem = undefined
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