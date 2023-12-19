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
      position: "",
    },
    {
      type: "laser",
      position: "",
    }
  ],
  // todo:
  //  position on mode
  weapons: [
    {
      type: "dumbfire",
      count: 2
    },
    {
      type: "heatseeking",
      count: 1
    }
  ]
})