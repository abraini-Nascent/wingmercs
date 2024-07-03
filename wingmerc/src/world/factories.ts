import { ComponentModifier, GunMounts, GunSelection, GunTier, ShipStructureSection, StructureSections, UtilityModifierDetails, WeaponMounts, WeaponSelection } from '../data/ships/shipTemplate';
import { ShipTemplate } from "../data/ships/shipTemplate"
import * as GunData from "../data/guns"
import { Gun, GunStats, GunType, Guns } from "../data/guns/gun"
import { Entity, FuelTank, ShipArmor, ShipEngine, ShipGunAmmoCounts, ShipGuns, ShipGunsMount, ShipPowerPlant, ShipShields, ShipSystems, ShipThrusters, ShipUtilities, ShipUtility, ShipWeaponMount, ShipWeapons, world } from "./world"
import { net } from "../net"
import * as WeaponData from '../data/weapons';
import { Weapon, WeaponType } from '../data/weapons/weapon';
import * as GunAffixes from '../data/affixes/gunAffixes';
import { GunAffix } from '../data/affixes/gunAffix';
import { Voice } from '../utils/speaking';
import { rand, random } from '../utils/random';


export function applyModifier(value: number, modifier: ComponentModifier): number {
  if (modifier == undefined) {
    return value
  }
  if (modifier.percent) {
    return value + (value * modifier.value)
  }
  return value + modifier.value
}

