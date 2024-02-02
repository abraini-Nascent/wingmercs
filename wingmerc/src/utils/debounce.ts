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
}