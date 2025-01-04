import { Color3, IDisposable, Scalar, StandardMaterial, TmpColors } from "@babylonjs/core"
import { AppContainer } from "../../../app.container"
import { Entity, queries } from "../../world"
import { debugLog } from "../../../utils/debuglog"

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
    debugLog("[AfterburnerTrails] on")
    const { trailMeshs, trailOptions } = entity
    let entityHidden = entity as any
    if (entityHidden.afterburnerAnimation) {
      if (entityHidden.afterburnerAnimation.remove) {
        entityHidden.afterburnerAnimation.remove()
        entityHidden.afterburnerAnimation = undefined
      }
    }
    let duration = 0
    let observer = AppContainer.instance.scene.onAfterRenderObservable.add((scene) => {
      const dt = Math.min(1000, scene.getEngine().getDeltaTime())
      duration += dt
      const scale = duration / 1000
      let target = TmpColors.Color3[0]
      target.set(235 / 255, 113 / 255, 52 / 255)
      let start = TmpColors.Color3[2]
      const trailOption = trailOptions[0] ?? { color: { r: 0.25, g: 0.25, b: 1.0 } }
      start.set(trailOption?.color?.r ?? 1, trailOption?.color?.g ?? 1, trailOption?.color?.b ?? 1)
      let result = TmpColors.Color3[1]
      // 100% in one second
      Color3.LerpToRef(start, target, scale, result)
      for (let i = 0; i < trailMeshs.particleSystems.length; i += 1) {
        const sps = trailMeshs.particleSystems[i]
        sps.colorGradients[0].color1.r = result.r
        sps.colorGradients[0].color1.g = result.g
        sps.colorGradients[0].color1.b = result.b
        const trailOption = trailOptions[i]
      }
      if (entity.engineMesh != undefined) {
        const engineMat = entity.engineMesh.material as StandardMaterial
        if (engineMat.emissiveColor) {
          engineMat.emissiveColor.copyFrom(result)
        } else {
          engineMat.emissiveColor = target.clone()
        }
        // engineMat.diffuseColor.copyFrom(result)
      }
      if (duration >= 1000) {
        observer.remove()
        entityHidden.afterburnerAnimation = undefined
      }
    })
    entityHidden.afterburnerAnimation = observer
  }

  afterburnerTrailsOnEntityRemoved = (entity: Entity) => {
    debugLog("[AfterburnerTrails] off")
    const { trailMeshs, trailOptions } = entity
    let entityHidden = entity as any
    if (entityHidden.afterburnerAnimation) {
      if (entityHidden.afterburnerAnimation.remove) {
        entityHidden.afterburnerAnimation.remove()
        entityHidden.afterburnerAnimation = undefined
      }
    }
    let duration = 0
    let observer = AppContainer.instance.scene.onAfterRenderObservable.add((scene) => {
      let dt = Math.min(1000, scene.getEngine().getDeltaTime())
      duration += dt
      let start = TmpColors.Color3[0]
      start.set(235 / 255, 113 / 255, 52 / 255)
      let target = TmpColors.Color3[1]
      target.set(
        trailOptions[0]?.color?.r ?? 0.25,
        trailOptions[0]?.color?.g ?? 0.25,
        trailOptions[0]?.color?.b ?? 0.25
      )
      const scale = duration / 1000
      // 100% in one second
      let result = TmpColors.Color3[2]
      Color3.LerpToRef(start, target, scale, result)
      for (let i = 0; i < trailMeshs.particleSystems.length; i += 1) {
        const sps = trailMeshs.particleSystems[i]
        sps.colorGradients[0].color1.r = result.r
        sps.colorGradients[0].color1.g = result.g
        sps.colorGradients[0].color1.b = result.b
        const trailOption = trailOptions[i]
      }
      if (entity.engineMesh != undefined) {
        const engineMat = entity.engineMesh.material as StandardMaterial
        if (engineMat.emissiveColor) {
          engineMat.emissiveColor.copyFrom(result)
        } else {
          engineMat.emissiveColor = result.clone()
        }
        // engineMat.diffuseColor.copyFrom(result)
      }
      if (duration >= 1000) {
        observer.remove()
        entityHidden.afterburnerAnimation = undefined
      }
    })
    entityHidden.afterburnerAnimation = observer
  }
}
