export const Dirk = Object.seal({
  name: "dirk",
  model: "craftSpeederA",
  hullModel: "craftSpeederAHull",
  shields: {
    fore: 500,
    aft: 500,
    rechargeRate: 20,
    energyDrain: 2,
  },
  armor: {
    front: 250,
    back: 220,
    left: 200,
    right: 200,
  },
  health: 50,
  pitch: 80,
  roll: 80,
  yaw: 80,
  accelleration: 150,
  afterburnerAccelleration: 350,
  breakingForce: 225,
  breakingLimit: 200,
  cruiseSpeed: 450,
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
      count: 2
    },
    {
      type: "heatseeking",
      count: 1
    }
  ],
  // TODO: this should also act like guns and weapons where we pull in a type
  engine: {
    rate: 20,
    maxCapacity: 200
  }
})