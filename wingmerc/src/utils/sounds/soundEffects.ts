import { Sound, Vector3 } from "@babylonjs/core"
import { randomItem } from "../random";

const LaserFiles = [
  "assets/sounds/LaserShoot01.wav",
  "assets/sounds/LaserShoot02.wav",
  "assets/sounds/LaserShoot03.wav",
  "assets/sounds/LaserShoot04.wav",
  "assets/sounds/LaserShoot05.wav",
]

const ShieldHitFiles = [
  "assets/sounds/ShieldHit01.wav",
  "assets/sounds/ShieldHit02.wav",
  "assets/sounds/ShieldHit03.wav",
  "assets/sounds/ShieldHit04.wav",
  "assets/sounds/ShieldHit05.wav",
]

const ArmorHitFiles = [
  "assets/sounds/ArmorHit01.wav",
  "assets/sounds/ArmorHit02.wav",
  "assets/sounds/ArmorHit03.wav",
  "assets/sounds/ArmorHit04.wav",
  "assets/sounds/ArmorHit05.wav",
]

const SystemHitFiles = [
  "assets/sounds/SystemHit01.wav",
  "assets/sounds/SystemHit02.wav",
  "assets/sounds/SystemHit03.wav",
  "assets/sounds/SystemHit04.wav",
  "assets/sounds/SystemHit05.wav",
]

const ExplosionFiles = [
  "assets/sounds/Explosion01.wav",
  "assets/sounds/Explosion02.wav",
  "assets/sounds/Explosion03.wav",
  "assets/sounds/Explosion04.wav",
  "assets/sounds/Explosion05.wav",
]
const MissileLockFiles = [
  "assets/sounds/MissileLock01.wav",
  "assets/sounds/MissileLock02.wav",
]
const MissileIncomingFiles = [
  "assets/sounds/MissileIncoming01.wav"
]
const MissileToneFiles = [
  "assets/sounds/MissileTone01.wav"
]
const MissileLaunchFiles = [
  "assets/sounds/MissileLaunch01.wav",
  "assets/sounds/MissileLaunch02.wav",
  "assets/sounds/MissileLaunch03.wav",
  "assets/sounds/MissileLaunch04.wav",
  "assets/sounds/MissileLaunch05.wav",
]
const MissileEngineFiles = [
  "assets/sounds/Engine01.wav",
  "assets/sounds/Engine02.wav",
]
const SelectFiles = [
  "assets/sounds/Select01.wav",
  "assets/sounds/Select02.wav",
]
const AfterburnerFiles = [
  "assets/sounds/Afterburner01.wav",
]
export namespace SoundEffects {
  let _idx = 0
  function idx() {
    return _idx++;
  }
  export function Laser(): Sound {
    return new Sound(`Laser-${idx()}`, randomItem(LaserFiles), undefined, undefined,
    {
      maxDistance: 2000,
    })
  }
  export function ShieldHit(position?: Vector3 | undefined): Sound {
    let sound = new Sound(`ShieldHit-${idx()}`, randomItem(ShieldHitFiles), undefined, undefined,
    {
      maxDistance: 2000,
    })
    if (position) {
      sound.spatialSound = true
      sound.setPosition(position)
    }
    sound.autoplay = true
    sound.play()
    return sound
  }
  export function ArmorHit(position?: Vector3 | undefined): Sound {
    let sound = new Sound(`ArmorHit-${idx()}`, randomItem(ArmorHitFiles), undefined, undefined,
    {
      maxDistance: 2000,
      autoplay: true
    })
    if (position) {
      sound.spatialSound = true
      sound.setPosition(position)
    }
    sound.autoplay = true
    sound.play()
    return sound
  }
  export function SystemHit(position?: Vector3 | undefined): Sound {
    let sound = new Sound(`SystemHit-${idx()}`, randomItem(SystemHitFiles), undefined, undefined,
    {
      maxDistance: 2000,
      autoplay: true
    })
    if (position) {
      sound.spatialSound = true
      sound.setPosition(position)
    }
    sound.autoplay = true
    sound.play()
    return sound
  }
  export function Explosion(position?: Vector3 | undefined): Sound {
    let sound = new Sound(`Explosion-${idx()}`, randomItem(ExplosionFiles), undefined, undefined,
    {
      maxDistance: 2000,
      autoplay: true
    })
    if (position) {
      sound.spatialSound = true
      sound.setPosition(position)
    }
    sound.autoplay = true
    sound.play()
    return sound
  }
  export function Select(position?: Vector3 | undefined): Sound {
    let sound = new Sound(`Select-${idx()}`, randomItem(SelectFiles), undefined, undefined,
    {
      maxDistance: 2000,
      autoplay: true
    })
    if (position) {
      sound.spatialSound = true
      sound.setPosition(position)
    }
    sound.autoplay = true
    sound.play()
    return sound
  }

  export function MissileLock(position?: Vector3 | undefined): Sound {
    let sound = new Sound(`MissileLock-${idx()}`, randomItem(MissileLockFiles), undefined, undefined,
    {
      maxDistance: 2000,
      autoplay: true
    })
    if (position) {
      sound.spatialSound = true
      sound.setPosition(position)
    }
    sound.setVolume(0.25)
    sound.autoplay = true
    sound.play()
    return sound
  }
  export function MissileTone(position?: Vector3 | undefined): Sound {
    let sound = new Sound(`MissileTone-${idx()}`, randomItem(MissileToneFiles), undefined, undefined,
    {
      maxDistance: 2000,
      autoplay: true
    })
    if (position) {
      sound.spatialSound = true
      sound.setPosition(position)
    }
    sound.setVolume(0.25)
    sound.autoplay = true
    sound.play()
    return sound
  }
  export function MissileIncoming(position?: Vector3 | undefined): Sound {
    let sound = new Sound(`MissileIncoming-${idx()}`, randomItem(MissileIncomingFiles), undefined, undefined,
    {
      maxDistance: 2000,
      autoplay: true
    })
    if (position) {
      sound.spatialSound = true
      sound.setPosition(position)
    }
    sound.setVolume(0.25)
    sound.autoplay = true
    sound.play()
    return sound
  }
  export function MissileLaunch(position?: Vector3 | undefined): Sound {
    let sound = new Sound(`MissileLaunch-${idx()}`, randomItem(MissileLaunchFiles), undefined, undefined,
    {
      maxDistance: 2000,
      autoplay: true
    })
    if (position) {
      sound.spatialSound = true
      sound.setPosition(position)
    }
    sound.autoplay = true
    sound.play()
    return sound
  }
  export function MissileEngine(position?: Vector3 | undefined): Sound {
    let sound = new Sound(`MissileEngine-${idx()}`, randomItem(MissileEngineFiles), undefined, undefined,
    {
      maxDistance: 4000,
      autoplay: true
    })
    if (position) {
      sound.spatialSound = true
      sound.setPosition(position)
    }
    sound.autoplay = true
    sound.play()
    return sound
  }
  export function AfterburnerEngine(position?: Vector3 | undefined): Sound {
    let sound = new Sound(`AfterburnerEngine-${idx()}`, AfterburnerFiles[0], undefined, undefined,
    {
      maxDistance: 2000,
      autoplay: true
    })
    if (position) {
      sound.spatialSound = true
      sound.setPosition(position)
    }
    sound.autoplay = true
    sound.play()
    return sound
  }
  export function Silience(sound: Sound) {
    sound.setVolume(0, .33)
    setTimeout(() => {
      sound.stop()
      sound.dispose()
    }, 333)
  }
}