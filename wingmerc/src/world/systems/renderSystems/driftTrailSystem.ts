import { IDisposable, TrailMesh, Vector3 } from "@babylonjs/core";
import { Entity, queries } from "../../world";

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
      const { trails } = entity.trailMeshs
      trails.forEach(({trail: trailMesh }) => {
        trailMesh.stop()
        // dirty but better than nothing
        const observer = trailMesh.onBeforeRenderObservable.add(() => {
          trailMesh.material.alpha -= 0.01
          if (trailMesh.material.alpha <= 0) {
            observer.remove()
          }
        })
      })
    }
  }
  driftOnEntityRemoved = (entity: Entity) => {
    console.log("drift off / trail on")
    if (entity.trailMeshs != undefined) {
      const { trails } = entity.trailMeshs
      trails.forEach((trail) => {
        const { trail: trailMesh, node: trailNode } = trail
        let newMesh = trailMesh.clone(trailMesh.name, trailNode)
        newMesh.material = trailMesh.material
        newMesh.material.alpha = 1
        newMesh.start()
        trailMesh.dispose()
        entity.trailMeshs.disposables = entity.trailMeshs.disposables.filter((disposible) => {
          return disposible != trailMesh
        })
        entity.trailMeshs.disposables.push(newMesh)
        trail.trail = newMesh
        return { trail: newMesh, node: trailNode}
      })
    }
  }
}