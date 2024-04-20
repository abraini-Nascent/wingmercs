import { IDisposable, Mesh, PhysicsBody, PhysicsMotionType, PhysicsShapeContainer, PhysicsShapeConvexHull, PhysicsShapeMesh, PhysicsShapeSphere, Quaternion, TransformNode, Vector3 } from "@babylonjs/core"
import { Entity, queries, world } from "../../world"
import { ObjModels } from "../../../assetLoader/objModels"
import { AppContainer } from "../../../app.container"
import { ToRadians } from "../../../utils/math";

declare module '@babylonjs/core' {
  interface PhysicsBody {
    entityId: number;
  }
}
let i = 0
/**
 * creates the physics body for an entity based on it's "bodyType" component
 */
export class UpdatePhysicsSystem implements IDisposable {

  constructor () {
    queries.physics.onEntityAdded.subscribe(this.physicsOnEntityAdded)
  }

  dispose(): void {
    queries.physics.onEntityAdded.unsubscribe(this.physicsOnEntityAdded)
  }

  private physicsOnEntityAdded = (entity: Entity) => {
    const { node, bodyType } = entity
    console.log(`[PhysicsSystem] creating body for [${world.id(entity)}]"${entity.targetName}"`)
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
    if (entity.physicsMeshName) {
      let hullShapeMesh = (ObjModels[entity.physicsMeshName] as TransformNode).getChildMeshes()[1] as Mesh
      // HACK: I don't know why but when I add the imported mesh as a physics mesh it's upside down.
      hullShapeMesh = new Mesh("entity hull", AppContainer.instance.scene, undefined, hullShapeMesh, false, false)
      let physicsHullShape = new PhysicsShapeMesh(hullShapeMesh, app.scene)
      let hullShapeContainer = new PhysicsShapeContainer(AppContainer.instance.scene)
      hullShapeContainer.addChild(physicsHullShape, undefined, Quaternion.RotationAxis(Vector3.Forward(true), ToRadians(180)))
      hullShape = hullShapeContainer
      // hullShapeMesh = hullShapeMesh.createInstance("entity hull")
      // hullShapeMesh.rotate(Vector3.Forward(true), ToRadians(180))
      // hullShapeMesh.bakeCurrentTransformIntoVertices()
      // let physicsHullShape = new PhysicsShapeMesh(hullShapeMesh as unknown as Mesh, app.scene)
      // hullShapeMesh.rotate(Vector3.Forward(true), ToRadians(180))
      // hullShapeMesh.bakeCurrentTransformIntoVertices()
      hullShapeMesh.dispose()
      // hullShape = physicsHullShape
    } else if (entity.physicsRadius != undefined) {
      hullShape = new PhysicsShapeSphere(Vector3.Zero(), entity.physicsRadius, app.scene)
    } else {
      hullShape = new PhysicsShapeConvexHull(entity.node.getChildMeshes()[0] as Mesh, app.scene)
    }
    console.log(`[PhysicsSystem] shape ${hullShape} type ${bodyType}/${physicsType}`)
    body.shape = hullShape
    body.entityId = world.id(entity)
    body.setCollisionCallbackEnabled(true)
    setInterval(()=> {
      body.transformNode.rotate(Vector3.Forward(true), ToRadians(1))
    }, 300)
    
    world.addComponent(entity, "body", body)
    node.position.set(nodePos.x, nodePos.y, nodePos.z)
  }
}
