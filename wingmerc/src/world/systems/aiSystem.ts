import { Entity, FireCommand, MovementCommand } from '../world';
import { Color3, Mesh, MeshBuilder, Quaternion, Scalar, StandardMaterial, TmpVectors, TrailMesh, TransformNode, Vector3 } from "@babylonjs/core"
import { queries, world } from "../world"
import { AppContainer } from "../../app.container"
import * as Ships from '../../data/ships';
import { rand, random, randomItem } from '../../utils/random';
import { QuaternionFromObj, Vector3FromObj } from '../../utils/math';

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
      case "deathRattle":
        deathRattle(entity, dt)
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

function deathRattle(entity: Entity, dt: number) {
  let movementCommand = {
    pitch: 0,
    yaw: 0,
    roll: 0,
    deltaSpeed: 100,
    // afterburner: 1,
    // brake: brake,
    brake: 0,
    drift: 0,
  } as MovementCommand
  world.update(entity, "movementCommand", movementCommand)
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
    brake: 0,
    drift: 0,
  } as MovementCommand

  let fireCommand = {
    gun: 0,
    weapon: 0
  } as FireCommand
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
    movementCommand.brake = 1
  })

  timer(blackboard, "fireGuns", dt, 1000, 1000, () => {
    fireCommand.gun = 1
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
    if (tmp.subtract(blackboard.target).length() < 50) {
      blackboard.target = undefined
    } else {
      // let velocity: Vector3 = blackboard.targetBoxVelovity
      // let box = blackboard.targetBox as Mesh
      // box.position.addInPlace(velocity.scale(dt / 1000))
      let input = calculateSteering(dt, Vector3FromObj(position), QuaternionFromObj(rotationQuaternion), blackboard.target, SteeringHardNormalizeClamp) //SteeringHardTurnClamp)
      console.log(`[AI] steering:`, input)
      movementCommand.pitch = input.pitch
      movementCommand.yaw = input.yaw
      movementCommand.roll = input.roll
    }
  }
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

function basicCombatAI(entity: Entity, dt: number) {
  const { ai, position, acceleration, velocity, driftVelocity, afterburnerVelocity, breakingPower, rotationalVelocity, rotationQuaternion, setSpeed, currentSpeed } = entity;
  const { movementCommand } = entity;

  // TODO: we should have another way to target what ship to track
  // get the player ship
  let targetEntity: Entity = AppContainer.instance.player?.playerEntity as Entity
  const { blackboard } = ai;
  if (targetEntity == undefined) {
    // pick a random other ai
    if (blackboard.target == undefined) {
      const possibleEnemies: Entity[] = []
      for (const ai of queries.ai) {
        if (ai != entity) {
          possibleEnemies.push(ai)
        }
      }
      if (possibleEnemies.length > 0) {
        const enemy = randomItem(possibleEnemies) as Entity
        blackboard.target = enemy
        targetEntity = enemy
      }
    } else {
      targetEntity = blackboard.target
    }
  }
  if (world.has(targetEntity) == false) {
    blackboard.target = undefined
    return
  }
  
  const vectorToTarget = Vector3FromObj(position).subtract(Vector3FromObj(targetEntity.position))
  const distanceToTarget = vectorToTarget.length()
  if (distanceToTarget < 250 && !blackboard["backoff"]) {
    blackboard["backoff"] = true
    console.log("[AI] Backing Off")
  }
  // TODO: this should be where the enemy would intercept the player with guns, not where the player is currently
  let targetPosition = Vector3FromObj(targetEntity.position)
  if (blackboard["backoff"] && blackboard["backoffTarget"]) {
    const backoffTarget = blackboard["backoffTarget"]
    const distanceToBackoff = Vector3FromObj(position).subtract(backoffTarget).length()
    if (distanceToBackoff < 200 || distanceToTarget > 1500) {
      blackboard["backoff"] = false
      blackboard["backoffTarget"] = undefined
      console.log("[AI] Making attack run")
    } else {
      targetPosition = backoffTarget
    }
  } else if (blackboard["backoff"] && blackboard["backoffTarget"] == undefined) {
    // too close break off to behind the player
    const forward = Vector3.Forward(true)
    forward.applyRotationQuaternionInPlace(QuaternionFromObj(targetEntity.rotationQuaternion))
    const playerDirection = forward.normalizeToNew()
    const behindPlayerDirection = playerDirection.multiplyByFloats(-1, -1, -1)
    const behindPlayerTarget = behindPlayerDirection.multiplyByFloats(1000, 1000, 1000)
    
    targetPosition = Vector3FromObj(behindPlayerTarget)
    blackboard["backoffTarget"] = targetPosition
  }
  // TODO: if we are being chased we should after burner away before trying to turn back towards the player
  // TODO: if we need to do large turns we should apply brakes while turning
  let input = calculateSteering(dt, Vector3FromObj(position), QuaternionFromObj(rotationQuaternion), targetPosition, SteeringHardTurnClamp) //SteeringHardNormalizeClamp)
  // console.log(`[AI] steering`, input)
  let cinamaticRoll = 0
  if (blackboard["backoff"] == false && Math.abs(input.pitch) < 0.1 && Math.abs(input.yaw) < 0.1) {
    let gun = 0
    let weapon = 0
    let lock = false
    if (entity.targeting.locked == false) {
      lock = true
    }
    if (distanceToTarget < 1600) {
      gun = 1
    }
    if (distanceToTarget > 2000) {
      if (entity.weapons.mounts[0].count > 0 && rand(0, 1) < (0.3 * (dt / 1000))) { // 30% per second
        weapon = 1
      }
    }
    if (gun || weapon || lock) {
      const command = {
        gun,
        weapon
      } as FireCommand
      if (lock) {
        command.lock = lock
      }
      world.update(entity, "fireCommand", command)
    }
  }
  const brake = Math.abs(input.pitch) > 0.9 || Math.abs(input.yaw) > 0.9 ? 1 : 0
  let afterburner = 0
  if (!brake && blackboard["backoff"] && distanceToTarget > 500) {
    afterburner = 1
  }
  const shipTemplateName = entity.planeTemplate
  const shipTemplate: { cruiseSpeed: number } = Ships[shipTemplateName] ?? Ships.EnemyLight01
  world.update(entity, "rotationalVelocity", input)
  world.update(entity, "setSpeed", shipTemplate.cruiseSpeed)
  world.update(entity, "movementCommand", {
    pitch: input.pitch,
    yaw: input.yaw,
    roll: cinamaticRoll,
    deltaSpeed: 0,
    afterburner: afterburner,
    brake: brake,
    drift: 0,
  })
}

/** the steering error (-180 to 180 degrees) is clamped to -90 to 90 and normalized to -1 to 1, an error of < 1 degree is clamped to 0 */
export function SteeringHardNormalizeClamp({ pitch, yaw, roll }: SteeringResult): SteeringResult {
  // console.log("[SteeringHardNormalizeClamp] error", { pitch, roll, yaw})
  // remove less than 1 degree
  pitch = (Math.abs(pitch) <= Math.PI / 180) ? 0 : pitch
  yaw = (Math.abs(yaw) <= Math.PI / 180) ? 0 : yaw
  roll = (Math.abs(roll) <= Math.PI / 180) ? 0 : roll
  // clamp
  pitch = clamp(pitch, -Math.PI / 2, Math.PI / 2)
  yaw = clamp(yaw, -Math.PI / 2, Math.PI / 2)
  roll = clamp(roll, -Math.PI / 2, Math.PI / 2)
  // console.log("[SteeringHardNormalizeClamp] clamp", { pitch, roll, yaw})
  // normalize
  pitch = pitch / (Math.PI / 2)
  yaw = yaw / (Math.PI / 2)
  roll = roll / (Math.PI / 2)
  // console.log("[SteeringHardNormalizeClamp] normalize", { pitch, roll, yaw})

  return { pitch, roll, yaw }
}
/** the steering error (-180 to 180 degrees) is normalized to -1 to 1, an error of < 1 degree is clamped to 0 */
export function SteeringSoftNormalizeClamp({ pitch, yaw, roll }: SteeringResult): SteeringResult {
  pitch = (Math.abs(pitch) <= Math.PI / 180) ? 0 : pitch
  yaw = (Math.abs(yaw) <= Math.PI / 180) ? 0 : yaw
  roll = (Math.abs(roll) <= Math.PI / 180) ? 0 : roll
  pitch = pitch / Math.PI
  yaw = yaw / Math.PI
  roll = roll / Math.PI

  return { pitch, roll, yaw }
}
/** if the steering error is greater than 1 degree a full turn command is given */
export function SteeringHardTurnClamp({ pitch, yaw, roll }: SteeringResult): SteeringResult {
  pitch = (Math.abs(pitch) > Math.PI / 180 ? (pitch < 0 ? -1 : 1) : 0)
  yaw = Math.abs(yaw) > Math.PI / 180 ? (yaw < 0 ? -1 : 1) : 0
  roll = Math.abs(roll) > Math.PI / 180 ? (roll < 0 ? -1 : 1) : 0

  if (yaw != 0 || pitch != 0) {
    roll = 0
  }
  return { pitch, roll, yaw }
}
export type SteeringResult = { pitch: number, roll: number, yaw: number }
function calculateSteering(dt: number, currentPosition: Vector3, currentRotation: Quaternion, targetPosition: Vector3, clampStrategy?: (input: SteeringResult) => SteeringResult): SteeringResult {
  let error = targetPosition.subtract(currentPosition)
  error = error.applyRotationQuaternion(Quaternion.Inverse(currentRotation)) // transform to local space

  let errorDirection = error.normalizeToNew()
  let pitchError = new Vector3(0,       error.y, error.z).normalize()
  let rollError  = new Vector3(error.x, error.y, 0      ).normalize()
  let yawError   = new Vector3(error.x, 0,       error.z).normalize()

  let pitch = signedAngle(Vector3.Forward(true), pitchError, Vector3.Right()) * -1 // pitch is inverted
  let yaw = signedAngle(Vector3.Forward(true), yawError, Vector3.Up())
  let roll = signedAngle(Vector3.Up(), rollError, Vector3.Forward(true))
  // we need to clamp from -1 to 1
  if (clampStrategy != undefined) {
    return clampStrategy({ pitch, roll, yaw })
  }
  pitch = clampInput(pitch)
  yaw = clampInput(yaw)
  roll = clampInput(roll)
  if (Math.floor(pitch * 100) == 0) {
    pitch = 0
  }
  if (Math.floor(roll * 100) == 0) {
    roll = 0
  }
  if (Math.floor(yaw * 100) == 0) {
    yaw = 0
  }

  return { pitch, roll, yaw }
}


/** Will convert from -180/180 degrees in radians to -1/1 */
function clampInput(angle: number) {
  return angle / Math.PI
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function signedAngle(from: Vector3, to: Vector3, axis: Vector3): number {
  return Vector3.GetAngleBetweenVectors(from, to, axis);
}

/* 
  Simple AI so we can test guns, weapons, shields, and damage
  the basic ai is to try to fly towards the playerp
*/