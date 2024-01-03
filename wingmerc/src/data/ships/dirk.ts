export const Dirk = Object.seal({
  name: "dirk",
  model: "craftSpeederA",
  hullModel: "craftSpeederAHull",
  shields: {
    fore: 60,
    aft: 60,
    rechargeRate: 2,
    energyDrain: 2,
  },
  armor: {
    front: 65,
    back: 65,
    left: 45,
    right: 45,
  },
  health: 50,
  pitch: 80,
  roll: 90,
  yaw: 80,
  accelleration: 150,
  afterburnerAccelleration: 350,
  breakingForce: 225,
  breakingLimit: 200,
  cruiseSpeed: 500,
  maxSpeed: 1400,
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