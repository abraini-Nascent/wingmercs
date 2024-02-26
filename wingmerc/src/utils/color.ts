const cache = []
export namespace Color {
  export function rgb(r: number, g: number, b: number): string {
    r = Math.floor(r)
    g = Math.floor(g)
    b = Math.floor(b)
    if (cache[r] && cache[r][g] && cache[r][g][b]) {
      return cache[r][g][b]
    }
    let color = `rgb(${r} ${g} ${b})`
    if (cache[r] == undefined) {
      cache[r] = []
    }
    if (cache[r][g] == undefined) {
      cache[r][g] = []
    }
    cache[r][g][b] = color
    return color
  }

  export function lighten(
    percent: number,
    r: number,
    g: number,
    b: number,
  ): string {
    percent = Math.max(0, Math.min(100, percent))
    const amount = 255 / percent
    const [lowest, middle, highest] = [r, g, b]
      .map((value, index) => {
        return {
          value,
          index,
        }
      })
      .sort((l, r) => {
        return l.value - r.value
      })

    if (lowest.value === 255) {
      return rgb(r, g, b)
    }

    const returnArray = []
    returnArray[lowest.index] = Math.round(
      lowest.value + Math.min(255 - lowest.value, amount)
    )
    const increaseFraction =
      (returnArray[lowest.index] - lowest.value) / (255 - lowest.value)
    returnArray[middle.index] =
      middle.value + (255 - middle.value) * increaseFraction
    returnArray[highest.index] =
      highest.value + (255 - highest.value) * increaseFraction

    return rgb(returnArray[0], returnArray[1], returnArray[2])
  }

  export function darken(
    percent: number,
    r: number,
    g: number,
    b: number
  ): string {
    percent = Math.max(0, Math.min(100, percent))
    const amount = 255 / percent
    const [lowest, middle, highest] = [r, g, b]
      .map((value, index) => {
        return {
          value,
          index,
        }
      })
      .sort((l, r) => {
        return l.value - r.value
      })

    if (lowest.value === 255) {
      return rgb(r, g, b)
    }

    const returnArray = []
    returnArray[highest.index] = highest.value - Math.min(highest.value, amount)
    const decreaseFraction =
      (highest.value - returnArray[highest.index]) / highest.value
    returnArray[middle.index] = middle.value - middle.value * decreaseFraction
    returnArray[lowest.index] = lowest.value - lowest.value * decreaseFraction

    return rgb(returnArray[0], returnArray[1], returnArray[2])
  }
}

/**
 * Lighten and Darken technique from: https://css-tricks.com/using-javascript-to-adjust-saturation-and-brightness-of-rgb-colors/#:~:text=To%20lighten%20an%20RGB%20value,a%20fully%20saturated%20blue%2Fcyan.
 */