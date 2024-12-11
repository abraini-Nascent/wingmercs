import { TmpVectors } from "@babylonjs/core"
import { SetComponent, queries, world } from "../world"

/**
 *
 * @param dt delta time in milliseconds
 */
export function moveSystem(dt: number) {
  for (const entity of queries.moving) {
    const { driftActive, position, velocity, afterburnerVelocity, breakingVelocity, acceleration } = entity

    velocity.x += acceleration.x
    velocity.y += acceleration.y
    velocity.z += acceleration.z

    // 16 ms per frame / 1000 = 0.0016 seconds per frame
    // velocity of 2000mps * 0.0016 = 3.2 meters per frame
    const deltaSeconds = dt / 1000

    let speed = TmpVectors.Vector3[0].set(velocity.x, velocity.y, velocity.z).length()
    if (afterburnerVelocity != undefined) {
      position.x += afterburnerVelocity.x * deltaSeconds
      position.y += afterburnerVelocity.y * deltaSeconds
      position.z += afterburnerVelocity.z * deltaSeconds
      speed += TmpVectors.Vector3[0].set(afterburnerVelocity.x, afterburnerVelocity.y, afterburnerVelocity.z).length()
    }

    position.x += velocity.x * deltaSeconds
    position.y += velocity.y * deltaSeconds
    position.z += velocity.z * deltaSeconds
    if (breakingVelocity != undefined) {
      position.x += breakingVelocity.x * deltaSeconds
      position.y += breakingVelocity.y * deltaSeconds
      position.z += breakingVelocity.z * deltaSeconds
      speed -= TmpVectors.Vector3[0].set(breakingVelocity.x, breakingVelocity.y, breakingVelocity.z).length()
    }
    SetComponent(entity, "currentSpeed", speed)
  }
}
