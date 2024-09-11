import { Color3, Mesh, Quaternion, StandardMaterial, TransformNode, Vector3 } from "@babylonjs/core"
import { queries } from "../../world"

// let targetingBox: Mesh
const DEBUG = false
/**
 * applies the entity's component details to the babylonjs transform node
 */
export function updateRenderSystem() {
  // everything is relative to the camera, the camera entity stays still at 0,0,0 otherwise rendering gets broken at extreme distances
  const origin = queries.origin.first?.position ?? Vector3.Zero()
  for (const { position, node, rotationQuaternion, rotation, scale, targeting, visible, ...entity } of queries.updateRender) {

    let transform = node as TransformNode
    transform.position.x = position.x - origin.x
    transform.position.y = position.y - origin.y
    transform.position.z = position.z - origin.z
    if (rotationQuaternion != null) {
      if (transform.rotationQuaternion == null) {
        transform.rotationQuaternion = Quaternion.Identity()
      }
      transform.rotationQuaternion.x = rotationQuaternion.x
      transform.rotationQuaternion.y = rotationQuaternion.y
      transform.rotationQuaternion.z = rotationQuaternion.z
      transform.rotationQuaternion.w = rotationQuaternion.w
    }
    if (rotation != undefined) {
      transform.rotation.set(rotation.x, rotation.y, rotation.z)
    }
    if (scale != undefined) {
      transform.scaling.set(scale.x, scale.y, scale.z)
    }
    if (visible != undefined && false) {
      for (const mesh of transform.getChildMeshes()) {
        if (mesh.metadata?.keepVisible) {
          mesh.isVisible = true
          continue
        }
        mesh.isVisible = visible
      }
      if (entity.trailMeshs) {
        for (const mesh of entity.trailMeshs.trails) {
          mesh.isVisible = visible
        }
      }
    }

    // temp hack for now
  //   if (targeting != undefined) {
  //     if (targetingBox == undefined) {
  //       targetingBox = MeshBuilder.CreateBox("targetingBox", {size: 10})
  //       const mat = new StandardMaterial("targeting box mat")
  //       mat.diffuseColor = new Color3(1, 0, 0)
  //       mat.emissiveColor = new Color3(1, 0 ,0)
  //       mat.specularColor = new Color3(0,0,0)
  //       targetingBox.material = mat
  //     }
  //     if (targeting.gunInterceptPosition != undefined) {
  //       targetingBox.position.x = targeting.gunInterceptPosition.x
  //       targetingBox.position.y = targeting.gunInterceptPosition.y
  //       targetingBox.position.z = targeting.gunInterceptPosition.z
  //       targetingBox.isVisible = true
  //     } else {
  //       targetingBox.isVisible = false
  //     }
  //   } 
  }
}