export function createCustomShip(ship: ShipTemplate, x: number, y: number, z: number, teamId?: number, groupId?): Entity {
  console.log(`[CreateShip] creating new custom ship ${ship.name}`)
  let guns: ShipGuns;
  const gunMounts: ShipGunsMount[] = Object.values(StructureSections).reduce((allMounts, structureSection) => {
    const structure: ShipStructureSection = ship.structure[structureSection]
    const gunMounts = structure.gunMounts
    if (gunMounts != undefined) {
      let mounts: ShipGunsMount[] = gunMounts.map((gunMount) => {
        const gunSelection: GunSelection = gunMount.base ?? { type: GunType.laser }
        const gunTemplate: Gun = GunData[gunSelection.type]
        const gunStats: GunStats = gunTemplate.tiers[gunSelection.tier ?? 1]
        return {
          class: gunSelection.type,
          currentHealth: gunStats.health,
          name: gunTemplate.name,
          ammo: gunTemplate.ammo,
          stats: {...gunStats},
          modifier: gunSelection.affix ? GunAffixes[gunSelection.affix] : undefined,
          delta: 0,
          possition: { ...gunMount.position }
        }
      })
      allMounts.push(...mounts)
    }
    return allMounts
  }, [])
  // create groups from different weapon types
  let selectedGroup = 0
  const groups = Object.entries(gunMounts.reduce((types, mount, index) => {
    if (types[mount.class] == undefined) {
      types[mount.class] = [index]
    } else {
      types[mount.class].push(index)
    }
    return types
  }, {})).reduce((groups, typeGroup, index) => {
    groups[index] = typeGroup
    return groups
  }, [])
  if (groups.length > 0) {
    // there is more than one group, so we should make a group for them all
    groups.push([...gunMounts.map((_mount, index) => { return index })])
    selectedGroup = groups.length - 1
  }

  guns = {
    mounts: gunMounts.reduce((mounts, mount, index) => {
      mounts[index] = mount
      return mounts
    }, {}),
    groups,
    selected: selectedGroup
  }

  const weaponMounts: ShipWeaponMount[] = Object.values(StructureSections).reduce((allMounts, structureSection) => {
    const structure: ShipStructureSection = ship.structure[structureSection]
    const weaponMounts = structure.weaponMounts
    if (weaponMounts != undefined) {
      let mounts: ShipWeaponMount[] = weaponMounts.map((weaponMount) => {
        const weaponClass: WeaponSelection = weaponMount.base
        const weaponTemplate: Weapon = WeaponData[weaponClass.type]
        return {
          count: weaponClass.count,
          baseCount: weaponClass.count,
          type: weaponClass.type
        }
      })
      allMounts.push(...mounts)
    }
    return allMounts
  }, [])
  const weapons: ShipWeapons = {
    delta: 0,
    mounts: weaponMounts,
    selected: 0
  }
  const utilities: ShipUtilities = Object.values(StructureSections).reduce((allMounts, structureSection) => {
    const structure: ShipStructureSection = ship.structure[structureSection]
    const utilityMounts = structure.utilityMounts
    if (utilityMounts != undefined) {
      utilityMounts.forEach((mount) => {
        if (mount.utility != undefined) {
          allMounts.push({
             name: mount.utility.name,
             modifier: structuredClone(mount.utility),
             currentHealth: 20,
          } as ShipUtility)
        }
      })
    }
    return allMounts
  }, [])
  const gunAmmo: ShipGunAmmoCounts = Object.values(StructureSections).reduce((allAmmoCounts, structureSection) => {
    const structure: ShipStructureSection = ship.structure[structureSection]
    const utilityMounts = structure.utilityMounts
    if (utilityMounts != undefined) {
      utilityMounts.forEach((mount) => {
        if (mount.utility != undefined && mount.utility.ammo != undefined) {
          if (allAmmoCounts[mount.utility.ammo] == undefined) {
            allAmmoCounts[mount.utility.ammo] = {
              base: mount.utility.ammoCount,
              current: mount.utility.ammoCount
            }
          } else {
            allAmmoCounts[mount.utility.ammo].base += mount.utility.ammoCount
            allAmmoCounts[mount.utility.ammo].current += mount.utility.ammoCount
          }
        }
      })
    }
    return allAmmoCounts
  }, {})
  const shipPowerPlant: ShipPowerPlant = {
    currentCapacity: ship.powerPlantSlot.base.maxCapacity,
    maxCapacity: ship.powerPlantSlot.base.maxCapacity,
    rate: ship.powerPlantSlot.base.rate,
  }
  if (ship.powerPlantSlot.modifier) {
    shipPowerPlant.maxCapacity = applyModifier(shipPowerPlant.maxCapacity, ship.powerPlantSlot.modifier.maxCapacity)
    shipPowerPlant.currentCapacity = shipPowerPlant.maxCapacity
    shipPowerPlant.rate = applyModifier(shipPowerPlant.rate, ship.powerPlantSlot.modifier.rate)
  }
  const shipShields: ShipShields = {
    maxFore: ship.shieldsSlot.base.fore,
    currentFore: ship.shieldsSlot.base.fore,
    maxAft: ship.shieldsSlot.base.aft,
    currentAft: ship.shieldsSlot.base.aft,
    energyDrain: ship.shieldsSlot.base.energyDrain,
    rechargeRate: ship.shieldsSlot.base.rechargeRate,
  }
  if (ship.shieldsSlot.modifier) {
    shipShields.maxFore = applyModifier(shipShields.maxFore, ship.shieldsSlot.modifier.fore)
    shipShields.currentFore = shipShields.maxFore
    shipShields.maxAft = applyModifier(shipShields.maxAft, ship.shieldsSlot.modifier.aft)
    shipShields.currentAft = shipShields.maxAft
    shipShields.energyDrain = applyModifier(shipShields.energyDrain, ship.shieldsSlot.modifier.energyDrain)
    shipShields.rechargeRate = applyModifier(shipShields.rechargeRate, ship.shieldsSlot.modifier.rechargeRate)
  }
  const fuelTank = {
    maxCapacity: ship.fuelTankSlot.base.capacity,
    currentCapacity: ship.fuelTankSlot.base.capacity
  } as FuelTank
  const extras: { energy: number, fuel: number, shields: number } = Object.values(StructureSections).reduce((extras, structureSection) => {
    const structure: ShipStructureSection = ship.structure[structureSection]
    const utilityMounts = structure.utilityMounts
    if (utilityMounts != undefined) {
      utilityMounts.forEach((mount) => {
        if (mount.utility != undefined) {
          if (mount.utility.energy) {
            extras["energy"] += mount.utility.energy.value
          }
          if (mount.utility.fuel) {
            extras["fuel"] += mount.utility.fuel.value
          }
          if (mount.utility.shields) {
            extras["shields"] += mount.utility.shields.value
          }
        }
      })
    }
    return extras
  }, { energy: 0, fuel: 0, shields: 0 })
  if (extras.shields) {
    shipShields.maxAft += shipShields.maxAft * extras.shields
  }
  if (extras.energy) {
    shipPowerPlant.maxCapacity += extras.energy
    shipPowerPlant.currentCapacity += extras.energy
  }
  if (extras.fuel) {
    fuelTank.maxCapacity += extras.fuel
    fuelTank.currentCapacity += extras.fuel
  }
  const shipArmor: ShipArmor = {
    back: ship.structure.back.armor,
    front: ship.structure.front.armor,
    left: ship.structure.left.armor,
    right: ship.structure.right.armor,
    base: {
      back: ship.structure.back.armor,
      front: ship.structure.front.armor,
      left: ship.structure.left.armor,
      right: ship.structure.right.armor,
    }
  }
  const shipEngine = {
    cruiseSpeed: ship.engineSlot.base.cruiseSpeed,
    accelleration: ship.engineSlot.base.accelleration,
    maxSpeed: ship.afterburnerSlot.base.maxSpeed,
    afterburnerAccelleration: ship.afterburnerSlot.base.accelleration,
    fuelConsumeRate: ship.afterburnerSlot.base.fuelConsumeRate
  }
  if (ship.engineSlot.modifier) {
    shipEngine.cruiseSpeed = applyModifier(shipEngine.cruiseSpeed, ship.engineSlot.modifier.cruiseSpeed)
    shipEngine.accelleration = applyModifier(shipEngine.accelleration, ship.engineSlot.modifier.accelleration)
  }
  if (ship.afterburnerSlot.modifier) {
    shipEngine.maxSpeed = applyModifier(shipEngine.maxSpeed, ship.afterburnerSlot.modifier.maxSpeed)
    shipEngine.afterburnerAccelleration = applyModifier(shipEngine.afterburnerAccelleration, ship.afterburnerSlot.modifier.accelleration)
    shipEngine.fuelConsumeRate = applyModifier(shipEngine.fuelConsumeRate, ship.afterburnerSlot.modifier.fuelConsumeRate)
  }
  const shipThrusters: ShipThrusters = {
    pitch: applyModifier(ship.thrustersSlot.base.pitch, ship.thrustersSlot.modifier?.pitch),
    roll: applyModifier(ship.thrustersSlot.base.roll, ship.thrustersSlot.modifier?.roll),
    yaw: applyModifier(ship.thrustersSlot.base.yaw, ship.thrustersSlot.modifier?.yaw),
    breakingForce: applyModifier(ship.thrustersSlot.base.breakingForce, ship.thrustersSlot.modifier?.breakingForce),
    breakingLimit: applyModifier(ship.thrustersSlot.base.breakingLimit, ship.thrustersSlot.modifier?.breakingLimit)
  }
  const shipSystems: ShipSystems = {
    quadrant: {
      fore: JSON.parse(JSON.stringify(ship.systems.quadrant.fore)) as {
        system: "guns"|"radar"|"thrusters"|"targeting"|"weapons"|"engines"|"battery"|"shield"|"power",
        weight: number
      }[], // :\
      aft: JSON.parse(JSON.stringify(ship.systems.quadrant.fore)) as {
        system: "guns"|"radar"|"thrusters"|"targeting"|"weapons"|"engines"|"battery"|"shield"|"power",
        weight: number
      }[] // why you gotta be to awkward there bud :\
    },
    state: {
      afterburners: ship.systems.base.thrusters,
      thrusters: ship.systems.base.thrusters,
      engines: ship.systems.base.engines,
      power: ship.systems.base.power,
      battery: ship.systems.base.battery,
      shield: ship.systems.base.shield,
      radar: ship.systems.base.radar,
      targeting: ship.systems.base.targeting,
      guns: ship.systems.base.guns,
      weapons: ship.systems.base.weapons,
    },
    base: {
      afterburners: ship.systems.base.thrusters,
      thrusters: ship.systems.base.thrusters,
      engines: ship.systems.base.engines,
      power: ship.systems.base.power,
      battery: ship.systems.base.battery,
      shield: ship.systems.base.shield,
      radar: ship.systems.base.radar,
      targeting: ship.systems.base.targeting,
      guns: ship.systems.base.guns,
      weapons: ship.systems.base.weapons,
    }
  }
  const enemyEntity = world.add({
    owner: net.id,
    local: true,
    teamId: teamId,
    groupId: groupId,
    ai: { type: "shipIntelegence", blackboard: {}, pilot: ship.pilot },
    voice: randomVoice(),
    meshName: ship.modelDetails.base,
    shieldMeshName: ship.modelDetails.shield,
    physicsMeshName: ship.modelDetails.physics,
    targetName: ship.name,
    bodyType: "animated",
    trail: true,
    trailOptions: ship.modelDetails.trails.map((trail) => { return { start: { ...trail.start }, color: { ...trail.color }}}),
    planeTemplate: ship.class,
    position: {x, y, z},
    velocity: {x: 0, y: 0, z: 0},
    setSpeed: Math.floor(shipEngine.cruiseSpeed * 0.75),
    currentSpeed: Math.floor(shipEngine.cruiseSpeed * 0.75),
    direction: {x: 0, y: 0, z: -1},
    acceleration: {x: 0, y: 0, z: 0},
    rotationalVelocity: {roll: 0, pitch: 0, yaw: 0},
    rotationQuaternion: {w: 1, x: 0, y:0, z:0},
    rotation: {x: 0, y: 0, z: -1},
    health: {
      current: ship.structure.core.health,
      base: ship.structure.core.health,
    },
    totalScore: 0,
    guns: guns,
    gunAmmo: gunAmmo,
    weapons: weapons,
    utilities: utilities,
    engine: shipEngine,
    powerPlant: shipPowerPlant,
    shields: shipShields,
    armor: shipArmor,
    systems: shipSystems,
    thrusters: shipThrusters,
    fuel: fuelTank,
    targeting: {
      missileLocked: false,
      targetingDirection: { x: 0, y: 0, z: -1 },
      gunInterceptPosition: undefined,
      target: -1,
      locked: false,
      targetingTime: 0,
    },
    isTargetable: "enemy",
    // scale: { x: 2, y: 2, z: 2 }
  })
  return enemyEntity
}

