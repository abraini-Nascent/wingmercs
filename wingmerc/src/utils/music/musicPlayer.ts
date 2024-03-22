import { AudioEngine, Engine, Sound } from "@babylonjs/core"
import { randomItem } from "../random"
import { MercStorage } from "../storage"

const ActionSongFile = [
  "assets/music/ActionSong_1.mp3",
]

const HappySongFile = [
  "assets/music/HappySong_1.mp3",
]

const WinStingerFile = [
  "assets/music/WinStinger_1.wav",
  "assets/music/WinStinger_2.wav",
]

const FailStingerFile = [
  "assets/music/FailStinger_1.wav",
  "assets/music/FailStinger_2.wav",
]

const EncounterStingerFile = [
  "assets/music/EncounterStinger_1.wav",
  "assets/music/EncounterStinger_2.wav",
]

const BaseVolume = 0.1

export class MusicPlayer {

  static instance = new MusicPlayer()

  currentSong: Sound
  private _musicEnabled: boolean = true

  private constructor() {
    let storedMusicEnabled = MercStorage.instance.getValue("wingmercs_musicEnabled") ?? "1"
    this._musicEnabled = storedMusicEnabled == "1" ? true : false
  }

  get musicEnabled(): boolean {
    return this._musicEnabled
  }

  set musicEnabled(value: boolean) {
    if (value == false) {
      if (this.currentSong != undefined) {
        this.currentSong.setVolume(0, 1)
        this.currentSong.loop = false
        this.currentSong = undefined
      }
    }
    this._musicEnabled = value
    MercStorage.instance.setValue("wingmercs_musicEnabled", value ? "1" : "0")
  }

  playSong(type: "happy" | "action") {
    if (this.musicEnabled == false) {
      return
    }
    if (this.currentSong != undefined) {
      this.currentSong.setVolume(0, 1)
      this.currentSong.loop = false
    }
    let song = type == "happy" ? HappySongFile[0] : ActionSongFile[0]
    this.currentSong = new Sound(type, song, undefined, undefined, {
      autoplay: true,
      loop: true,
      volume: BaseVolume
    })
    console.log("[Music Player] playing song", type)
  }
  playStinger(type: "win" | "fail" | "encounter") {
    if (this.musicEnabled == false) {
      return
    }
    if (this.currentSong) {
      this.currentSong.setVolume(0, 1)
    }
    let song
    switch (type) {
      case "win": {
        song = randomItem(WinStingerFile)
        break;
      }
      case "fail": {
        song = randomItem(FailStingerFile)
        break;
      }
      case "encounter": {
        song = randomItem(EncounterStingerFile)
        break;
      }
    }
    let stinger = new Sound(type, song, undefined, undefined, {
      autoplay: true,
      loop: false,
      volume: BaseVolume,
    })
    stinger.onEndedObservable.addOnce(() => {
      if (this.currentSong) {
        this.currentSong.setVolume(BaseVolume, 1)
      }
    })
    console.log("[Music Player] playing stinger", type)
  }
}