import { Entity } from './../world';
import { FireCommand, MovementCommand } from '../world';
import { Mesh, MeshBuilder, Quaternion, TmpVectors, TrailMesh, TransformNode, Vector3 } from "@babylonjs/core"
import { queries, world } from "../world"
import { AppContainer } from "../../app.container"
import * as Ships from '../../data/ships';
import { random } from '../../utils/random';

/**
 * 
 * @param dt delta time in milliseconds
 */
export function aiSystem(dt: number) {
  for (const entity of queries.ai) {
    const { ai } = entity
    switch (ai.type) {
      case "basicCombat":
        basicCombatAI(entity, dt)
        break;
      case "demoLoop":
        demoLoopAI(entity, dt)
        break;
    }
  }
}

function timer(blackboard: any, key: string, dt: number, delay: number, time: number, action: () => void) {
  if (blackboard[key] != undefined) {
    let timer = blackboard[key]
    if (timer.time > 0) {
      timer.time -= dt
      action()
    } else if (timer.delay > 0) {
      timer.delay -= dt
      if (timer.delay <= 0) {
        timer.delay = delay
        timer.time = time
      }
    }
  } else {
    blackboard[key] = {
      time: 0,
      delay: delay
    }
  }
}

function demoLoopAI(entity: Entity, dt: number) {
  const { ai, position, rotationQuaternion} = entity;
  const { blackboard } = ai
  let movementCommand = {
    pitch: 0,
    yaw: 0,
    roll: 0,
    deltaSpeed: 0,
    afterburner: 0,
    // brake: brake,
    brake: 0,
    drift: 0,
  } as MovementCommand

  // afterburner demo
  timer(blackboard, "afterburner", dt, 15000, 5000, () => {
    movementCommand.afterburner = 1
  })

  // roll demo
  timer(blackboard, "roll", dt, 1, 1000, () => {
    movementCommand.roll = 1
  })

  // brake demo
  timer(blackboard, "brake", dt, 2000, 333, () => {
    // movementCommand.brake = 1
  })

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
    if (tmp.subtract(blackboard.target).length() < 250) {
      blackboard.target = undefined
    } else {
      let input = calculateSteering(dt, Vector3FromObject(position), QuaternionFromObj(rotationQuaternion), blackboard.target)
      movementCommand.pitch = input.pitch
      movementCommand.yaw = input.yaw
      if (movementCommand.yaw != 0 || movementCommand.pitch != 0) {
        movementCommand.roll = 0
      }
    }
  }
  world.update(entity, "setSpeed", 250)
  world.update(entity, "movementCommand", movementCommand)
}

function moveTargetBox(blackboard: any, position: Vector3) {
  let box = blackboard.targetBox as Mesh
  if (box == undefined) {
    blackboard.targetBox = MeshBuilder.CreateBox("ai target box", {size: 10})
    box = blackboard.targetBox
  }
  box.position.copyFrom(position)
}

