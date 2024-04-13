import { Color3, Mesh, MeshBuilder, StandardMaterial, TmpVectors, Vector3 } from "@babylonjs/core";
import { random } from "../../../utils/random";
import { Entity, FireCommand, MovementCommand, world } from "../../world";
import { aiTimer } from "./aiTimer";
import { SteeringHardNormalizeClamp, SteeringHardTurnClamp, SteeringSoftNormalizeClamp, calculateSteering } from "./basicSteering";
import { QuaternionFromObj, Vector3FromObj } from "../../../utils/math";
import { SteeringBehaviours } from "./steeringBehaviours";

export function demoLeaderAI(entity: Entity, dt: number) {
  const { ai, position, rotationQuaternion} = entity;
  const { blackboard } = ai
  let movementCommand = {
    pitch: 0,
    yaw: 0,
    roll: 0,
    deltaSpeed: 0,
    afterburner: 0,
    brake: 0,
    drift: 0,
  } as MovementCommand

  let fireCommand = {
    gun: 0,
    weapon: 0
  } as FireCommand
  // afterburner demo
  aiTimer(blackboard, "afterburner", dt, 15000, 5000, () => {
    // movementCommand.afterburner = 1
  })

  // roll demo
  aiTimer(blackboard, "roll", dt, 1, 1000, () => {
    // movementCommand.roll = 1
  })

  // brake demo
  aiTimer(blackboard, "brake", dt, 2000, 333, () => {
    // movementCommand.brake = 1
  })

  aiTimer(blackboard, "fireGuns", dt, 1000, 1000, () => {
    // fireCommand.gun = 1
  })

  if (blackboard.holdState == undefined) {
    blackboard.holdState = {
      finished: false,
      headingHoldLength: 0,
      headingIndex: 0
    } as SteeringBehaviours.HeadingHoldState
    //{X: 0 Y: -0.7071067811865476 Z: 0.7071067811865476}
    blackboard.headings = [
      new Vector3(0, -1, 0),
      new Vector3(0, -1, 0),
      new Vector3(0, 1, 0),
      new Vector3(0, 1, 0),
    ]
    blackboard.timings = [
      0,0,
      0,0,
    ]
  } else {
    if (blackboard.holdState.finished == false) {
      let input = SteeringBehaviours.headingHold(dt, entity, blackboard.headings, blackboard.timings, blackboard.holdState, SteeringHardTurnClamp)
      // if (blackboard.holdState.finished) {
      //   blackboard.holdState = {
      //     finished: false,
      //     headingHoldLength: 0,
      //     headingIndex: 0
      //   } as SteeringBehaviours.HeadingHoldState
      // }
      console.log(`[AI wingleader] steering:`, input)
      movementCommand.pitch = input.pitch
      movementCommand.yaw = input.yaw
      movementCommand.roll = input.roll
    }
  }
  /*
  if (blackboard.target == undefined) {
    const radius = 5000
    const phi = random() * Math.PI * 2;
    const costheta = 2 * random() - 1;
    const theta = Math.acos(costheta);
    const x = radius * Math.sin(theta) * Math.cos(phi);
    const y = radius * Math.sin(theta) * Math.sin(phi);
    const z = radius * Math.cos(theta);
    let targetPosition = new Vector3(x,y,z)
    console.log("[AI] new target set", targetPosition.toString())
    moveTargetBox(blackboard, targetPosition)
    blackboard.target = targetPosition
  } else {

    let tmp = TmpVectors.Vector3[0]
    tmp.x = position.x
    tmp.y = position.y
    tmp.z = position.z
    if (tmp.subtract(blackboard.target).length() < 50) {
      blackboard.target = undefined
    } else {
      // let velocity: Vector3 = blackboard.targetBoxVelovity
      // let box = blackboard.targetBox as Mesh
      // box.position.addInPlace(velocity.scale(dt / 1000))
      let input = calculateSteering(dt, Vector3FromObj(position), QuaternionFromObj(rotationQuaternion), blackboard.target, SteeringHardNormalizeClamp) //SteeringHardTurnClamp)
      console.log(`[AI wingleader] steering:`, input)
      movementCommand.pitch = input.pitch
      movementCommand.yaw = input.yaw
      movementCommand.roll = input.roll
    }
  }
  */
  world.update(entity, "setSpeed", 250)
  world.update(entity, "movementCommand", movementCommand)
  world.update(entity, "fireCommand", fireCommand)
}

function moveTargetBox(blackboard: any, position: Vector3) {
  let box = blackboard.targetBox as Mesh
  if (box == undefined) {
    let newBox = MeshBuilder.CreateBox("ai target box", {size: 150})
    let mat = new StandardMaterial("target box")
    mat.emissiveColor = new Color3(1, 0.2, 0.2)
    mat.specularColor = new Color3(0,0,0)
    mat.diffuseColor = new Color3(1, 0.2, 0.2)
    newBox.material = mat
    blackboard.targetBox = newBox
    box = blackboard.targetBox
  }
  // let tmpMove = TmpVectors.Vector3[1]
  // tmpMove.set(Scalar.RandomRange(-Math.PI, Math.PI), Scalar.RandomRange(-Math.PI, Math.PI), Scalar.RandomRange(-Math.PI, Math.PI))
  // tmpMove.normalize()
  // tmpMove.scaleInPlace(Scalar.RandomRange(0, 250))
  // blackboard.targetBoxVelovity = tmpMove.clone()
  box.position.copyFrom(position)
}