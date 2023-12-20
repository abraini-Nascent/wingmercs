import { Quaternion, Vector3 } from "@babylonjs/core"
import { queries, world } from "../world"
import * as Guns from "../../data/guns"
import { Gun } from "../../data/guns/gun";

console.log("[WeaponsSystem] online");
queries.fireCommands.onEntityAdded.subscribe((entity) => {
  // entity wants to fire
  const { fireCommand } = entity;
  if (fireCommand.gun) {
    // TODO which guns are being fired? for now we fire them all
    const guns = entity.guns
    for (const [gunIndex, gun] of Object.entries(guns)) {
      const gunClass: Gun = Guns[gun.class]
      if (gun.delta > 0) {
        // gun isn't ready to fire yet
        continue
      }
      // check for energy
      const { engine } = entity;
      if (engine != undefined && engine.currentCapacity < gunClass.energy) {
        // not enough energy to fire gun
        continue
      }
      console.log(`firing gun ${gunIndex} !`)
      // reduce energy
      engine.currentCapacity -= gunClass.energy
      world.update(entity, "engine", engine)
      // set gun delta to delay
      gun.delta = gunClass.delay
      world.update(entity, "guns", guns)
      // calculate velocity
      const { playerId, rotationQuaternion, position, direction } = entity
      const forward = new Vector3(0, 0, -1)
      let burn = gunClass.speed
      forward.multiplyInPlace(new Vector3(burn, burn, burn))
      forward.applyRotationQuaternionInPlace(QuaternionFromObj(rotationQuaternion))
      // calcuate starting position
      const gunPosition = new Vector3(gun.possition.x, gun.possition.y, gun.possition.z)
      gunPosition.applyRotationQuaternionInPlace(QuaternionFromObj(rotationQuaternion))
      const startPosition = {
        x: position.x + gunPosition.x,
        y: position.y + gunPosition.y,
        z: position.z + gunPosition.z
      }
      // create particle
      world.add({
        meshName: "meteor", // use meteor for now
        meshColor: {r: 100/255, g: 10/255, b: 10/255, a: 1},
        originatorId: playerId,
        position: { ...startPosition },
        direction: {
          x: direction.x,
          y: direction.y,
          z: direction.z,
        },
        velocity: {
          x: forward.x,
          y: forward.y,
          z: forward.z
        },
        acceleration: { x: 0, y: 0, z: 0 },
        range: {
          max: gunClass.range,
          total: 0,
          lastPosition: { ...startPosition }
        },
        damage: gunClass.damage,
        trail: true,
        trailOptions: {
          color: {r: 100/255, g: 10/255, b: 10/255, a: 1},
          width: 0.2,
          length: 2,
        },
        bodyType: "animated"
      });
    }
  }
  // remove the command
  world.removeComponent(entity, "fireCommand")
})

function QuaternionFromObj(obj: {x: number, y: number, z: number, w: number}): Quaternion {
  return new Quaternion(obj.x, obj.y, obj.z, obj.w);
}