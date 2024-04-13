
/** a number between 0 and 1 inclusive */
function random() {
  // return Math.random()
  var x = Math.sin(random.seed++) * 10000;
  return x - Math.floor(x);
}
random.seed = 1

/**
 * returns a random int between min inclusive and max inclusive
 * @param {*} min 
 * @param {*} max 
 */
function rand(min: number, max: number): number {
  return Math.floor(random() * (max - min + 1)) + min
}
/**
 * returns a random float between min inclusive and max exclusive
 * @param {*} min 
 * @param {*} max 
 */
function randFloat(min: number, max: number): number {
  return random() * (max - min) + min
}

function randomItem<T>(array: T[]) {
  return array[Math.floor(random() * array.length)]
}
function chance(chance) {
  return rand(0, 100) <= chance
}
function coinFlip() {
  return rand(0, 1) == 1
}

class RNG {
  seed: number
  startingSeed: number
  static autoIndex: number = 0
  constructor(seed) {
    this.seed = seed || Date.now() + RNG.autoIndex++
    this.startingSeed = this.seed
    console.log(`[RNG] seed ${this.seed}`)
  }
  static stringHash(x) {
    let hash = 0;
    if (x.length == 0) return hash;
    for (let i = 0; i < x.length; i++) {
      let char = x.charCodeAt(i);
      hash = ((hash<<5)-hash)+char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }

  random() {
    var x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }
  /**
   * returns a random int between min inclusive and max inclusive
   */
  rand(min, max) {
    return Math.floor(this.random() * (max - min + 1)) + min
  }
  /**
   * returns a random float between min inclusive and max exclusive
   */
  randFloat(min, max) {
    return this.random() * (max - min) + min
  }
  randomItem(array) {
    return array[Math.floor(this.random() * array.length)]
  }
  chance(chance) {
    return this.rand(0, 100) <= chance
  }
  coinFlip() {
    return this.rand(0, 1) == 1
  }
  shuffle(array) {
    let shuffled = array.map(i => i)
    let currentIndex = shuffled.length, temporaryValue, randomIndex
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
      // Pick a remaining element...
      randomIndex = Math.floor(this.random() * currentIndex)
      currentIndex -= 1
      // And swap it with the current element.
      temporaryValue = shuffled[currentIndex]
      shuffled[currentIndex] = shuffled[randomIndex]
      shuffled[randomIndex] = temporaryValue
    }
    return shuffled;
  }
  /**
   * 
   * @param {number[]} weights an array of weights, the index of the weights should corrispond to the weighted items
   * @param {any[]} items an array of the items matching the weight by index
   * @returns {number|any} the selected index or item if items supplied
   */
  rouletteSelectionStochastic<T>(weights: number[], items: T[]): T | number {
    if (weights == undefined || weights.length == 0) {
      throw new Error("rouletteSelectionStochastic must be called with an array of numbers as the first parameter")
    }
    let max = 0
    let index = -1
    for (let fitness of weights)
      if (fitness > max)
        max = fitness
    for (; ;) {
      index = Math.floor(this.random() * weights.length)
      if (this.random() < (weights[index] / max)) {
        if (items) {
          return items[index]
        }
        return index
      }
    }
  }
}

/**
 * 
 * @param {number[]} items an array of weights, the index of the weights should corrispond to the weighted items
 * @returns {number} the selected index
 */
function RouletteSelectionStochastic(items: number[]) {
  let max = 0
  let index = -1
  for (let fitness of items)
    if (fitness > max)
      max = fitness
  for (; ;) {
    index = Math.floor(random() * items.length)
    if (random() < (items[index] / max))
      return index
  }
}

export {
  random,
  rand,
  randFloat,
  randomItem,
  chance,
  coinFlip,
  RouletteSelectionStochastic,
  RNG
}