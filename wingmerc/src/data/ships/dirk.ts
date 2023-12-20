export const Dirk = Object.seal({
  name: "dirk",
  model: "craftSpeederA",
  shields: {
    fore: 50,
    aft: 50
  },
  armor: {
    front: 25,
    back: 22,
    left: 20,
    right: 20,
  },
  health: 5,
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