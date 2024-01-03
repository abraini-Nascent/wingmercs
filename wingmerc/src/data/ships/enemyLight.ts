export const EnemyLight = Object.seal({
  name: "light_fighter",
  model: "craftSpeederA",
  hullModel: "craftSpeederAHull",
  shields: {
    fore: 50,
    aft: 50,
    rechargeRate: 3,
    energyDrain: 3,
  },
  armor: {
    front: 40,
    back: 40,
    left: 30,
    right: 30,
  },
  health: 50,
  pitch: 80,
  roll: 80,
  yaw: 80,
  accelleration: 30,
  afterburnerAccelleration: 60,
  breakingForce: 30,
  breakingLimit: 100,
  cruiseSpeed: 400,
  maxSpeed: 1200,
  guns: [
    {
      type: "laser",
      position: {
        x: -0.5,
        y: -0.5,
        z: -0.5
      },
    },
    {
      type: "laser",
      position: {
        x: 0.5,
        y: -0.5,
        z: -0.5
      },
    }
  ],
  // todo:
  //  position on model
  weapons: [
    {
      type: "dumbfire",
      count: 1
    }
  ],
  // TODO: this should also act like guns and weapons where we pull in a type
  engine: {
    rate: 20,
    maxCapacity: 200
  }
})