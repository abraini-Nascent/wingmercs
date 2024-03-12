import { IDisposable, Sound } from "@babylonjs/core";
import { Entity, queries } from "../../world";
import { SoundEffects } from "../../../utils/sounds/soundEffects";
import { Vector3FromObj } from "../../../utils/math";

export class AfterburnerSoundSystem implements IDisposable {

  afterburnerSounds = new Map<Entity, Sound>()
  
  constructor() {
    queries.afterburner.onEntityAdded.subscribe(this.afterburnerOnEntityAdded)
    queries.afterburner.onEntityRemoved.subscribe(this.afterburnerOnEntityRemoved)
  }

  dispose(): void {
    queries.afterburner.onEntityAdded.unsubscribe(this.afterburnerOnEntityAdded)
    queries.afterburner.onEntityRemoved.unsubscribe(this.afterburnerOnEntityRemoved)
    this.afterburnerSounds.forEach((sound) => SoundEffects.Silience(sound))
    this.afterburnerSounds.clear()
  }
  
  afterburnerOnEntityAdded = (entity: Entity) => {
    // console.log("afterburner on")
    if (this.afterburnerSounds.has(entity) == false) {
      let sound = SoundEffects.AfterburnerEngine(Vector3FromObj(entity.position))
      sound.attachToMesh(entity.node)
      sound.loop = true
      sound.play()
      sound.setVolume(0)
      sound.setVolume(1, 3)
      this.afterburnerSounds.set(entity, sound)
    }
  }
  afterburnerOnEntityRemoved = (entity) => {
    // console.log("afterburner off")
    if (this.afterburnerSounds.has(entity)) {
      let sound = this.afterburnerSounds.get(entity)
      SoundEffects.Silience(sound)
      this.afterburnerSounds.delete(entity)
    }
  }
}