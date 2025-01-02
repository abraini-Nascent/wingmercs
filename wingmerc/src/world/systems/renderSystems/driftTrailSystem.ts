import { IDisposable, TrailMesh, Vector3 } from "@babylonjs/core"
import { Entity, queries } from "../../world"

export class DriftTrailSystem implements IDisposable {
  constructor() {
    queries.drift.onEntityAdded.subscribe(this.driftOnEntityAdded)
    queries.drift.onEntityRemoved.subscribe(this.driftOnEntityRemoved)
  }
  dispose(): void {
    queries.drift.onEntityAdded.unsubscribe(this.driftOnEntityAdded)
    queries.drift.onEntityRemoved.unsubscribe(this.driftOnEntityRemoved)
  }

  driftOnEntityAdded = (entity: Entity) => {
    console.log("drift on / trail off")
    if (entity.trailMeshs != undefined) {
      const { particleSystems } = entity.trailMeshs
      particleSystems.forEach((sps) => {
        sps.paused = true
      })
    }
  }
  driftOnEntityRemoved = (entity: Entity) => {
    console.log("drift off / trail on")
    if (entity.trailMeshs != undefined) {
      const { particleSystems } = entity.trailMeshs
      particleSystems.forEach((sps) => {
        sps.paused = false
      })
    }
  }
}
