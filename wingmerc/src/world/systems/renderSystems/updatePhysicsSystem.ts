import {
  IDisposable,
  Mesh,
  PhysicsBody,
  PhysicsMotionType,
  PhysicsShapeContainer,
  PhysicsShapeConvexHull,
  PhysicsShapeMesh,
  PhysicsShapeSphere,
  Quaternion,
  TransformNode,
  Vector3,
} from "@babylonjs/core"
import { Entity, EntityUUID, queries, world } from "../../world"
import { ObjModels } from "../../../assetLoader/objModels"
import { AppContainer } from "../../../app.container"
import { ToRadians } from "../../../utils/math"
import { debugLog } from "../../../utils/debuglog"

const DEBUG = false
declare module "@babylonjs/core" {
  interface PhysicsBody {
    entityId: EntityUUID
  }
}
let count = 0

/**
 * creates the physics body for an entity based on it's "bodyType" component
 */
export class UpdatePhysicsSystem implements IDisposable {
  constructor() {
    debugLog(`[PhysicsSystem] constructed`)
    queries.physics.onEntityAdded.subscribe(this.physicsOnEntityAdded)
    queries.physics.onEntityRemoved.subscribe(this.physicsOnEntityRemoved)
  }

  dispose(): void {
    debugLog(`[PhysicsSystem] disposed`)
    queries.physics.onEntityAdded.unsubscribe(this.physicsOnEntityAdded)
    queries.physics.onEntityRemoved.unsubscribe(this.physicsOnEntityRemoved)
  }

  private physicsOnEntityAdded = (entity: Entity) => {
    const { node, bodyType } = entity
    DEBUG && debugLog(`[PhysicsSystem] creating body for [${entity.id}]"${entity.targetName}"`)
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
    let hullShape

    if (entity.physicsMeshName) {
      let hullShapeMesh = (ObjModels[entity.physicsMeshName] as TransformNode).getChildMeshes()[1] as Mesh
      // HACK: I don't know why but when I add the imported mesh as a physics mesh it's upside down.
      hullShapeMesh = new Mesh("entity hull", AppContainer.instance.scene, undefined, hullShapeMesh, false, false)
      const physicsHullShape = new PhysicsShapeMesh(hullShapeMesh, app.scene)
      const hullShapeContainer = new PhysicsShapeContainer(AppContainer.instance.scene)
      hullShapeContainer.addChild(
        physicsHullShape,
        undefined,
        Quaternion.RotationAxis(Vector3.Forward(true), ToRadians(180))
      )
      hullShape = hullShapeContainer
      hullShapeMesh.dispose()
      // hullShape = physicsHullShape
    } else if (entity.physicsUseRadius && entity.physicsRadius != undefined) {
      hullShape = new PhysicsShapeSphere(Vector3.Zero(), entity.physicsRadius, app.scene)
    } else {
      let meshes = entity.node.getChildMeshes()
      if (meshes.length == 1) {
        hullShape = new PhysicsShapeConvexHull(entity.node.getChildMeshes()[0] as Mesh, app.scene)
      } else {
        let groupMesh = Mesh.MergeMeshes(meshes as Mesh[], false, true)
        hullShape = new PhysicsShapeConvexHull(groupMesh as Mesh, app.scene)
        groupMesh.dispose()
      }
    }
    DEBUG && debugLog(`[PhysicsSystem] shape ${hullShape} type ${bodyType}/${physicsType}`)
    body.shape = hullShape
    body.entityId = entity.id
    body.setCollisionCallbackEnabled(true)
    count += 1
    // body.getCollisionObservable().add((event) => {
    //   debugLog(`[PhysicsSystem] collision`, event)
    // })

    world.addComponent(entity, "body", body)
    node.position.set(nodePos.x, nodePos.y, nodePos.z)
  }

  private physicsOnEntityRemoved = (entity: Entity) => {
    DEBUG && debugLog(`[PhysicsSystem] entity removed [${entity.id}]"${entity.targetName}"`)
    if (entity.body) {
      if (entity.body.shape) {
        DEBUG && debugLog(`[PhysicsSystem] removing shape for [${entity.id}]"${entity.targetName}"`)
        entity.body.shape.dispose()
      }
      DEBUG && debugLog(`[PhysicsSystem] removing body for [${entity.id}]"${entity.targetName}"`)
      entity.body.dispose()
    }
    count -= 1
    DEBUG && debugLog(`[PhysicsSystem] count [${count}]`)
  }
}
