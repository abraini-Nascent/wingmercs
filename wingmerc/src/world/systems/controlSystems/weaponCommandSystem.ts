import { IDisposable, Vector3 } from "@babylonjs/core"
import { Entity, queries, world } from "../../world"
import * as Guns from "../../../data/guns"
import * as Weapons from "../../../data/weapons"
import { Gun } from "../../../data/guns/gun";
import { Weapon } from '../../../data/weapons/weapon';
import { SoundEffects } from "../../../utils/sounds/soundEffects";
import { AppContainer } from '../../../app.container';
import { QuaternionFromObj, ToDegree, Vector3FromObj } from '../../../utils/math';

export class WeaponCommandSystem implements IDisposable {
  
  constructor() {
    console.log("[WeaponsSystem] online");
    queries.fireCommands.onEntityAdded.subscribe(this.fireCommandsOnEntityAdded)
  }

  dispose(): void {
    queries.fireCommands.onEntityAdded.unsubscribe(this.fireCommandsOnEntityAdded)
  }
  
  fireCommandsOnEntityAdded = (entity: Entity) => {
    // entity wants to fire guns
    const { fireCommand } = entity;
    if (fireCommand.gun) {
      const guns = entity.guns
      // game sure selected is in safe range
      if (guns.selected >= guns.groups.length) {
        guns.selected = 0
      } else if (guns.selected < 0) {
        guns.selected = 0
      }
      for (const gunIndex of guns.groups[guns.selected]) {
        const gun = guns.mounts[gunIndex]
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
        // console.log(`firing gun ${gunIndex} !`)
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
          // meshName: "meteor", // use meteor for now
          targetName: "",
          meshColor: {r: 100/255, g: 10/255, b: 10/255, a: 1},
          originatorId: ""+world.id(entity),
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
          particleRange: {
            max: gunClass.range,
            total: 0,
            lastPosition: { ...startPosition }
          },
          damage: gunClass.damage,
          trail: true,
          trailOptions: [{
            color: {r: 100/255, g: 10/255, b: 10/255, a: 1},
            width: 1,
            length: 2,
          }],
          physicsRadius: 1,
          bodyType: "animated"
        });
        let laserSound = SoundEffects.Laser()
        laserSound.spatialSound = true
        laserSound.setPosition(new Vector3(startPosition.x, startPosition.y, startPosition.z))
        laserSound.autoplay = true
        laserSound.play()
      }
    }
    // entity wants to fire weapons
    if (fireCommand.weapon) {
      const { position, direction, rotation, rotationQuaternion, targeting, weapons } = entity
      const mounts = entity.weapons.mounts
      const selectedWeapon = mounts[entity.weapons.selected]
      let canFire = true
      if (selectedWeapon == undefined || selectedWeapon.count == 0) {
        canFire = false
      }
      const weaponClass = Weapons[selectedWeapon.type] as Weapon
      if (weaponClass.type == "heatseeking" && !(targeting != undefined && weapons != undefined 
        && targeting.missileLocked && weapons.mounts[weapons.selected].count > 0 && weapons.delta == 0)) {
        canFire = false
      }
      if (canFire) {
          const weaponClass: Weapon = Weapons[weapons.mounts[weapons.selected].type]
          weapons.mounts[weapons.selected].count -= 1
          if (weapons.mounts[weapons.selected].count == 0) {
            // find next available weapon
            for (let i = 0, found = false; i < weapons.mounts.length && found == false; i += 1) {
              weapons.selected += 1
              if (weapons.selected >= weapons.mounts.length) {
                weapons.selected = 0
              }
              found = weapons.mounts[weapons.selected].count > 0
            }
          }
          weapons.delta = weaponClass.delay
          world.update(entity, "weapons", weapons)
          // missile away
          console.log("[Weapons] !!Missile Away!!")
          const startPosition = {
            x: position.x,
            y: position.y,
            z: position.z
          }
          const forward = new Vector3(0, 0, -1)
          let burn = weaponClass.speed
          forward.multiplyInPlace(new Vector3(burn, burn, burn))
          forward.applyRotationQuaternionInPlace(QuaternionFromObj(rotationQuaternion))
          if (entity.nerdStats) {
            entity.nerdStats.missilesLaunched += 1
          }
          SoundEffects.MissileLaunch(Vector3FromObj(startPosition))
  
          // create missile
          world.add({
            targetName: `${weaponClass.name} missile`,
            originatorId: ""+world.id(entity),
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
            rotationQuaternion: {
              x: rotationQuaternion.x,
              y: rotationQuaternion.y,
              z: rotationQuaternion.z,
              w: rotationQuaternion.w,
            },
            rotation: {
              x: rotation.x,
              y: rotation.y,
              z: rotation.z,
            },
            acceleration: { x: 0, y: 0, z: 0 },
            missileRange: {
              type: weaponClass.class,
              target: targeting.target,
              max: weaponClass.range,
              total: 0,
              lastPosition: { ...startPosition }
            },
            missileEngine: true,
            damage: 20,
            trail: true,
            trailOptions: [{
              start: {x: 0, y: -5, z: 0},
              color: {r: 200/255, g: 20/255, b: 20/255, a: 1},
              width: 0.2,
              length: 20
            },{
              start: {x: 0, y: -5, z: 20},
              color: {r: 200/255, g: 200/255, b: 200/255, a: 1},
              width: 0.4,
              length: 4000,
            }],
            // camera: true,
            isTargetable: "missile",
            // bodyType: "animated"
          });
          world
      }
    }
    // locking
    if (fireCommand.lock) {
      // console.log("[WeaponSystems] attempting lock")
      // FOR NOW: assuming a target sparse environment, we will just check locking against every enemy
      const entityId = world.id(entity)
      const { direction, position, targeting } = entity
      const entityDirection = Vector3FromObj(direction)
      const entityPosition = Vector3FromObj(position)
      let smallestDistance = Number.MAX_SAFE_INTEGER
      let closestTarget: number = undefined
      for (const target of queries.targets.entities) {
        const targetId = world.id(target)
        const targetPosition = Vector3FromObj(target.position)
        if (entityId == targetId) {
          continue
        }
        const directionToTarget = targetPosition.subtract(entityPosition).normalize()
        const delta = AngleBetweenVectors(entityDirection, directionToTarget)
        if (ToDegree(delta) > 45) {
          // this isn't a valid target
          continue
        }
        if (delta < smallestDistance) {
          smallestDistance = delta
          closestTarget = targetId
        }
      }
      // console.log("[WeaponSystems] locked target", closestTarget)
      if (targeting.target != closestTarget) {
        // reset target time when target changes
        targeting.targetingTime = 0
      }
      targeting.target = closestTarget
      targeting.locked = true
      if (entity == AppContainer.instance.player?.playerEntity) {
        let sound = SoundEffects.Select()
        sound.play()
        sound.onended = () => {
          sound.dispose()
          sound = undefined
        }
      }
      world.update(entity, "targeting", targeting)
    }
    // remove the command
    queueMicrotask(() => {
      world.removeComponent(entity, "fireCommand")
    })
  }
}

// unsigned angle in radians between two vectors, smallest possible angle, between 0 and 180
function AngleBetweenVectors(vector1: Vector3, vector2: Vector3): number {
  // Calculate the dot product of normalized vectors
  const dotProduct = Vector3.Dot(vector1.normalize(), vector2.normalize());

  // Ensure dot product is within valid range [-1, 1]
  const clampedDotProduct = clamp(dotProduct, -1, 1);

  // Calculate the angle in radians using the arc cosine
  const angleRadians = Math.acos(clampedDotProduct);

  return angleRadians;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
