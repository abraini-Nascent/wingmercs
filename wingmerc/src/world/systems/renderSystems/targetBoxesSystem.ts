import { Color3, IDisposable, Mesh, MeshBuilder, StandardMaterial, Texture, TmpVectors, Vector3 } from "@babylonjs/core"
import { AppContainer } from "../../../app.container"
import { Entity, queries, world } from "../../world"
import { PlayerAgent } from "../../../agents/playerAgent"
import { Vector3FromObj } from "../../../utils/math"
import { debugLog } from "../../../utils/debuglog"

let i = 0
const referenceDistance = 10 // e.g., 10 units
const referenceSize = 1 // e.g., 1 unit
/**
 * creates the meshes and transform nodes for target box planes for an entity based on it's "targetable" component
 */
export class TargetBoxesSystem implements IDisposable {
  targetQuery
  targetBoxTexture: Texture
  talkBoxTexture: Texture
  lockBoxTexture: Texture
  interceptBoxTexture: Texture
  destinationTexture: Texture
  constructor() {
    this.targetQuery = queries.targets.with("node")
    this.targetQuery.onEntityAdded.subscribe(this.targetableOnEntityAdded)
    this.targetQuery.onEntityRemoved.subscribe(this.targetableOnEntityRemoved)
    const destinationTexture = new Texture(
      "assets/crosshairs/crosshairs_16.png",
      undefined,
      undefined,
      false,
      Texture.NEAREST_LINEAR
    )
    destinationTexture.hasAlpha = true
    this.destinationTexture = destinationTexture
  }

  dispose(): void {
    this.targetQuery.onEntityAdded.unsubscribe(this.targetableOnEntityAdded)
    this.targetQuery.onEntityRemoved.unsubscribe(this.targetableOnEntityRemoved)
  }

