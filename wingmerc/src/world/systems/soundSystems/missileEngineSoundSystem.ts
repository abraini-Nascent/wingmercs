import { IDisposable, Sound, Vector3 } from "@babylonjs/core"
import { Entity, queries, world } from "../../world"
import { SoundEffects } from "../../../utils/sounds/soundEffects"
import { Vector3FromObj } from "../../../utils/math"

export class MissileEngineSoundSystem implements IDisposable {
  engineSounds = new Map<Entity, Sound>()

  constructor() {
    queries.missileEngine.onEntityAdded.subscribe(this.onEntityAdded)
    queries.missileEngine.onEntityRemoved.subscribe(this.onEntityRemoved)
  }

  private onEntityAdded = (entity) => {
    if (!this.engineSounds.has(entity)) {
      let sound = SoundEffects.MissileEngine(entity.node.position)
      // sound.loop = true
      sound.attachToMesh(entity.node)
      sound.play()
      sound.metadata = {
        observer: sound.onEndedObservable.add(() => {
          sound.play(0, 0.75)
        }),
      }
      this.engineSounds.set(entity, sound)
    }
  }

  private onEntityRemoved = (entity) => {
    if (this.engineSounds.has(entity)) {
      let sound = this.engineSounds.get(entity)
      sound.metadata.observer.remove()
      sound.metadata = undefined
      sound.detachFromMesh
      SoundEffects.Silience(sound)
      this.engineSounds.delete(entity)
    }
  }

  dispose(): void {
    queries.missileEngine.onEntityAdded.unsubscribe(this.onEntityAdded)
    queries.missileEngine.onEntityRemoved.unsubscribe(this.onEntityRemoved)
    this.engineSounds.forEach((sound) => {
      SoundEffects.Silience(sound)
    })
    this.engineSounds.clear()
  }
}
