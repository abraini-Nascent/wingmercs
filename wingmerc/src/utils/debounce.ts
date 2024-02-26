export class Debounce {
  debounce: number
  limit: number

  constructor(limit: number = 333) {
    this.limit = limit
  }
  tryNow(dt: number): boolean {
    let now = this.debounce == 0
    this.debounce += dt
    if (this.debounce > this.limit) {
      this.debounce = 0
    }
    return now
  }
  clear() {
    this.debounce = 0
  }
}

export const LatchOn = 2
export const LatchToggle = 1
export const LatchDebounce = 0
export class LatchTimed {
  debounce: DebounceTimed
  latchLimit: number
  latchCount: number
  last: number = 0
  toggled: boolean = false

  constructor(limit: number = 333, latchLimit: number = 333) {
    this.debounce = new DebounceTimed(limit)
    this.latchLimit = latchLimit
  }
  tryNow(): number {
    if (!this.toggled) {
      if (this.debounce.tryNow()) {
        this.toggled = true
        this.last = Date.now()
        return LatchToggle
      } else {
        return LatchDebounce
      }
    } else {
      this.latchCount += Date.now() - this.last
      if (this.latchCount > this.latchLimit) {
        return LatchOn
      } else {
        return LatchDebounce
      }
    }
  }

  clear() {
    this.last = 0
    this.latchCount = 0
    this.toggled = false
  }
}

export class LatchMulti {
  debouncers = new Map<number, LatchTimed>()

  constructor() {}

  tryNow(key: number, limit: number = 333) {
    let debouncer = this.debouncers.get(key)
    if (debouncer) {
      return debouncer.tryNow()
    }
    debouncer = new LatchTimed(limit)
    this.debouncers.set(key, debouncer)
    return debouncer.tryNow()
  }
  clear(key: number) {
    let debouncer = this.debouncers.get(key)
    if (debouncer) {
      return debouncer.clear()
    }
  }
}

export class DebounceTimedMulti {
  debouncers = new Map<number, DebounceTimed>()

  constructor() {}

  tryNow(key: number, limit: number = 333) {
    let debouncer = this.debouncers.get(key)
    if (debouncer) {
      return debouncer.tryNow()
    }
    debouncer = new DebounceTimed(limit)
    this.debouncers.set(key, debouncer)
    return debouncer.tryNow()
  }
  clear(key: number) {
    let debouncer = this.debouncers.get(key)
    if (debouncer) {
      debouncer.clear()
    }
  }
}

export class DebounceTimed {
  debounce: number
  limit: number
  last: number = 0

  constructor(limit: number = 333) {
    this.limit = limit
  }
  tryNow(): boolean {
    let now = Date.now()
    if (now - this.last > this.limit) {
      this.last = now
      return true
    }
    return false
  }
  clear() {
    this.last = 0
  }
}