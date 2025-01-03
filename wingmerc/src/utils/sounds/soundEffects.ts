import { Sound, TmpVectors, Vector3 } from "@babylonjs/core"
import { rand, random, randomItem } from "../random"
import { AppContainer } from "../../app.container"

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

const PlayerShieldHitFiles = [
  "assets/sounds/PlayerShieldHit01.wav",
  "assets/sounds/PlayerShieldHit02.wav",
  "assets/sounds/PlayerShieldHit03.wav",
  "assets/sounds/PlayerShieldHit04.wav",
  "assets/sounds/PlayerShieldHit05.wav",
]

const PlayerArmorHitFiles = [
  "assets/sounds/PlayerArmorHit01.wav",
  "assets/sounds/PlayerArmorHit02.wav",
  "assets/sounds/PlayerArmorHit03.wav",
  "assets/sounds/PlayerArmorHit04.wav",
  "assets/sounds/PlayerArmorHit05.wav",
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
const MissileLockFiles = ["assets/sounds/MissileLock01.wav", "assets/sounds/MissileLock02.wav"]
const MissileIncomingFiles = ["assets/sounds/MissileIncoming01.wav"]
const MissileToneFiles = ["assets/sounds/MissileTone01.wav"]
const MissileLaunchFiles = [
  "assets/sounds/MissileLaunch01.wav",
  "assets/sounds/MissileLaunch02.wav",
  "assets/sounds/MissileLaunch03.wav",
  "assets/sounds/MissileLaunch04.wav",
  "assets/sounds/MissileLaunch05.wav",
]
const MissileEngineFiles = ["assets/sounds/Engine01.wav", "assets/sounds/Engine02.wav"]
const SelectFiles = ["assets/sounds/Select01.wav", "assets/sounds/Select02.wav"]
const AfterburnerFiles = ["assets/sounds/Afterburner01.wav"]
const DriftFiles = ["assets/sounds/Drift01.wav"]

const BrakeFiles = ["assets/sounds/Brake01.wav"]

export const SoundFiles = {
  LaserFiles,
  ShieldHitFiles,
  ArmorHitFiles,
  PlayerShieldHitFiles,
  PlayerArmorHitFiles,
  SystemHitFiles,
  ExplosionFiles,
  MissileLockFiles,
  MissileIncomingFiles,
  MissileToneFiles,
  MissileLaunchFiles,
  MissileEngineFiles,
  SelectFiles,
  AfterburnerFiles,
  DriftFiles,
  BrakeFiles,
} as const
export type SoundFiles = keyof typeof SoundFiles
export const SoundData: { [namespace in SoundFiles]: ArrayBuffer[] } = {} as any

export class SoundPool {
  private primeMap = new Map<string, Sound>()
  private filePool = new Map<string, SoundPool.PooledSound[]>()
  floating = new Map<Sound, SoundPool.PooledSound>()
  dequeue(file: SoundFiles, index: number, requeueOnEnd = false): SoundPool.PooledSound {
    const key = `${file}-${index}`
    let prime = this.primeMap.get(key)
    let dequeued: SoundPool.PooledSound
    if (prime == undefined) {
      prime = new Sound(`${file}-${index}`, SoundData[file][index], undefined, undefined)
      this.primeMap.set(key, prime)
      dequeued = { key, sound: prime.clone() }
      this.filePool.set(key, [])
    } else {
      const pool = this.filePool.get(key)
      dequeued = pool.pop()
      if (!dequeued) {
        dequeued = { key, sound: prime.clone() }
      }
    }
    if (requeueOnEnd) {
      dequeued.sound.onEndedObservable.addOnce(() => {
        this.requeue(dequeued)
      })
    }
    return dequeued
  }
  requeue(pooledSound: SoundPool.PooledSound) {
    this.filePool.get(pooledSound.key).push(pooledSound)
  }
}
export namespace SoundPool {
  export type PooledSound = {
    key: string
    sound: Sound
  }
  export function prime() {
    if (primed) {
      return
    }
    Object.keys(SoundFiles).forEach((key) => {
      for (let i = 0; i < SoundFiles[key].length; i += 1) {
        pool.dequeue(key as SoundFiles, i)
      }
    })
  }
}
let primed = false
const pool = new SoundPool()
export namespace SoundEffects {
  let _idx = 0
  function idx() {
    return _idx++
  }

  function originPosition(soundIn: Sound, position: Vector3) {
    const origin = AppContainer.instance.queries.origin.first?.position ?? Vector3.ZeroReadOnly
    soundIn.setPosition(TmpVectors.Vector3[0].set(position.x - origin.x, position.y - origin.y, position.z - origin.z))
  }
  export function effectsVolume(): number {
    let volume = AppContainer.instance.volumes.global * AppContainer.instance.volumes.sound
    return volume
  }
  function resetSound(sound: Sound, position?: Vector3 | undefined, maxDistance: number = 4000) {
    if (position) {
      sound.maxDistance = maxDistance
      sound.spatialSound = true
      originPosition(sound, position)
    } else {
      sound.spatialSound = false
    }
    sound.setVolume(effectsVolume())
    sound.autoplay = true
    sound.play()
  }
  export function Laser(position?: Vector3 | undefined) {
    const dequeued = pool.dequeue("LaserFiles", rand(0, SoundData.LaserFiles.length - 1), true)
    resetSound(dequeued.sound, position)
  }
  export function ShieldHit(position?: Vector3 | undefined, player: boolean = false) {
    const dequeued = player
      ? pool.dequeue("PlayerShieldHitFiles", rand(0, SoundData.PlayerShieldHitFiles.length - 1), true)
      : pool.dequeue("ShieldHitFiles", rand(0, SoundData.ShieldHitFiles.length - 1), true)
    resetSound(dequeued.sound, position)
  }
  export function ArmorHit(position?: Vector3 | undefined, player: boolean = false) {
    const dequeued = pool.dequeue(player ? "PlayerArmorHitFiles" : "ArmorHitFiles", 0, true)
    resetSound(dequeued.sound, position)
  }
  export function SystemHit(position?: Vector3 | undefined) {
    const dequeued = pool.dequeue("SystemHitFiles", rand(0, SoundData.SystemHitFiles.length - 1), true)
    resetSound(dequeued.sound, position)
  }
  export function Explosion(position?: Vector3 | undefined) {
    const dequeued = pool.dequeue("ExplosionFiles", rand(0, SoundData.ExplosionFiles.length - 1), true)
    resetSound(dequeued.sound, position)
  }
  export function Select(position?: Vector3 | undefined) {
    const dequeued = pool.dequeue("SelectFiles", rand(0, SoundData.SelectFiles.length - 1), true)
    resetSound(dequeued.sound, position)
  }

  function resetMissileSounds(dequeued: SoundPool.PooledSound, position?: Vector3 | undefined): Sound {
    const sound = dequeued.sound
    if (position) {
      sound.spatialSound = true
      sound.maxDistance = 2000
      originPosition(sound, position)
    } else {
      sound.spatialSound = false
    }
    sound.setVolume(0.25 * effectsVolume())
    sound.autoplay = true
    sound.play()
    pool.floating.set(sound, dequeued)
    return sound
  }
  export function MissileLock(position?: Vector3 | undefined): Sound {
    const dequeued = pool.dequeue("MissileLockFiles", rand(0, SoundData.MissileLockFiles.length - 1))
    return resetMissileSounds(dequeued, position)
  }
  export function MissileTone(position?: Vector3 | undefined): Sound {
    const dequeued = pool.dequeue("MissileToneFiles", rand(0, SoundData.MissileToneFiles.length - 1))
    return resetMissileSounds(dequeued, position)
  }
  export function MissileIncoming(position?: Vector3 | undefined): Sound {
    const dequeued = pool.dequeue("MissileIncomingFiles", rand(0, SoundData.MissileIncomingFiles.length - 1))
    return resetMissileSounds(dequeued, position)
  }
  export function MissileLaunch(position?: Vector3 | undefined) {
    const dequeued = pool.dequeue("MissileLaunchFiles", rand(0, SoundData.MissileLaunchFiles.length - 1), true)
    resetSound(dequeued.sound, position)
  }
  function resetMeshSound(sound: Sound, position?: Vector3 | undefined, maxDistance: number = 4000) {
    if (position) {
      sound.maxDistance = maxDistance
      sound.spatialSound = true
      originPosition(sound, position)
    } else {
      sound.spatialSound = false
    }
    sound.setVolume(effectsVolume())
  }
  export function MissileEngine(position?: Vector3 | undefined): Sound {
    const dequeued = pool.dequeue("MissileEngineFiles", rand(0, SoundData.MissileEngineFiles.length - 1))
    resetMeshSound(dequeued.sound, position)
    pool.floating.set(dequeued.sound, dequeued)
    return dequeued.sound
  }
  export function AfterburnerEngine(position?: Vector3 | undefined): Sound {
    const dequeued = pool.dequeue("AfterburnerFiles", 0)
    resetMeshSound(dequeued.sound, position, 2000)
    pool.floating.set(dequeued.sound, dequeued)
    return dequeued.sound
  }
  export function DriftMode(position?: Vector3 | undefined): Sound {
    const dequeued = pool.dequeue("DriftFiles", 0)
    resetMeshSound(dequeued.sound, position, 2000)
    pool.floating.set(dequeued.sound, dequeued)
    return dequeued.sound
  }
  export function BrakeMode(position?: Vector3 | undefined): Sound {
    const dequeued = pool.dequeue("BrakeFiles", 0)
    resetMeshSound(dequeued.sound, position, 2000)
    pool.floating.set(dequeued.sound, dequeued)
    return dequeued.sound
  }
  export function Silience(sound: Sound) {
    sound.setVolume(0, 0.33)
    setTimeout(() => {
      sound.stop()
      if (pool.floating.has(sound)) {
        pool.requeue(pool.floating.get(sound))
        pool.floating.delete(sound)
      }
    }, 333)
  }
}
