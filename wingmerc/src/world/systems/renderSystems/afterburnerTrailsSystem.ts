import { Color3, IDisposable, Scalar, StandardMaterial, TmpColors } from "@babylonjs/core"
import { AppContainer } from "../../../app.container"
import { Entity, queries } from "../../world"

export class AfterburnerTrailsSystem implements IDisposable {
  
  constructor() {
    queries.afterburnerTrails.onEntityAdded.subscribe(this.afterburnerTrailsOnEntityAdded)
    queries.afterburnerTrails.onEntityRemoved.subscribe(this.afterburnerTrailsOnEntityRemoved)
  }

  dispose(): void {
    queries.afterburnerTrails.onEntityAdded.unsubscribe(this.afterburnerTrailsOnEntityAdded)
    queries.afterburnerTrails.onEntityRemoved.unsubscribe(this.afterburnerTrailsOnEntityRemoved)
  }

  afterburnerTrailsOnEntityAdded = (entity: Entity) => {
    const {trailMeshs, trailOptions} = entity
    let entityHidden = entity as any
    if (entityHidden.afterburnerAnimation) {
      if (entityHidden.afterburnerAnimation.remove) {
        entityHidden.afterburnerAnimation.remove()
        entityHidden.afterburnerAnimation = undefined
      }
    }
    let duration = 0
    let observer = AppContainer.instance.scene.onAfterRenderObservable.add((scene) => {
      const dt = scene.getEngine().getDeltaTime()
      duration += dt
      const scale = duration / 1000
      for (let i = 0; i < trailMeshs.trails.length; i += 1) {
        const trailMesh = trailMeshs.trails[i]
        const trailOption = trailOptions[i]
        let mat = trailMesh.trail.material as StandardMaterial
        
        let target = TmpColors.Color3[0]
        target.set(235/255, 113/255, 52/255)
        let start = TmpColors.Color3[2]
        start.set(trailOption?.color?.r ?? 1, trailOption?.color?.g ?? 1, trailOption?.color?.b ?? 1)
        let result = TmpColors.Color3[1]
        // 100% in one second
        Color3.LerpToRef(start, target, scale, result)

        mat.emissiveColor.copyFrom(result)
        trailMesh.trail.diameter = Scalar.Lerp(0.2, 1, scale)
        if (entity.engineMesh != undefined) {
          const engineMat = entity.engineMesh.material as StandardMaterial
          if (mat.emissiveColor) {
            engineMat.emissiveColor.copyFrom(result)
          } else {
            engineMat.emissiveColor = target.clone()
          }
          // engineMat.diffuseColor.copyFrom(result)
        }
      }
      if (duration >= 1000) {
        observer.remove()
        entityHidden.afterburnerAnimation = undefined
      }
    })
    entityHidden.afterburnerAnimation = observer
  }

  afterburnerTrailsOnEntityRemoved = (entity: Entity) => {
    const {trailMeshs, trailOptions} = entity
    let entityHidden = entity as any
    if (entityHidden.afterburnerAnimation) {
      if (entityHidden.afterburnerAnimation.remove) {
        entityHidden.afterburnerAnimation.remove()
        entityHidden.afterburnerAnimation = undefined
      }
    }
    let duration = 0
    let observer = AppContainer.instance.scene.onAfterRenderObservable.add((scene) => {
      let dt = scene.getEngine().getDeltaTime()
      duration += dt
      for (let i = 0; i < trailMeshs.trails.length; i += 1) {
        const trailMesh = trailMeshs.trails[i]
        const trailOption = trailOptions[i]
        let mat = trailMesh.trail.material as StandardMaterial
        let start = TmpColors.Color3[0]
        start.set(235/255, 113/255, 52/255)
        let target = TmpColors.Color3[1]
        target.set(trailOption?.color?.r ?? 1, trailOption?.color?.g ?? 1, trailOption?.color?.b ?? 1)
        const scale = duration / 1000
        // 100% in one second
        let result = TmpColors.Color3[2]
        Color3.LerpToRef(start, target, scale, result)
        mat.emissiveColor.copyFrom(result)
        trailMesh.trail.diameter = Scalar.Lerp(1, 0.2, scale)
        if (entity.engineMesh != undefined) {
          const engineMat = entity.engineMesh.material as StandardMaterial
          if (mat.emissiveColor) {
            engineMat.emissiveColor.copyFrom(result)
          } else {
            engineMat.emissiveColor = result.clone()
          }
          // engineMat.diffuseColor.copyFrom(result)
        }
      }
      if (duration >= 1000) {
        observer.remove()
        entityHidden.afterburnerAnimation = undefined
      }
    })
    entityHidden.afterburnerAnimation = observer
  }
}