export function allGunSelections(): GunSelection[] {
  const selections: GunSelection[] = Object.values(GunData).reduce((selections, gun) => {
    for (let i = 0; i < 6; i+= 1) {
      selections.push({
        type: gun.class,
        tier: i as GunTier,
      })
    }
    Object.values(GunAffixes).forEach((affix) => {
      // for (let i = 0; i < 6; i+= 1) {
        selections.push({
          type: gun.class,
          tier: 1,
          affix: affix.type
        })
      // }
    })
    return selections
  }, [] as GunSelection[])
  return selections
}

export function gunSelectionName(part: GunSelection): [id: string, name: string] {
  const gun = GunData[part.type]
  let name = gun.name
  let id = gun.class
  let gunModifier: GunAffix
  if (part.affix != undefined) {
    gunModifier = GunAffixes[part.affix]
    name += ` ${gunModifier.name}`
    id += `_${gunModifier.type}`
  }
  id += `_${part.tier ?? 1}`
  if (part.affix == undefined) {
    name += ` tier ${part.tier ?? 1}`
  }
  return [id, name]
}

export function allAmmos(): UtilityModifierDetails[] {
  let ammos = Object.values(GunData).reduce((allAmmo, gun) => {
    console.log(gun.name, gun.ammo)
    if (gun.ammo == undefined) {
      return allAmmo
    }
    allAmmo.push({
      name: `${gun.name} Ammo`,
      id: `${gun.name}_ammo`,
      type: "Utility",
      ammo: gun.ammo,
      ammoCount: gun.ammoPerBin
    } as UtilityModifierDetails)
    return allAmmo
  }, [])

  return ammos
}

export function randomVoice(): Voice {
  /** PITCH
    00-20 impractical
    20-30 very high
    30-40 high
    40-50 high normal
    50-70 normal
    70-80 low normal
    80-90 low
    90-255 very low
    default = 64	
   */
  /** SPEED
    0-20 impractical
    20-40 very fast
    40-60 fast
    60-70 fast conversational
    70-75 normal conversational
    75-90 narrative
    90-100 slow
    100-225 very slow
   */
  const mouth = 110 + rand(0, 35)
  const throat = 110 + rand(0, 35)
  // Use something like a dice roll to skew the distribution towards the middle
  const speed = 60 + rand(0, 15) + rand(0, 15)
  const randPitch = random(); // Get a random number between 0 and 1
  // Apply a quadratic transformation to skew the distribution towards the edges
  const weightedRandPitch = randPitch < 0.5 ? 2 * Math.pow(randPitch, 2) : 1 - 2 * Math.pow(1 - randPitch, 2);
  // Scale the result to the desired range
  const pitch = 60 + Math.floor(weightedRandPitch * (30 - 0 + 1)) + 0;
  const voice: Voice = {
    pitch, 
    speed,
    mouth,
    throat
  }
  return voice
}