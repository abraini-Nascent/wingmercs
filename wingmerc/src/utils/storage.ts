
export class MercStorage {
  
  static instance = new MercStorage()
  useMemory = false

  private constructor() { }

  setValue(key, value) {
    if (this.isLocalStorageAvailable()) {
      window.localStorage.setItem(key, value)
    }
  }

  getValue(key): string | undefined {
    if (this.isLocalStorageAvailable()) {
      return window.localStorage.getItem(key)
    } else {
      return undefined
    }
  }

  isLocalStorageAvailable() {
    if (this.useMemory !== null) {
      return !this.useMemory
    }
    try {
      window.localStorage.setItem("check", "true");
      window.localStorage.removeItem("check");
      // console.log("LocalStorage Available")
      this.useMemory = false
      return true;
    } catch(error) {
      // console.log("LocalStorage NOT Available")
      this.useMemory = true
      return false;
    }
  }
}