  targetableOnEntityAdded = (entity: Entity) => {
    if (entity.currentPlayer || (AppContainer.instance.player && entity.playerId == PlayerAgent.playerId)) {
      // no target box on player
      debugLog("[TargetBoxesSystem] no target box around the player's ship")
      return
    }
    let node = entity.node
    const scene = AppContainer.instance.scene
    // create the plane
    debugLog("[TargetBoxesSystem] creating target box for entity", entity)
    if (this.targetBoxTexture == undefined) {
      const targetBoxTexture = new Texture(
        "assets/crosshairs/crosshairs_63.png",
        undefined,
        undefined,
        false,
        Texture.NEAREST_LINEAR
      )
      targetBoxTexture.hasAlpha = true
      this.targetBoxTexture = targetBoxTexture
    }
    if (this.lockBoxTexture == undefined) {
      const lockBoxTexture = new Texture(
        "assets/crosshairs/crosshairs_39.png",
        undefined,
        undefined,
        false,
        Texture.NEAREST_LINEAR
      )
      lockBoxTexture.hasAlpha = true
      this.lockBoxTexture = lockBoxTexture
    }
    if (this.talkBoxTexture == undefined) {
      const talkBoxTexture = new Texture(
        "assets/crosshairs/crosshairs_39.png",
        undefined,
        undefined,
        false,
        Texture.NEAREST_LINEAR
      )
      talkBoxTexture.hasAlpha = true
      this.talkBoxTexture = talkBoxTexture
    }
    if (this.interceptBoxTexture == undefined) {
      const interceptBoxTexture = new Texture(
        "assets/crosshairs/crosshairs_02.png",
        undefined,
        undefined,
        false,
        Texture.NEAREST_LINEAR
      )
      interceptBoxTexture.hasAlpha = true
      this.interceptBoxTexture = interceptBoxTexture
    }
    const targetBoxMaterial = new StandardMaterial("targetBoxMaterial")
    const talkBoxMaterial = new StandardMaterial("targetBoxMaterial")
    targetBoxMaterial.diffuseTexture = this.targetBoxTexture
    talkBoxMaterial.diffuseTexture = this.talkBoxTexture
    talkBoxMaterial.diffuseColor = Color3.White()
    talkBoxMaterial.emissiveColor = Color3.White()
    talkBoxMaterial.specularColor = Color3.Black()
    let targetColor: Color3
    switch (entity.isTargetable) {
      case "enemy": {
        const player = AppContainer.instance.player?.playerEntity
        if (player && entity.teamId == player.teamId) {
          targetColor = Color3.Blue()
        } else {
          targetColor = Color3.Red()
        }
        break
      }
      case "player": {
        targetColor = Color3.Blue()
        break
      }
      case "nav": {
        targetColor = Color3.White()
        break
      }
      default: {
        targetColor = Color3.Yellow()
        break
      }
    }
    targetBoxMaterial.diffuseTexture = this.targetBoxTexture
    targetBoxMaterial.diffuseColor = targetColor
    targetBoxMaterial.emissiveColor = targetColor
    targetBoxMaterial.specularColor = Color3.Black()
    // targetBoxMaterial.useAlphaFromDiffuseTexture = true
    const targetBoxPlane = MeshBuilder.CreatePlane("constantSizePlaneTargetBox", { size: referenceSize }, scene)
    targetBoxPlane.ignoreCameraMaxZ = true
    targetBoxPlane.material = targetBoxMaterial
    targetBoxPlane.billboardMode = Mesh.BILLBOARDMODE_ALL
    const talkBoxPlane = MeshBuilder.CreatePlane("constantSizePlaneTalkBox", { size: referenceSize }, scene)
    talkBoxPlane.ignoreCameraMaxZ = true
    talkBoxPlane.material = talkBoxMaterial
    talkBoxPlane.billboardMode = Mesh.BILLBOARDMODE_ALL

    // Position the plane at the mesh position
    // targetBoxPlane.parent = node

    const interceptBoxMaterial = new StandardMaterial("interceptBoxMaterial")
    interceptBoxMaterial.diffuseTexture = this.interceptBoxTexture
    interceptBoxMaterial.diffuseColor = targetColor
    interceptBoxMaterial.emissiveColor = targetColor
    interceptBoxMaterial.specularColor = Color3.Black()

    const interceptBoxPlane = MeshBuilder.CreatePlane("constantSizePlaneInterceptBox", { size: referenceSize }, scene)
    interceptBoxPlane.ignoreCameraMaxZ = true
    interceptBoxPlane.material = interceptBoxMaterial
    interceptBoxPlane.billboardMode = Mesh.BILLBOARDMODE_ALL
    interceptBoxPlane.isVisible = false
    let edgeRendering = false
    let observer = targetBoxPlane.getScene().onBeforeRenderObservable.add(() => {
      const camera = AppContainer.instance.camera
      const origin = queries.origin.first?.position ? Vector3FromObj(queries.origin.first.position) : Vector3.Zero()
      // const origin = Vector3FromObj(originEntity.position)

      // Get the current distance from the camera to the mesh
      let distance = Vector3.Distance(origin, Vector3FromObj(entity.position))
      let newLocation = Vector3FromObj(entity.position, TmpVectors.Vector3[3])
      if (distance > 1000) {
        // if we are further than a 1000m radius we will move the node to 1000m in the direction of the target
        let entityPosition = Vector3FromObj(entity.position, TmpVectors.Vector3[0])
        let directionToEntity = entityPosition.subtractToRef(origin, TmpVectors.Vector3[1])
        let alpha = 1000 / distance
        let offset = directionToEntity.multiplyByFloats(alpha, alpha, alpha)
        newLocation = TmpVectors.Vector3[2].copyFrom(origin).addInPlace(offset)
        // debugLog("[TargetBoxesSystem] new position and distance", newLocation, distance * alpha, alpha)
        distance = distance * alpha
      }

      // Calculate the new size for the plane
      const newSize = referenceSize * (distance / referenceDistance)
      const player = AppContainer.instance.player?.playerEntity
      if (player == undefined) {
        return
      }
      if (
        player &&
        player.targeting &&
        (player.targeting.target == entity.id || player.targeting.destination == entity.id)
      ) {
        targetBoxPlane.isVisible = true
        if (player.targeting.destination == entity.id) {
          targetBoxMaterial.diffuseTexture = this.destinationTexture
        } else {
          if (player.targeting.locked) {
            if (targetBoxMaterial.diffuseTexture != this.lockBoxTexture) {
              targetBoxMaterial.diffuseTexture = this.lockBoxTexture
            }
          } else {
            if (targetBoxMaterial.diffuseTexture != this.targetBoxTexture) {
              targetBoxMaterial.diffuseTexture = this.targetBoxTexture
            }
          }

          if (player.targeting.gunInterceptPosition.active) {
            interceptBoxPlane.isVisible = true
            interceptBoxPlane.position.x = player.targeting.gunInterceptPosition.x - origin.x
            interceptBoxPlane.position.y = player.targeting.gunInterceptPosition.y - origin.y
            interceptBoxPlane.position.z = player.targeting.gunInterceptPosition.z - origin.z

            const interceptDistance = Vector3.Distance(
              origin,
              Vector3FromObj(player.targeting.gunInterceptPosition, TmpVectors.Vector3[0])
            )
            const interceptSize = referenceSize * (interceptDistance / referenceDistance)
            interceptBoxPlane.scaling.x = interceptSize
            interceptBoxPlane.scaling.y = interceptSize
          } else {
            interceptBoxPlane.isVisible = false
          }
        }
      } else {
        targetBoxPlane.isVisible = false
        interceptBoxPlane.isVisible = false
        talkBoxPlane.isVisible = false
      }
      if (entity.speaking != undefined && talkBoxPlane.isVisible == false) {
        talkBoxPlane.isVisible = true
      } else if (entity.speaking == undefined && talkBoxPlane.isVisible == true) {
        talkBoxPlane.isVisible = false
      }
      // Update the plane position and size
      targetBoxPlane.position.x = newLocation.x - origin.x
      targetBoxPlane.position.y = newLocation.y - origin.y
      targetBoxPlane.position.z = newLocation.z - origin.z
      targetBoxPlane.scaling.x = newSize
      targetBoxPlane.scaling.y = newSize
      talkBoxPlane.position.copyFrom(targetBoxPlane.position)
      talkBoxPlane.scaling.x = newSize
      talkBoxPlane.scaling.y = newSize
    })

    node.onDisposeObservable.addOnce(() => {
      observer.remove()
      observer = undefined
      targetBoxPlane.dispose(false, true)
      interceptBoxPlane.dispose(false, true)
      talkBoxPlane.dispose(false, true)
      debugLog("[TargetBoxesSystem] removing target box for entity", entity)
    })
  }

  targetableOnEntityRemoved = (entity) => {}
}
