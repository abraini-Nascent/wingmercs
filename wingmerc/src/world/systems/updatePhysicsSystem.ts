import { HavokPlugin, Mesh, PhysicsBody, PhysicsMotionType, PhysicsShape, PhysicsShapeConvexHull, PhysicsShapeMesh, PhysicsShapeSphere, Quaternion, TransformNode, Vector3 } from "@babylonjs/core"
import { queries, world } from "../world"
import { ObjModels } from "../../assetLoader/objModels"
import { AppContainer } from "../../app.container"
import { explodeAsteroid } from "../../map/asteroidScene";

declare module '@babylonjs/core' {
  interface PhysicsBody {
    entityId: number;
  }
}
/**
 * creates the physics body for an entity based on it's "bodyType" component
 */
queries.physics.onEntityAdded.subscribe(
  (() => {
    let i = 0
    return (entity) => {
      const { node, bodyType } = entity
      // create the body
      let physicsType = PhysicsMotionType.DYNAMIC
      if (bodyType == "static") {
        physicsType = PhysicsMotionType.STATIC
      } else if (bodyType == "animated") {
        physicsType = PhysicsMotionType.ANIMATED
      }
      const nodePos = node.position.clone()
      const app = AppContainer.instance
      const body = new PhysicsBody(node, physicsType, false, app.scene)
      // maybe intense but we need to let the body update to the nodes position
      body.disablePreStep = false
      // TODO this should be baked into the glb or a seperate matching glb instead of generated
      // let meshes = node.getChildMeshes()
      // meshes.shift()
      // meshes = meshes.map((mesh) => mesh.clone("meh", node))
      // meshes.forEach((mesh) => mesh.scaling = new Vector3(2, 2, 2))
      // const wholeMesh = Mesh.MergeMeshes(meshes as Mesh[])
      // const hullShape = new PhysicsShapeConvexHull(wholeMesh, app.scene)
      // dispose of merged meshes
      // meshes.forEach((mesh) => mesh.dispose())
      // const sphereShape = new PhysicsShapeSphere(Vector3.Zero(), 1, app.scene)
      let hullShape
      if (entity.hullName) {
        hullShape = (ObjModels[entity.hullName] as TransformNode).getChildMeshes()[0] as Mesh
        hullShape = new PhysicsShapeMesh(hullShape, app.scene)
      } else {
        hullShape = new PhysicsShapeConvexHull(entity.node.getChildMeshes()[0] as Mesh, app.scene)
      }
      body.shape = hullShape
      body.entityId = world.id(entity)
      body.setCollisionCallbackEnabled(true)
      world.addComponent(entity, "body", body)
      node.position.set(nodePos.x, nodePos.y, nodePos.z)
    }
  })()
)
const handleThing = (plugin: HavokPlugin) => {
  plugin.onCollisionObservable.add((collision) => {
    // console.log("[Collision]")
    return
    // what are we going to do with collisions? this is like, every collision in the game
    const colliderEntity = world.entity(collision.collider.entityId)
    const collidedAgainstEntity = world.entity(collision.collidedAgainst.entityId)
    if (colliderEntity == undefined || collidedAgainstEntity == undefined) {
      return
    }
    setTimeout(() => {
      // damage
      if (colliderEntity.health && collidedAgainstEntity.damage) {
        colliderEntity.health -= collidedAgainstEntity.damage
        world.update(collidedAgainstEntity, "damage", 0)
        console.log("Bang")
      }
      if (colliderEntity.damage && collidedAgainstEntity.health) {
        collidedAgainstEntity.health -= colliderEntity.damage
        world.update(colliderEntity, "damage", 0)
        console.log("Bang")
      }
      if (collidedAgainstEntity?.health <= 0) {
        console.log("BOOM")
        explodeAsteroid(collidedAgainstEntity)
        world.remove(collidedAgainstEntity)
      }
      if (colliderEntity?.health <= 0) {
        console.log("BOOM")
        explodeAsteroid(colliderEntity)
        world.remove(colliderEntity)
      }
      // remove spent bullets
      if (colliderEntity.damage) {
        world.remove(colliderEntity)
        // we removed the entity but the mesh and physics still exist and can warp through things...
      }
      if (collidedAgainstEntity.damage) {
        world.remove(collidedAgainstEntity)
      }
    }, 1)
  })
}
if (AppContainer.instance.havokPlugin != undefined) {
  handleThing(AppContainer.instance.havokPlugin)
}
AppContainer.instance.onHavokPlugin.add((plugin) => {
  handleThing(plugin)
})

