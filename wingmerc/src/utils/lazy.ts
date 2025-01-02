export class Lazy<T> {
  private factory: () => T
  private cachedValue: T | undefined
  private isLoaded: boolean

  constructor(factory: () => T) {
    this.factory = factory
    this.isLoaded = false
  }

  get value(): T {
    if (!this.isLoaded) {
      this.cachedValue = this.factory()
      this.isLoaded = true
    }
    return this.cachedValue!
  }
}
