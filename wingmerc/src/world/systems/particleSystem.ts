import { Vector3 } from "@babylonjs/core"
import { queries, world } from "../world"

export function particleSystem() {
  for (const entity of queries.particle) {
    const { position, range } = entity
    if (position == undefined) {
      // lul wut
      world.removeComponent(entity, "range")
      continue
    }
    const deltaV = new Vector3(range.lastPosition.x, range.lastPosition.y, range.lastPosition.z)
    deltaV.subtractInPlace(new Vector3(position.x, position.y, position.z))
    const delta = deltaV.length()
    range.total += delta
    if (range.total >= range.max) {
      // end of the line
      world.remove(entity)
    }
  }
}