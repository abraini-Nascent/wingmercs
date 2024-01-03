import { PhysicsBody, Quaternion, TransformNode, Vector3 } from "@babylonjs/core";
import { rand, random, RouletteSelectionStochastic } from "../utils/random";
import { Entity, ShipArmor, ShipShields, world } from "../world/world";
import { ObjModels } from "../objModels";
import { EnemyLight } from "../data/ships";
import { net } from "../net";

function generateRandomPointInSphere(radius: number, random: () => number): Vector3 {
  const phi = random() * Math.PI * 2;
  const costheta = 2 * random() - 1;
  const theta = Math.acos(costheta);
  const x = radius * Math.sin(theta) * Math.cos(phi);
  const y = radius * Math.sin(theta) * Math.sin(phi);
  const z = radius * Math.cos(theta);
  return new Vector3(x, y, z);
}
const Sizes = [30,50,100]
const Scales = [10, 5, 2]
const Size = [3, 2, 1]
const Children = [2, 4, 0]
const Health = [1, 1, 1]
const Points = [100, 50, 10]

export class AsteroidScene {
  constructor(count: number, radius: number) {
    /*
    r = R * sqrt(random())
    theta = random() * 2 * PI
    (Assuming random() gives a value between 0 and 1 uniformly)

    If you want to convert this to Cartesian coordinates, you can do

    x = centerX + r * cos(theta)
    y = centerY + r * sin(theta)
    */

    for (let i = 0; i < count; i += 1) {
      // const r = radius * Math.sqrt(random())
      // const theta = random() * 2 * Math.PI
      // const phi = random() * Math.PI;
      // const x = r * Math.cos(theta)
      // const z = r * Math.sin(theta)
      // const y = r * Math.cos(phi)
      
      const phi = random() * Math.PI * 2;
      const costheta = 2 * random() - 1;
      const theta = Math.acos(costheta);
      const x = radius * Math.sin(theta) * Math.cos(phi);
      const y = radius * Math.sin(theta) * Math.sin(phi);
      const z = radius * Math.cos(theta);
      const speed = rand(20, 100)
      const velocity = {
        x: random() * speed,
        y: random() * speed,
        z: random() * speed
      }
      const direction = Vector3.Zero()
      const rotation = Vector3.Zero() //new Vector3(random(), random(), random()).normalize()
      const pitch = random() * (random() > 0.5 ? -1 : 1)
      const yaw = random() * (random() > 0.5 ? -1 : 1)
      const roll = random() * (random() > 0.5 ? -1 : 1)
      const rotationQuaternion = Quaternion.Identity()
      const rotationalVelocity = {
        pitch, yaw, roll
      }
      const size = RouletteSelectionStochastic(Sizes)
      world.add({
        meshName: "meteorDetailed",
        health: Health[size],
        worth: Points[size],
        scale: {
          x: Scales[size],
          y: Scales[size],
          z: Scales[size],
        },
        asteroidSize: Size[size],
        position: {
          x, y, z
        },
        velocity,
        direction,
        acceleration: {x:0, y:0, z:0},
        rotation,
        rotationQuaternion,
        rotationalVelocity,
        bodyType: "animated"
      })
    }

    for (let i = 0; i < 3; i += 1) {
      // const r = radius * Math.sqrt(random())
      // const theta = random() * 2 * Math.PI
      // const phi = random() * Math.PI;
      // const x = r * Math.cos(theta)
      // const z = r * Math.sin(theta)
      // const y = r * Math.cos(phi)
      

      const r = radius * random()
      const phi = random() * Math.PI * 2;
      const costheta = 2 * random() - 1;
      const theta = Math.acos(costheta);
      const x = r * Math.sin(theta) * Math.cos(phi);
      const y = r * Math.sin(theta) * Math.sin(phi);
      const z = r * Math.cos(theta);
      // add enemy ship
      createEnemyShip(x, y, z)
    }
  }
}

