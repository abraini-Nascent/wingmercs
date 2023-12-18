import { TrailMesh, TransformNode, Vector3 } from "@babylonjs/core"
import { queries, world } from "../world"
import { AppContainer } from "../../app.container"

export function moveSystem() {
  for (const { position, velocity, acceleration } of queries.moving) {
    velocity.x += acceleration.x
    velocity.y += acceleration.y
    velocity.z += acceleration.z
    // TODO: if velocity shoots over cap, 
    // we still want the plane to move in the direction of the accelleration
    // but not move any faster
    // so we should normalize the new velocity vector
    // and then multiply it by it's max speed
    position.x += velocity.x / 1000
    position.y += velocity.y / 1000
    position.z += velocity.z / 1000
  }
}

const ArenaRadius = 100;
export function warpSystem() {
  for (const entity of queries.moving) {
    const { position, velocity, acceleration } = entity
    const posVec = new Vector3(position.x, position.y, position.z)
    const distanceFromCenter = posVec.length()
    if (distanceFromCenter < ArenaRadius) {
      continue
    }
    const overshot = ArenaRadius - distanceFromCenter
    // find other side of sphere
    posVec.normalize()
    posVec.negateInPlace()
    posVec.scaleInPlace(ArenaRadius)
    // add the offset distance the item passed through the zone
    const offsetVec = new Vector3(position.x, position.y, position.z)
    offsetVec.normalize()
    offsetVec.scaleInPlace(overshot)
    posVec.addInPlace(offsetVec)
    let { trailMesh, node } = entity
    let oldPosition = new Vector3(position.x, position.y, position.z)
    // set the entity properties
    position.x = posVec.x
    position.y = posVec.y
    position.z = posVec.z
    
    if (trailMesh != undefined && node != undefined) {
      // stop and start to reset trail
      let oldMesh = trailMesh
      const appContainer = AppContainer.instance
      const newNode = new TransformNode("warp", appContainer.scene)
      newNode.position.set(oldPosition.x, oldPosition.y, oldPosition.z)
      oldMesh.setParent(newNode)
      oldMesh.stop()
      appContainer.scene.onAfterRenderObservable.addOnce(() => {
        let newTrailMesh = new TrailMesh(oldMesh.name, node, appContainer.scene, 0.2, 100)
        newTrailMesh.material = oldMesh.material
        world.update(entity, "trailMesh", newTrailMesh)
      })
      setTimeout(() => {
        oldMesh.isVisible = false
        oldMesh.dispose()
        newNode.dispose()
      }, 1000)
    }
  }
}