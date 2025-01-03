import { Color3, Mesh, MeshBuilder, StandardMaterial, TransformNode, Vector3 } from "@babylonjs/core"
import { CreateEntity, Entity, EntityUUID, HandoffEntity, queries, SetComponent, world } from "../../world"
import * as Guns from "../../../data/guns"
import { Weapons } from "../../../data/weapons"
import { Gun } from "../../../data/guns/gun"
import { Weapon } from "../../../data/weapons/weapon"
import { SoundEffects } from "../../../utils/sounds/soundEffects"
import { AppContainer } from "../../../app.container"
import { QuaternionFromObj, ToDegree, Vector3FromObj } from "../../../utils/math"
import { applyModifier } from "../../factories"
import { nearestEnemy } from "../ai/shipIntelligence"
import { MercParticlePointEmitter } from "../../../utils/particles/mercParticleEmitters"
import { MercParticles } from "../../../utils/particles/mercParticles"
import { debugLog } from "../../../utils/debuglog"

export const weaponCommandSystem = () => {
  for (const fireCommandEntity of queries.fireCommands.entities) {
    handleFireCommand(fireCommandEntity)
  }
}

let bolts = new Map<number, Mesh>()
let gunMat = new Map<number, StandardMaterial>()
function matForGun(color: Color3): StandardMaterial {
  const hash = color.getHashCode()
  if (gunMat.has(hash)) {
    return gunMat.get(hash)
  }
  const mat = new StandardMaterial(`gunmat-${hash}`)
  mat.specularColor = Color3.Black()
  mat.diffuseColor = color.clone()
  mat.emissiveColor = color.clone()
  gunMat.set(hash, mat)
  return mat
}
function boltForGun(color: Color3): Mesh {
  const hash = color.getHashCode()
  if (bolts.has(hash)) {
    return bolts.get(hash)
  }
  const bolt = MeshBuilder.CreateBox("Bolt", { width: 1, height: 1, depth: 10 })
  bolt.alwaysSelectAsActiveMesh = true
  bolt.isVisible = false
  const mat = new StandardMaterial(`gunmat-${hash}`)
  mat.specularColor = Color3.Black()
  mat.diffuseColor = color.clone()
  mat.emissiveColor = color.clone()
  bolt.material = mat
  bolts.set(hash, bolt)
  return bolt
}
let missile: Mesh
const handleFireCommand = (entity: Entity) => {
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
      if (gun == undefined) {
        continue
      }
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
        }
      } else {
        const { gunAmmo } = entity
        if (gunAmmo == undefined || gunAmmo[gun.ammo] == undefined || gunAmmo[gun.ammo]?.current < 0) {
          // not enough ammo to fire gun
          continue
        } else {
          gunAmmo[gun.ammo].current -= 1
        }
      }
      // debugLog(`firing gun ${gunIndex} !`)

      // set gun delta to delay
      gun.delta = delay
      // calculate velocity
      const { playerId, rotationQuaternion, position, direction } = entity
      const forward = new Vector3(0, 0, -1)
      let burn = speed
      forward.multiplyInPlace(new Vector3(burn, burn, burn))
      forward.applyRotationQuaternionInPlace(QuaternionFromObj(rotationQuaternion))
      // calcuate starting position
      const gunPosition = new Vector3(gun.possition.x, gun.possition.y, gun.possition.z)
      gunPosition.applyRotationQuaternionInPlace(QuaternionFromObj(rotationQuaternion))
      const startPosition = {
        x: position.x + gunPosition.x,
        y: position.y + gunPosition.y,
        z: position.z + gunPosition.z,
      }
      // create particle
      let particle = CreateEntity({
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
        // trail: true,
        // trailOptions: [
        //   {
        //     color: {
        //       r: gunClass.color.r,
        //       g: gunClass.color.g,
        //       b: gunClass.color.b,
        //       a: 1,
        //     },
        //     width: 1,
        //     length: 2,
        //   },
        // ],
        physicsRadius: 0.25,
        physicsUseRadius: true,
      })
      /// bolt prime model
      const bolt = boltForGun(new Color3(gunClass.color.r, gunClass.color.g, gunClass.color.b))
      /// bolt instance model
      const boltInstance = bolt.createInstance("bolt-instance")
      boltInstance.isVisible = true
      boltInstance.rotationQuaternion = QuaternionFromObj(entity.rotationQuaternion)
      const boltNode = new TransformNode("bolt-transform-node")
      boltInstance.setParent(boltNode)
      boltNode.position.set(startPosition.x, startPosition.y, startPosition.z)

      world.update(particle, {
        boltMesh: boltInstance,
        node: boltNode,
        bodyType: "animated",
      })
      particle.disposables.add(boltNode)

      if (AppContainer.instance.multiplayer && AppContainer.instance.server == false) {
        HandoffEntity(particle)
      }
      SoundEffects.Laser(new Vector3(startPosition.x, startPosition.y, startPosition.z))
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
    debugLog("[weaponCommandSystem] attempting to fire", weaponClass, entity.id)
    if (
      (weaponClass.weaponType == "heatseeking" || weaponClass.weaponType == "imagerecognition") &&
      !(
        targeting != undefined &&
        weapons != undefined &&
        targeting.missileLocked &&
        weapons.mounts[weapons.selected].count > 0 &&
        weapons.delta == 0
      )
    ) {
      canFire = false
      debugLog("[weaponCommandSystem] can't fire weapon", entity.id)
    }
    if (canFire) {
      const weaponClass: Weapon = Weapons[weapons.mounts[weapons.selected].type]
      const mount = weapons.mounts[weapons.selected]
      mount.count -= 1
      if (mount.count == 0) {
        // find next available weapon
        for (let i = 0, found = false; i < weapons.mounts.length && found == false; i += 1) {
          weapons.selected += 1
          if (weapons.selected >= weapons.mounts.length) {
            weapons.selected = 0
          }
          found = mount.count > 0
        }
      }
      weapons.delta = weaponClass.delay
      SetComponent(entity, "weapons", weapons)
      // missile away
      debugLog("[weaponCommandSystem] !!Missile Away!!", entity.id)
      const launchPosition = Vector3FromObj(mount.position)
      launchPosition.applyRotationQuaternionInPlace(QuaternionFromObj(rotationQuaternion))
      const startPosition = {
        x: position.x + launchPosition.x,
        y: position.y + launchPosition.y,
        z: position.z + launchPosition.z,
      }
      const forward = new Vector3(0, 0, -1)
      let burn = weaponClass.speed
      forward.multiplyInPlace(new Vector3(burn, burn, burn))
      forward.applyRotationQuaternionInPlace(QuaternionFromObj(rotationQuaternion))
      if (entity.nerdStats) {
        entity.nerdStats.missilesLaunched += 1
      }
      SoundEffects.MissileLaunch(Vector3FromObj(startPosition))

      let target = targeting.target
      if (target == undefined && weaponClass.weaponType == "friendorfoe") {
        // find nearest enemy
        const nearestTarget = nearestEnemy(entity, weaponClass.range)
        debugLog("[weaponCommandSystem] targeting nearest enemy", target)
        target = nearestTarget.id
      }
      // create missile
      const weaponEntity = CreateEntity({
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
        // trail: true,
        // trailOptions: [
        //   {
        //     start: { x: 0, y: 0, z: 0 },
        //     color: { r: 200 / 255, g: 20 / 255, b: 20 / 255, a: 1 },
        //     width: 0.2,
        //     length: 20,
        //   },
        //   {
        //     start: { x: 0, y: 0, z: 20 },
        //     color: { r: 200 / 255, g: 200 / 255, b: 200 / 255, a: 1 },
        //     width: 0.4,
        //     length: 4000,
        //   },
        // ],
        // camera: true,
        isTargetable: "missile",
        // bodyType: "animated"
      })
      if (missile == undefined) {
        const newMissle = MeshBuilder.CreateBox("Missile", { width: 0.5, height: 0.5, depth: 5 })
        newMissle.alwaysSelectAsActiveMesh = true
        newMissle.isVisible = false
        const mat = new StandardMaterial(`missile-mat}`)
        mat.specularColor = Color3.Black()
        mat.diffuseColor = Color3.White()
        newMissle.material = mat
        missile = newMissle
      }
      const missileInstance = missile.createInstance("missile-instance")
      const missileNode = new TransformNode("missile Node")
      missileInstance.parent = missileNode
      weaponEntity.disposables.add(missileNode)
      world.addComponent(weaponEntity, "node", missileNode)

      const pointEmitter = new MercParticlePointEmitter()
      pointEmitter.initialPositionFunction = (particle) => {
        Vector3FromObj(weaponEntity.position, particle.position)
        return particle
      }
      pointEmitter.initialDirectionFunction = (particle) => {
        let direction = particle.props.direction as Vector3
        direction.x = weaponEntity.direction.x * -1
        direction.y = weaponEntity.direction.y * -1
        direction.z = weaponEntity.direction.z * -1
        return particle
      }
      let sps = MercParticles.missileTrail(`missile-trail`, AppContainer.instance.scene, pointEmitter)
      weaponEntity.disposables.add({
        dispose: () => {
          sps.stopped = true
          sps.onDone = () => {
            sps.dispose
            sps.onDone = undefined
            sps = undefined
          }
        },
      })

      if (AppContainer.instance.multiplayer && AppContainer.instance.server == false) {
        HandoffEntity(weaponEntity)
      }
    }
  }

  if (fireCommand.nav) {
    // find the next nav
    const entityId = entity.id
    const { targeting, vduState } = entity
    let nextNav = true
    if (vduState) {
      if (vduState.right != "destination") {
        vduState.right = "destination"
        nextNav = false
      }
    }
    if (nextNav) {
      let validTargets: EntityUUID[] = []
      let currentTarget = targeting.destination
      for (const target of queries.targets.entities) {
        const targetId = target.id
        if (entityId == targetId) {
          continue
        }
        if (target.isTargetable != "nav") {
          continue
        }
        // if there are no current targets set the first target
        if (currentTarget == undefined) {
          targeting.destination = targetId
          break
        }
        validTargets.push(target.id)
      }
      if (validTargets.length > 0) {
        let indexOfCurrentTarget = validTargets.indexOf(currentTarget)
        if (indexOfCurrentTarget == -1) {
          // target is not around anymore? set to first valid target
          targeting.destination = validTargets[0]
        }
        let nextTargetIndex = (indexOfCurrentTarget + 1) % validTargets.length
        targeting.destination = validTargets[nextTargetIndex]
      }
    }
  }

  /// TARGETING
  if (fireCommand.target) {
    // find the next enemy
    const entityId = entity.id
    const { targeting, vduState } = entity
    if (vduState) {
      vduState.right = "target"
    }
    let validTargets: EntityUUID[] = []
    let currentTarget = targeting.target
    for (const target of queries.targets.entities) {
      const targetId = target.id
      if (entityId == targetId) {
        continue
      }
      if (target.isTargetable == "nav" || target.isTargetable == "missile") {
        continue
      }
      // if there are no current targets set the first target
      if (currentTarget == undefined) {
        targeting.target = targetId
        break
      }
      validTargets.push(target.id)
    }
    if (validTargets.length >= 0) {
      let indexOfCurrentTarget = validTargets.indexOf(currentTarget)
      if (indexOfCurrentTarget == -1) {
        // target is not around anymore? set to first valid target
        targeting.target = validTargets[0]
      }
      let nextTargetIndex = (indexOfCurrentTarget + 1) % validTargets.length
      targeting.target = validTargets[nextTargetIndex]
    }
  }

  /// LOCKING
  if (fireCommand.lock) {
    // debugLog("[WeaponSystems] attempting lock")
    // FOR NOW: assuming a target sparse environment, we will just check locking against every enemy
    const entityId = entity.id
    const { direction, position, targeting, vduState } = entity
    if (vduState) {
      vduState.right = "target"
    }
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
      if (target.isTargetable == "nav") {
        // don't lock nav beacons
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
    // debugLog("[WeaponSystems] locked target", closestTarget)
    if (targeting.target != closestTarget) {
      // reset target time when target changes
      targeting.targetingTime = 0
      targeting.timeToLock = -1
    }
    if (closestTarget == undefined) {
      targeting.target = undefined
      targeting.targetingTime = 0
      targeting.timeToLock = -1
    } else if (closestTarget == targeting.target) {
      targeting.locked = !targeting.locked
    } else {
      targeting.target = closestTarget
      targeting.locked = true
    }
    if (entity == AppContainer.instance.player?.playerEntity) {
      SoundEffects.Select()
    }
    SetComponent(entity, "targeting", targeting)
  }
  // remove the command
  queueMicrotask(() => {
    world.removeComponent(entity, "fireCommand")
  })
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
