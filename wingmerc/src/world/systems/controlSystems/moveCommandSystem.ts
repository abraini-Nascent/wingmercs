import { Vector3 } from "@babylonjs/core"
import { queries, world } from "../../world"
import * as Ships from '../../../data/ships';
import { QuaternionFromObj } from '../../../utils/math';

// TODO: use tmp vectors to save on object creation

/**
 * 
 * @param dt delta time in milliseconds
 */
export function moveCommandSystem(dt: number) {
  for (const entity of queries.moveCommanded) {
    const { systems, velocity, driftVelocity, afterburnerVelocity, breakingPower, rotationalVelocity, rotationQuaternion, currentSpeed, fuel, engine, thrusters } = entity;
    let { setSpeed } = entity;
    const { movementCommand } = entity;

    // scale back speeds based on damage, minimum 20% capability even if destroyed
    const maxDamagedSpeed = engine.maxSpeed * Math.max(0.2, ((systems?.state?.engines ?? 1) / (systems?.base?.engines ?? 1)))
    const maxDamagedCruiseSpeed = engine.cruiseSpeed * Math.max(0.2, ((systems?.state?.engines ?? 1) / (systems?.base?.engines ?? 1)))
    if (movementCommand.deltaSpeed != 0) {
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

      //// change speed of the ship
      const cruiseAcceleration = (engine.accelleration * Math.max(0.1, (systems.state.engines / systems.base.engines)) / 1000) * dt
      const afterburnerAcceleration = (engine.afterburnerAccelleration * Math.max(0.1, (systems.state.afterburners / systems.base.afterburners)) / 1000) * dt
      const breakAcceleration = (thrusters.breakingForce * Math.max(0.1, (systems.state.engines / systems.base.engines)) / 1000) * dt
      const canAfterburner = fuel == undefined ? true : fuel.currentCapacity > (dt / 1000) // TODO burn rate should scale, there should be enough fuel to match afterburner's burn rate
      if (movementCommand.afterburner && canAfterburner) {

        let maxAfterburner = maxDamagedSpeed - setSpeed
        let afterburner = afterburnerVelocity ? new Vector3(afterburnerVelocity.x, afterburnerVelocity.y, afterburnerVelocity.z) : Vector3.Zero();
        let currentAfterburner = afterburner.length()
        let newSpeed = maxDamagedSpeed;
        if (currentAfterburner < maxAfterburner) {
          newSpeed = Math.min(currentAfterburner + afterburnerAcceleration, maxDamagedSpeed)
        }
        const forward = new Vector3(0, 0, -1)
        const movement = forward.multiplyByFloats(newSpeed, newSpeed, newSpeed)
        movement.applyRotationQuaternionInPlace(QuaternionFromObj(rotationQuaternion))
        let newafterburnerVelocity = movement.clone()
        let difference = newafterburnerVelocity.subtract(afterburner)
        if (Math.abs(difference.length()) > (afterburnerAcceleration * 2)) {
          // we are way off from our last afterburner
          difference = difference.normalize()
          difference = difference.multiplyByFloats(afterburnerAcceleration, afterburnerAcceleration, afterburnerAcceleration)
          newafterburnerVelocity = afterburner.add(difference)
          // move along the difference of the two velocity vectors by the accelleration 
        }
        // console.log("afterburner direction distance", difference.length())
        if (entity.nerdStats) {
          entity.nerdStats.afterburnerFuelSpent += dt / 1000
        }
        world.addComponent(entity, "afterburnerActive", true)
        world.update(entity, "afterburnerVelocity", newafterburnerVelocity)
      } else {
        // apply drag to drift velocity
        if (afterburnerVelocity != undefined && !movementCommand.drift) {
          let newafterburnerVelocity = new Vector3(afterburnerVelocity.x, afterburnerVelocity.y, afterburnerVelocity.z)
          const driftLength = newafterburnerVelocity.length() - afterburnerAcceleration
          const velocityNormal = newafterburnerVelocity.normalizeToNew()
          const drag = velocityNormal.multiplyByFloats(driftLength, driftLength, driftLength)
          // clamp
          if (driftLength <= 0) {
            world.removeComponent(entity, "afterburnerVelocity")
          } else {
            world.update(entity, "afterburnerVelocity", drag)
          }
        }
        world.removeComponent(entity, "afterburnerActive")
      }
      //// breaking
      let nextBreakingPower = 0
      if (!movementCommand.afterburner && movementCommand.brake) {
        nextBreakingPower = Math.min((breakingPower ?? 0) + breakAcceleration, thrusters.breakingLimit)
        if (isNaN(nextBreakingPower)) {
          debugger
        }
        world.update(entity, "breakingPower", nextBreakingPower)
        world.addComponent(entity, "brakingActive", true)
      } else if (breakingPower != undefined && breakingPower > 0) {
        nextBreakingPower = Math.max(breakingPower - breakAcceleration, 0)
        if (nextBreakingPower == 0) {
          world.removeComponent(entity, "breakingPower")
        } else {
          world.update(entity, "breakingPower", nextBreakingPower)
        }
      }
      if (movementCommand.brake == 0 && entity.brakingActive) {
        world.removeComponent(entity, "brakingActive")
      }
      const breakingForward = new Vector3(0, 0, 1)
      const breakingMovement = breakingForward.multiplyByFloats(nextBreakingPower, nextBreakingPower, nextBreakingPower)
      if (breakingMovement.length() > currentSpeed) {
        breakingMovement.normalize().scaleInPlace(currentSpeed)
      }
      breakingMovement.applyRotationQuaternionInPlace(QuaternionFromObj(rotationQuaternion))
      world.update(entity, "breakingVelocity", breakingMovement)

      //// base speed
      if (movementCommand.drift && entity.driftActive == undefined) {
        console.log("adding drift")
        world.addComponent(entity, "driftActive", true)
      } else if (!movementCommand.drift && entity.driftActive) {
        console.log("removing drift")
        world.removeComponent(entity, "driftActive")
      }
      if (movementCommand.drift && driftVelocity == undefined) {
        let newDriftVelocity = new Vector3(velocity.x, velocity.y, velocity.z)
        world.update(entity, "driftVelocity", newDriftVelocity)
      }
      if (!movementCommand.drift) {
        if (driftVelocity != undefined) {
          let newDriftVelocity = new Vector3(driftVelocity.x, driftVelocity.y, driftVelocity.z)
          let oldLength = newDriftVelocity.length()
          let newLength = oldLength - breakAcceleration
          if (newLength < 0) {
            world.removeComponent(entity, "driftVelocity")
          } else {
            newDriftVelocity.normalize()
            newDriftVelocity = newDriftVelocity.multiplyByFloats(newLength, newLength, newLength)
            world.update(entity, "driftVelocity", newDriftVelocity)
          }
        }
        let currentVelocity = new Vector3(velocity.x, velocity.y, velocity.z)
        let newSpeed = currentVelocity.length()
        if (Math.abs(newSpeed - setSpeed) < cruiseAcceleration) {
          // avoid tittilating speeds
          newSpeed = setSpeed
        }
        if (newSpeed < setSpeed) {
          // TODO: this should take into consideration damage
          newSpeed = Math.min(currentSpeed + cruiseAcceleration, engine.cruiseSpeed)
        } else if (newSpeed > setSpeed) {
          newSpeed = Math.min(Math.max(currentSpeed - cruiseAcceleration, 0), setSpeed)
        }
        if (isNaN(newSpeed)) {
          debugger
        }

        // world.update(entity, "currentSpeed", newSpeed)
        const forward = new Vector3(0, 0, -1)
        const movement = forward.multiplyByFloats(newSpeed, newSpeed, newSpeed)
        movement.applyRotationQuaternionInPlace(QuaternionFromObj(rotationQuaternion))
        let newVelocity = movement
        if (entity.nerdStats) {
          entity.nerdStats.driftTime += dt / 1000
        }
        world.update(entity, "velocity", newVelocity)
      }
    }
  }
}

/* 
We need the code for the 3d flight model of a space flight simulator in typescript
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