export function explodeAsteroid(asteroid: Partial<Entity>) {
  let asteroidSize = asteroid.asteroidSize - 1
  // explosion particles
  // explosion sound
  // dispose old meshes and entity

  // if we were the smallest size do nothing
  if (asteroidSize == 0) {
    return
  }
  let size = 0
  if (asteroid.asteroidSize == 3) {
    size = 1
  } else if (asteroid.asteroidSize == 2) {
    size = 2
  }
  // otherwise we spawn new smaller asteroid
  const children = Children[size]
  for (let i = 0; i < children; i += 1) {
    const phi = random() * Math.PI * 2
    const costheta = 2 * random() - 1
    const theta = Math.acos(costheta)
    const x = 2 * Math.sin(theta) * Math.cos(phi)
    const y = 2 * Math.sin(theta) * Math.sin(phi)
    const z = 2 * Math.cos(theta)
    const postition = new Vector3(asteroid.position.x+x, asteroid.position.y+y, asteroid.position.z+z)
    const speed = rand(20, 100)
    const velocity = new Vector3(
      random(),
      random(),
      random()
    ).normalize().multiplyByFloats(speed, speed, speed)
    const direction = Vector3.Zero()
    const rotation = Vector3.Zero()
    const pitch = random() * (random() > 0.5 ? -1 : 1)
    const yaw = random() * (random() > 0.5 ? -1 : 1)
    const roll = random() * (random() > 0.5 ? -1 : 1)
    const rotationQuaternion = Quaternion.Identity()
    const rotationalVelocity = {
      pitch, yaw, roll
    }
    world.add({
      meshName: "meteorDetailed",
      health: Health[size],
      worth: Points[size],
      scale: {
        x: Scales[size],
        y: Scales[size],
        z: Scales[size],
      },
      asteroidSize: Size[size],
      position: {
        x: postition.x, y: postition.y, z: postition.z
      },
      velocity,
      direction,
      acceleration: {x:0, y:0, z:0},
      rotation,
      rotationQuaternion,
      rotationalVelocity,
      bodyType: "animated"
    })
  }
}

export function createEnemyShip(x, y, z) {
  const guns = EnemyLight.guns.reduce((guns, gun, index) => {
    guns[index] = {
      class: gun.type,
      possition: { ...gun.position },
      delta: 0
    }
    return guns
  }, {})
  const shipEngine = {
    currentCapacity: EnemyLight.engine.maxCapacity,
    maxCapacity: EnemyLight.engine.maxCapacity,
    rate: EnemyLight.engine.rate,
  }
  const shipShields: ShipShields = {
    maxFore: EnemyLight.shields.fore,
    currentFore: EnemyLight.shields.fore,
    maxAft: EnemyLight.shields.aft,
    currentAft: EnemyLight.shields.aft,
    energyDrain: EnemyLight.shields.energyDrain,
    rechargeRate: EnemyLight.shields.rechargeRate,
  }
  const shipArmor: ShipArmor = {
    back: EnemyLight.armor.back,
    front: EnemyLight.armor.front,
    left: EnemyLight.armor.left,
    right: EnemyLight.armor.right,
  }
  const enemyEntity = world.add({
    owner: net.id,
    local: true,
    ai: { type: "basic", blackboard: {} },
    meshName: EnemyLight.model,
    hullName: EnemyLight.hullModel,
    bodyType: "animated",
    trail: true,
    planeTemplate: "EnemyLight",
    position: {x, y, z},
    velocity: {x: 0, y: 0, z: 0},
    setSpeed: EnemyLight.cruiseSpeed / 2,
    currentSpeed: EnemyLight.cruiseSpeed / 2,
    direction: {x: 0, y: 0, z: -1},
    acceleration: {x: 0, y: 0, z: 0},
    rotationalVelocity: {roll: 0, pitch: 0, yaw: 0},
    rotationQuaternion: {w: 1, x: 0, y:0, z:0},
    rotation: {x: 0, y: 0, z: -1},
    health: 100,
    totalScore: 0,
    guns,
    engine: shipEngine,
    shields: shipShields,
    armor: shipArmor,
    // scale: { x: 2, y: 2, z: 2 }
  })
  return enemyEntity
}