import { MovementCommand } from './../world';
import { Quaternion, TrailMesh, TransformNode, Vector3 } from "@babylonjs/core"
import { queries, world } from "../world"
import { AppContainer } from "../../app.container"
import { Dirk } from '../../data/ships';

/**
 * 
 * @param dt delta time in milliseconds
 */
export function moveCommandSystem(dt: number) {
  for (const entity of queries.moving) {
    const { position, acceleration, velocity, driftVelocity, rotationalVelocity, rotationQuaternion, setSpeed, currentSpeed } = entity;
    const { movementCommand } = entity;
    
    if (movementCommand != undefined) {
      console.log(new Vector3(velocity.x, velocity.y, velocity.z).length(), driftVelocity != undefined ? new Vector3(driftVelocity.x, driftVelocity.y, driftVelocity.z).length() : 0);
      // reset rotational velocity
      rotationalVelocity.pitch = 0
      rotationalVelocity.yaw = 0
      rotationalVelocity.roll = 0
      //// change direction of the ship...
      if (movementCommand.yaw != undefined || movementCommand.pitch != undefined || movementCommand.roll != undefined) {

        // TODO: take damage into consideration, damage to thrusters reduces turn rates
        // TODO: get the ship stats from the entity
        let pitchSpeed = Dirk.pitch // Degrees per second
        let yawSpeed   = Dirk.yaw   // Degrees per second
        let rollSpeed  = Dirk.roll  // Degrees per second
        // Positive for down, negative for up
        const deltaPitch = (((pitchSpeed * (movementCommand.pitch ?? 0))) / 1000) * dt;
        // Positive for right, negative for left
        const deltaYaw = (((yawSpeed * (movementCommand.yaw ?? 0))) / 1000) * dt;
        // Positive for roll left, negative for roll right
        const deltaRoll = (((rollSpeed * (movementCommand.roll ?? 0))) / 1000) * dt;
        // call modify method
        rotationalVelocity.pitch = deltaPitch
        rotationalVelocity.yaw = deltaYaw
        rotationalVelocity.roll = deltaRoll
      }
      world.update(entity, "rotationalVelocity", rotationalVelocity);

      //// change speed of the ship
      // TODO: this should take into consideration damage
      const cruiseAcceleration = (Dirk.accelleration / 1000) * dt
      if (movementCommand.afterburner) {

        let maxAfterburner = Dirk.maxSpeed - setSpeed
        let afterburner = driftVelocity ? new Vector3(driftVelocity.x, driftVelocity.y, driftVelocity.z) : Vector3.Zero();
        let currentAfterburner = afterburner.length()
        if (currentAfterburner < maxAfterburner) {
          // TODO: this should take into consideration damage
          let newSpeed = Math.min(currentAfterburner + cruiseAcceleration, Dirk.maxSpeed)
          const forward = new Vector3(0, 0, -1)
          const movement = forward.multiplyByFloats(newSpeed, newSpeed, newSpeed)
          movement.applyRotationQuaternionInPlace(QuaternionFromObj(rotationQuaternion))
          let newDriftVelocity = movement.clone()
          world.update(entity, "driftVelocity", newDriftVelocity)
        } 
      } else {
        // apply drag to drift velocity
        if (driftVelocity != undefined) {
          let newDriftVelocity = new Vector3(driftVelocity.x, driftVelocity.y, driftVelocity.z)
          const driftLength = newDriftVelocity.length() - cruiseAcceleration
          const velocityNormal = newDriftVelocity.normalizeToNew()
          const drag = velocityNormal.multiplyByFloats(driftLength, driftLength, driftLength)
          // clamp
          if (driftLength <= 0) {
            world.removeComponent(entity, "driftVelocity")
          } else {
            world.update(entity, "driftVelocity", drag)
          }
        }
      }
      // if (movementCommand.brake) {
      //   // we double the drag when braking
      //   let newDragVelocity = new Vector3(velocity.x, velocity.y, velocity.z)
      //   const velocityNormal = newDragVelocity.normalizeToNew()
      //   const drag = velocityNormal.multiplyByFloats(-cruiseAcceleration, -cruiseAcceleration, -cruiseAcceleration)
      //   let newVelocity = new Vector3(velocity.x, velocity.y, velocity.z)
      //   newVelocity.addInPlace(drag)
      // }
      //// base speed
      
      let currentVelocity = new Vector3(velocity.x, velocity.y, velocity.z)
      let newSpeed = currentVelocity.length()
      if (Math.abs(newSpeed - setSpeed) < cruiseAcceleration) {
        // avoid tittilating speeds
        newSpeed = setSpeed
      }
      if (newSpeed < setSpeed) {
        // TODO: this should take into consideration damage
        newSpeed = Math.min(currentSpeed + cruiseAcceleration, Dirk.cruiseSpeed)
      } else if (newSpeed > setSpeed) {
        newSpeed = Math.min(Math.max(currentSpeed - cruiseAcceleration, 0), setSpeed)
      }
      // world.update(entity, "currentSpeed", newSpeed)
      const forward = new Vector3(0, 0, -1)
      const movement = forward.multiplyByFloats(newSpeed, newSpeed, newSpeed)
      movement.applyRotationQuaternionInPlace(QuaternionFromObj(rotationQuaternion))
      let newVelocity = movement
      world.update(entity, "velocity", newVelocity)
    }
  }
}

export function moveSystem() {
  for (const entity of queries.moving) {
    const { position, velocity, driftVelocity, acceleration } = entity;
    velocity.x += acceleration.x
    velocity.y += acceleration.y
    velocity.z += acceleration.z
    // TODO: if velocity shoots over cap, 
    // we still want the plane to move in the direction of the accelleration
    // but not move any faster
    // so we should normalize the new velocity vector
    // and then multiply it by it's max speed
    let speed = new Vector3(velocity.x, velocity.y, velocity.z)
    if (driftVelocity != undefined) {
      position.x += driftVelocity.x / 1000
      position.y += driftVelocity.y / 1000
      position.z += driftVelocity.z / 1000
      speed.addInPlace(new Vector3(driftVelocity.x, driftVelocity.y, driftVelocity.z))
    }
    position.x += velocity.x / 1000
    position.y += velocity.y / 1000
    position.z += velocity.z / 1000
    world.update(entity, "currentSpeed", speed.length())
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

function QuaternionFromObj(obj: {x: number, y: number, z: number, w: number}): Quaternion {
  return new Quaternion(obj.x, obj.y, obj.z, obj.w);
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