import { queries } from "./../../world"
import { IDisposable, Sound } from "@babylonjs/core"
import { Entity } from "../../world"
import { SoundEffects } from "../../../utils/sounds/soundEffects"
import { Vector3FromObj } from "../../../utils/math"

export class BrakeSoundSystem implements IDisposable {
  brakeSounds = new Map<Entity, Sound>()

  constructor() {
    queries.brake.onEntityAdded.subscribe(this.brakeOnEntityAdded)
    queries.brake.onEntityRemoved.subscribe(this.brakeOnEntityRemoved)
  }

  dispose(): void {
    queries.brake.onEntityAdded.unsubscribe(this.brakeOnEntityAdded)
    queries.brake.onEntityRemoved.unsubscribe(this.brakeOnEntityRemoved)
    this.brakeSounds.forEach((sound) => SoundEffects.Silience(sound))
    this.brakeSounds.clear()
  }

  brakeOnEntityAdded = (entity) => {
    // console.log("brake on")
    if (this.brakeSounds.has(entity) == false) {
      let sound = SoundEffects.BrakeMode(entity.node.position)
      sound.attachToMesh(entity.node)
      sound.loop = true
      sound.play()
      sound.setVolume(0)
      sound.setVolume(SoundEffects.effectsVolume(), 1)
      this.brakeSounds.set(entity, sound)
    }
  }

  brakeOnEntityRemoved = (entity) => {
    // console.log("brake off")
    if (this.brakeSounds.has(entity)) {
      let sound = this.brakeSounds.get(entity)
      sound.detachFromMesh()
      SoundEffects.Silience(sound)
      this.brakeSounds.delete(entity)
    }
  }
}
