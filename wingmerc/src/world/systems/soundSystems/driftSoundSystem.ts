import { IDisposable, Sound } from "@babylonjs/core"
import { Entity, queries } from "../../world"
import { SoundEffects } from "../../../utils/sounds/soundEffects"
import { Vector3FromObj } from "../../../utils/math"

export class DriftSoundSystem implements IDisposable {
  driftSounds = new Map<Entity, Sound>()

  constructor() {
    queries.drift.onEntityAdded.subscribe(this.driftOnEntityAdded)
    queries.drift.onEntityRemoved.subscribe(this.driftOnEntityRemoved)
  }
  dispose(): void {
    queries.drift.onEntityAdded.unsubscribe(this.driftOnEntityAdded)
    queries.drift.onEntityRemoved.unsubscribe(this.driftOnEntityRemoved)
    this.driftSounds.forEach((sound) => SoundEffects.Silience(sound))
  }

  driftOnEntityAdded = (entity) => {
    console.log("drift on")
    if (this.driftSounds.has(entity)) {
      let sound = this.driftSounds.get(entity)
      SoundEffects.Silience(sound)
      this.driftSounds.delete(entity)
    }
    let sound = SoundEffects.DriftMode(entity.node.position)
    sound.attachToMesh(entity.node)
    sound.loop = true
    sound.play()
    sound.setVolume(0)
    sound.setVolume(SoundEffects.effectsVolume(), 1)
    this.driftSounds.set(entity, sound)
  }
  driftOnEntityRemoved = (entity) => {
    console.log("drift off")
    if (this.driftSounds.has(entity)) {
      let sound = this.driftSounds.get(entity)
      sound.detachFromMesh()
      SoundEffects.Silience(sound)
      this.driftSounds.delete(entity)
    }
  }
}
