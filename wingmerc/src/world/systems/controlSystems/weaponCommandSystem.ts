import { IDisposable, Vector3 } from "@babylonjs/core"
import { CreateEntity, Entity, EntityUUID, queries, world } from "../../world"
import * as Guns from "../../../data/guns"
import * as Weapons from "../../../data/weapons"
import { Gun } from "../../../data/guns/gun"
import { Weapon } from "../../../data/weapons/weapon"
import { SoundEffects } from "../../../utils/sounds/soundEffects"
import { AppContainer } from "../../../app.container"
import {
  QuaternionFromObj,
  ToDegree,
  Vector3FromObj,
} from "../../../utils/math"
import { applyModifier } from "../../factories"
import { nearestEnemy } from "../ai/shipIntelligence"

export class WeaponCommandSystem implements IDisposable {
  constructor() {
    console.log("[WeaponsSystem] online")
    queries.fireCommands.onEntityAdded.subscribe(this.fireCommandsOnEntityAdded)
  }

  dispose(): void {
    queries.fireCommands.onEntityAdded.unsubscribe(
      this.fireCommandsOnEntityAdded
    )
  }

  fireCommandsOnEntityAdded = (entity: Entity) => {
    // entity wants to fire guns
    const { fireCommand } = entity
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
        const gunStats = gun.stats
        if (gun.delta > 0) {
          // gun isn't ready to fire yet
          continue
        }
        // get modifier stats
        const affix = gun.modifier
        const energy = applyModifier(gunStats.energy, affix?.energy)
        const damage = applyModifier(gunStats.damage, affix?.damage)
        const delay = applyModifier(gunStats.delay, affix?.delay)
        const speed = applyModifier(gunStats.speed, affix?.speed)
        const range = applyModifier(gunStats.range, affix?.range)
        // check for energy or ammo
        if (gun.ammo == undefined) {
          const { powerPlant } = entity
          if (powerPlant != undefined && powerPlant.currentCapacity < energy) {
            // not enough energy to fire gun
            continue
          } else {
            // reduce energy
            powerPlant.currentCapacity -= energy
            world.update(entity, "powerPlant", powerPlant)
          }
        } else {
          const { gunAmmo } = entity
          if (
            gunAmmo == undefined ||
            gunAmmo[gun.ammo] == undefined ||
            gunAmmo[gun.ammo]?.current < 0
          ) {
            // not enough ammo to fire gun
            continue
          } else {
            gunAmmo[gun.ammo].current -= 1
          }
        }
        // console.log(`firing gun ${gunIndex} !`)

        // set gun delta to delay
        gun.delta = delay
        world.update(entity, "guns", guns)
        // calculate velocity
        const { playerId, rotationQuaternion, position, direction } = entity
        const forward = new Vector3(0, 0, -1)
        let burn = speed
        forward.multiplyInPlace(new Vector3(burn, burn, burn))
        forward.applyRotationQuaternionInPlace(
          QuaternionFromObj(rotationQuaternion)
        )
        // calcuate starting position
        const gunPosition = new Vector3(
          gun.possition.x,
          gun.possition.y,
          gun.possition.z
        )
        gunPosition.applyRotationQuaternionInPlace(
          QuaternionFromObj(rotationQuaternion)
        )
        const startPosition = {
          x: position.x + gunPosition.x,
          y: position.y + gunPosition.y,
          z: position.z + gunPosition.z,
        }
        // create particle
        CreateEntity({
          // meshName: "meteor", // use meteor for now
          targetName: "",
          meshColor: { r: 100 / 255, g: 10 / 255, b: 10 / 255, a: 1 },
          originatorId: entity.id,
          position: { ...startPosition },
          direction: {
            x: direction.x,
            y: direction.y,
            z: direction.z,
          },
          velocity: {
            x: forward.x,
            y: forward.y,
            z: forward.z,
          },
          acceleration: { x: 0, y: 0, z: 0 },
          particleRange: {
            max: range,
            total: 0,
            lastPosition: { ...startPosition },
          },
          damage: damage,
          trail: true,
          trailOptions: [
            {
              color: {
                r: gunClass.color.r,
                g: gunClass.color.g,
                b: gunClass.color.b,
                a: 1,
              },
              width: 1,
              length: 2,
            },
          ],
          physicsRadius: .5,
          bodyType: "animated",
        })
        let laserSound = SoundEffects.Laser()
        laserSound.spatialSound = true
        laserSound.setPosition(
          new Vector3(startPosition.x, startPosition.y, startPosition.z)
        )
        laserSound.autoplay = true
        laserSound.play()
      }
    }
    // entity wants to fire weapons
    if (fireCommand.weapon) {
      const {
        position,
        direction,
        rotation,
        rotationQuaternion,
        targeting,
        weapons,
      } = entity
      const mounts = entity.weapons.mounts
      const selectedWeapon = mounts[entity.weapons.selected]
      let canFire = true
      if (selectedWeapon == undefined || selectedWeapon.count == 0) {
        canFire = false
      }
      const weaponClass = Weapons[selectedWeapon.type] as Weapon
      if (
        (weaponClass.type == "heatseeking" ||
          weaponClass.type == "imagerecognition") &&
        !(
          targeting != undefined &&
          weapons != undefined &&
          targeting.missileLocked &&
          weapons.mounts[weapons.selected].count > 0 &&
          weapons.delta == 0
        )
      ) {
        canFire = false
      }
      if (canFire) {
        const weaponClass: Weapon =
          Weapons[weapons.mounts[weapons.selected].type]
        weapons.mounts[weapons.selected].count -= 1
        if (weapons.mounts[weapons.selected].count == 0) {
          // find next available weapon
          for (
            let i = 0, found = false;
            i < weapons.mounts.length && found == false;
            i += 1
          ) {
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
          z: position.z,
        }
        const forward = new Vector3(0, 0, -1)
        let burn = weaponClass.speed
        forward.multiplyInPlace(new Vector3(burn, burn, burn))
        forward.applyRotationQuaternionInPlace(
          QuaternionFromObj(rotationQuaternion)
        )
        if (entity.nerdStats) {
          entity.nerdStats.missilesLaunched += 1
        }
        SoundEffects.MissileLaunch(Vector3FromObj(startPosition))

        let target = targeting.target
        if (target == undefined && weaponClass.type == "friendorfoe") {
          // find nearest enemy
          const nearestTarget = nearestEnemy(entity, weaponClass.range)
          console.log("[weaponCommandSystem] targeting nearest enemy", target)
          target = nearestTarget.id
        }
        // create missile
        CreateEntity({
          targetName: `${weaponClass.name} missile`,
          originatorId: entity.id,
          position: { ...startPosition },
          direction: {
            x: direction.x,
            y: direction.y,
            z: direction.z,
          },
          velocity: {
            x: forward.x,
            y: forward.y,
            z: forward.z,
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
            target: target,
            max: weaponClass.range,
            total: 0,
            lastPosition: { ...startPosition },
          },
          missileEngine: true,
          damage: weaponClass.damage,
          trail: true,
          trailOptions: [
            {
              start: { x: 0, y: 0, z: 0 },
              color: { r: 200 / 255, g: 20 / 255, b: 20 / 255, a: 1 },
              width: 0.2,
              length: 20,
            },
            {
              start: { x: 0, y: 0, z: 20 },
              color: { r: 200 / 255, g: 200 / 255, b: 200 / 255, a: 1 },
              width: 0.4,
              length: 4000,
            },
          ],
          // camera: true,
          isTargetable: "missile",
          // bodyType: "animated"
        })
      }
    }
    // locking
    if (fireCommand.lock) {
      // console.log("[WeaponSystems] attempting lock")
      // FOR NOW: assuming a target sparse environment, we will just check locking against every enemy
      const entityId = entity.id
      const { direction, position, targeting } = entity
      const entityDirection = Vector3FromObj(direction)
      const entityPosition = Vector3FromObj(position)
      let smallestDistance = Number.MAX_SAFE_INTEGER
      let closestTarget: EntityUUID = undefined
      for (const target of queries.targets.entities) {
        const targetId = target.id
        const targetPosition = Vector3FromObj(target.position)
        if (entityId == targetId) {
          continue
        }
        const directionToTarget = targetPosition
          .subtract(entityPosition)
          .normalize()
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
  const dotProduct = Vector3.Dot(vector1.normalize(), vector2.normalize())

  // Ensure dot product is within valid range [-1, 1]
  const clampedDotProduct = clamp(dotProduct, -1, 1)

  // Calculate the angle in radians using the arc cosine
  const angleRadians = Math.acos(clampedDotProduct)

  return angleRadians
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