function basicCombatAI(entity: Entity, dt: number) {
  const { ai, position, acceleration, velocity, driftVelocity, afterburnerVelocity, breakingPower, rotationalVelocity, rotationQuaternion, setSpeed, currentSpeed } = entity;
  const { movementCommand } = entity;

  // TODO: we should have another way to target what ship to track
  // get the player ship
  const playerEntity = AppContainer.instance.player?.playerEntity
  if (playerEntity == undefined) { return }
  const { blackboard } = ai;
  const vectorToTarget = Vector3FromObject(position).subtract(Vector3FromObject(playerEntity.position))
  const distanceToTarget = vectorToTarget.length()
  if (distanceToTarget < 100 && !blackboard["backoff"]) {
    blackboard["backoff"] = true
    console.log("[AI] Backing Off")
  }
  // TODO: this should be where the enemy would intercept the player with guns, not where the player is currently
  let targetPosition = Vector3FromObject(playerEntity.position)
  if (blackboard["backoff"]) {
    // too close break off to behind the player
    const forward = Vector3.Forward(true)
    forward.applyRotationQuaternionInPlace(QuaternionFromObj(playerEntity.rotationQuaternion))
    const playerDirection = forward.normalizeToNew()
    const behindPlayerDirection = playerDirection.multiplyByFloats(-1, -1, -1)
    const behindPlayerTarget = behindPlayerDirection.multiplyByFloats(1000, 1000, 1000)
    const distanceToBackoff = Vector3FromObject(position).subtract(behindPlayerTarget).length()
    if (distanceToBackoff < 200 || distanceToTarget > 1000) {
      blackboard["backoff"] = false
      console.log("[AI] Making attack run")
    } else {
      targetPosition = Vector3FromObject(behindPlayerTarget)
    }
  }
  // TODO: if we are being chased we should after burner away before trying to turn back towards the player
  // TODO: if we need to do large turns we should apply brakes while turning
  let input = calculateSteering(dt, Vector3FromObject(position), QuaternionFromObj(rotationQuaternion), targetPosition)
  let cinamaticRoll = 0
  if (input.pitch < 0.1 && input.roll < 0.1 && distanceToTarget < 1400) {
    const command = {
      gun: 1
    } as FireCommand
    if (entity.targeting.locked == false) {
      command.lock = true
    }
    if (entity.targeting.missileLocked == true) {
      command.weapon = 1
    }
    world.update(entity, "fireCommand", command)
  }
  const brake = Math.abs(input.pitch) > 0.9 || Math.abs(input.yaw) > 0.9 ? 1 : 0
  const shipTemplateName = entity.planeTemplate
  const shipTemplate: { cruiseSpeed: number } = Ships[shipTemplateName] ?? Ships.EnemyLight
  world.update(entity, "rotationalVelocity", input)
  world.update(entity, "setSpeed", shipTemplate.cruiseSpeed)
  world.update(entity, "movementCommand", {
    pitch: input.pitch,
    yaw: input.yaw,
    roll: cinamaticRoll,
    deltaSpeed: 0,
    afterburner: 0,
    // brake: brake,
    brake: 0,
    drift: 0,
  })
}

function calculateSteering(dt: number, currentPosition: Vector3, currentRotation: Quaternion, targetPosition: Vector3): { pitch: number, roll: number, yaw: number } {
  let error = targetPosition.subtract(currentPosition)
  error = error.applyRotationQuaternion(Quaternion.Inverse(currentRotation)) // transform to local space

  let errorDirection = error.normalizeToNew()
  let pitchError = new Vector3(0,       error.y, error.z).normalize()
  let rollError  = new Vector3(error.x, error.y, 0      ).normalize()
  let yawError   = new Vector3(error.x, 0,       error.z).normalize()

  let targetInput = new Vector3()
  let pitch = signedAngle(Vector3.Forward(true), pitchError, Vector3.Right())
  let yaw = signedAngle(Vector3.Forward(true), yawError, Vector3.Up())
  let roll = signedAngle(Vector3.Up(), rollError, Vector3.Forward(true))
  // we need to clamp from -1 to 1
  pitch = clamp(pitch, -1, 1)
  yaw = clamp(yaw, -1, 1)
  roll = clamp(roll, -1, 1)
  if (Math.floor(pitch * 100) == 0) {
    pitch = 0
  }
  if (Math.floor(roll * 100) == 0) {
    roll = 0
  }
  if (Math.floor(yaw * 100) == 0) {
    yaw = 0
  }
  targetInput.x = pitch
  targetInput.y = yaw
  targetInput.z = roll

  // TODO: clamp turning speeds to ship roll, pitch, yaw capabilities
  return { pitch, roll: 0, yaw }
}

function QuaternionFromObj(obj: {x: number, y: number, z: number, w: number}): Quaternion {
  return new Quaternion(obj.x, obj.y, obj.z, obj.w);
}

function Vector3FromObject(obj: {x: number, y: number, z: number}): Vector3 {
  return new Vector3(obj.x, obj.y, obj.z);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function signedAngle(from: Vector3, to: Vector3, axis: Vector3): number {
  let unsignedAngle = Vector3.GetAngleBetweenVectors(from, to, axis);

  // Calculate the cross product between 'from' and 'to'
  let cross = Vector3.Cross(from, to);

  // Check the direction of the cross product to determine the sign of the angle
  let dot = Vector3.Dot(axis, cross);
  let sign = dot < 0 ? -1 : 1;

  // Apply the sign to the unsigned angle
  let signedAngle = unsignedAngle * sign;

  return signedAngle;
}

/* 
  Simple AI so we can test guns, weapons, shields, and damage
  the basic ai is to try to fly towards the playerp
*/