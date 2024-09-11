import { Matrix, Quaternion, TmpVectors, Vector3 } from "@babylonjs/core"
import { Entity, queries, world } from "../../world"
import * as Ships from '../../../data/ships';
import { QuaternionFromObj, Vector3FromObj } from '../../../utils/math';

const TURN = Quaternion.FromEulerAngles(0, Math.PI, 0);
// TODO: use tmp vectors to save on object creation

/**
 * 
 * @param dt delta time in milliseconds
 */
export function moveCommandSystem(dt: number) {
  for (const entity of queries.moveCommanded) {
    const { movementCommand } = entity;
    if (entity.pauseMovement) {
      // clear movement command
      movementCommand.afterburner = 0
      movementCommand.brake = 0
      movementCommand.deltaSpeed = 0
      movementCommand.drift = 0
      movementCommand.pitch = 0
      movementCommand.roll = 0
      movementCommand.yaw = 0
    }
    updateVelocityNewtonian(dt, entity)
  }
}

function updateVelocityNewtonian(dt: number, entity: Entity) {
  const { systems, velocity, driftVelocity, afterburnerVelocity, breakingPower, rotationalVelocity, rotationQuaternion, currentSpeed, fuel, engine, thrusters } = entity
  let { setSpeed } = entity
  const { movementCommand } = entity
  // Get the forward direction based on the ship's rotation quaternion
  
  let forward = new Vector3(0, 0, -1)
  let rot = QuaternionFromObj(entity.rotationQuaternion).toRotationMatrix(Matrix.Identity())
  forward = Vector3.TransformCoordinates(forward, rot)

  const maxDamagedSpeed = engine.maxSpeed * Math.max(0.2, ((systems?.state?.engines ?? 1) / (systems?.base?.engines ?? 1)))
  const maxDamagedCruiseSpeed = engine.cruiseSpeed * Math.max(0.2, ((systems?.state?.engines ?? 1) / (systems?.base?.engines ?? 1)))

  if (movementCommand?.deltaSpeed != 0) {
    setSpeed = (Math.max(0, Math.min(engine.cruiseSpeed, setSpeed + movementCommand.deltaSpeed)))
    entity.setSpeed = setSpeed
  }
  if (maxDamagedCruiseSpeed < setSpeed) {
    setSpeed = maxDamagedCruiseSpeed
    world.update(entity, "setSpeed", setSpeed)
  }

  if (movementCommand != undefined) {
    // console.log(new Vector3(velocity.x, velocity.y, velocity.z).length(), afterburnerVelocity != undefined ? new Vector3(afterburnerVelocity.x, afterburnerVelocity.y, afterburnerVelocity.z).length() : 0);
    // reset rotational velocity
    rotationalVelocity.pitch = 0
    rotationalVelocity.yaw = 0
    rotationalVelocity.roll = 0
    //// change direction of the ship...
    if (movementCommand.yaw != undefined || movementCommand.pitch != undefined || movementCommand.roll != undefined) {

      let pitchSpeed = Math.max(40, thrusters.pitch * Math.max(0.1, (systems.state.thrusters / systems.base.thrusters))) // Degrees per second, min 4dps capability even if "destroyed"
      let yawSpeed   = Math.max(40, thrusters.yaw * Math.max(0.1, (systems.state.thrusters / systems.base.thrusters)))   // Degrees per second, min 4dps capability even if "destroyed"
      let rollSpeed  = Math.max(40, thrusters.roll * Math.max(0.1, (systems.state.thrusters / systems.base.thrusters)))  // Degrees per second, min 4dps capability even if "destroyed"
      // Positive for roll left, negative for roll right
      const deltaRoll = (((rollSpeed * (movementCommand.roll ?? 0))) / 1000) * dt;
      // Positive for down, negative for up
      const deltaPitch = (((pitchSpeed * (movementCommand.pitch ?? 0))) / 1000) * dt;
      // Positive for right, negative for left
      const deltaYaw = (((yawSpeed * (movementCommand.yaw ?? 0))) / 1000) * dt;
      
      // call modify method
      rotationalVelocity.pitch = deltaPitch
      rotationalVelocity.yaw = deltaYaw
      rotationalVelocity.roll = deltaRoll
    }
    world.update(entity, "rotationalVelocity", rotationalVelocity);
  }

  // take the current velocity and get it's normal
  const velocityVector = Vector3FromObj(velocity)
  const oldVelocityNormal = velocityVector.clone().normalize()
  // const newForward = oldVelocityNormal.add(forward).normalize()
  const cruiseAcceleration = (engine.accelleration * Math.max(0.1, (systems.state.engines / systems.base.engines)) / 1000) * dt
  const afterburnerAcceleration = (engine.afterburnerAccelleration * Math.max(0.1, (systems.state.afterburners / systems.base.afterburners)) / 1000) * dt
  let accelleration = cruiseAcceleration
  if (movementCommand && movementCommand.afterburner) {
    setSpeed = maxDamagedSpeed
    accelleration = afterburnerAcceleration
  }
  if (movementCommand && movementCommand.brake) {
    setSpeed = Math.max(150, setSpeed / 2)
  }
  const dragCoefficient = 4; // Increase this value to apply more drag
  let drag = oldVelocityNormal
    .multiplyByFloats(-dragCoefficient, -dragCoefficient, -dragCoefficient)
    .multiplyByFloats(accelleration, accelleration, accelleration);

  let newCruise = forward.multiplyByFloats(accelleration * dragCoefficient * 2, accelleration * dragCoefficient * 2, accelleration * dragCoefficient * 2)
  velocityVector.addInPlace(drag)
  if (velocityVector.length() < setSpeed) {
    velocityVector.addInPlace(newCruise)
    if (velocityVector.length() > setSpeed) {
      velocityVector.normalizeToRef(velocityVector).scaleInPlace(setSpeed)
    }
  }
  // velocityVector.addInPlace(newCruise)
  if (velocityVector.length() > maxDamagedSpeed) {
    velocityVector.normalizeToRef(velocityVector).scaleInPlace(maxDamagedSpeed)
  }
  if (movementCommand && movementCommand.drift) {
    return
  }
  velocity.x = velocityVector.x
  velocity.y = velocityVector.y
  velocity.z = velocityVector.z
}

/* 
We need the code for the 3d flight model of a space flight simulator in typescript
we switched it up, it's still kinda newtownian motion but we add a significant dampner on the existing velocity vector
 before adding the new accelleration to the velocity vector
the flight model should more closely follow arcade airplane flight models except for some cases where the plane can drift, keeping it's velocity while changing it's direction
the player can set the speed of their ship and we try to match that speed
the player can adjust the ships pitch, yaw, and roll to change the direction of the ship
the ship has a max accelleration value, a max afterburner accelleration value, and a max cruise speed value and a max afterburner speed
the player can enable afterburners that will raise the max speed to the max afterburner speed and set the accelleration to the afterbutner accelleration value
the velocity gained from afterbutners should let the plan to continue to drift in the direction the afterburners were fired until the afterburner velocity is reduced from drag
if the player enabled drifting we should be able to change the ship direction without changing the movement direction
when the player disabled drifting the ship should gradually begin moving in the ship direction again
if nothing is happening we should be flying in the direction of the ship at the set speed
if we are under the player set speed we should be accellerating to the set speed
if we are over the player set speed we should be decellerating to the set speed
if the player is steering the ship we should be moving in the direction of the ship
*/