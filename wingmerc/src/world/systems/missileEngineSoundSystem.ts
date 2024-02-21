import { Sound, Vector3 } from "@babylonjs/core"
import { Entity, queries, world } from "../world"
import { SoundEffects } from "../../utils/sounds/soundEffects"
import { Vector3FromObj } from "../../utils/math"

export const EngineSounds = new Map<Entity, Sound>()

queries.missileEngine.onEntityAdded.subscribe((entity) => {
  if (!EngineSounds.has(entity)) {
    let sound = SoundEffects.MissileEngine(Vector3FromObj(entity.position))
    sound.attachToMesh(entity.node)
    EngineSounds.set(entity, sound)
  }
})

queries.missileEngine.onEntityRemoved.subscribe((entity) => {
  if (EngineSounds.has(entity)) {
    let sound = EngineSounds.get(entity)
    SoundEffects.Silience(sound)
    EngineSounds.delete(entity)
  }
})