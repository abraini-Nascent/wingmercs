import { AudioEngine, Engine, Sound } from "@babylonjs/core"
import { randomItem } from "../random"
import { MercStorage } from "../storage"
import { AppContainer } from "../../app.container"


const MainThemeSongFile = [
  "assets/music/GalacticDreams.mp3"
]
const ActionSongFile = [
  "assets/music/GlitchyGroove.mp3",
  "assets/music/HaircutsAndPixels.mp3",
  "assets/music/GlitchInTheMachine.mp3",
]

const HappySongFile = [
  "assets/music/NebulaDreams.mp3",
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

const BaseVolume = 0.5

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

  updateVolume(volume: number) {
    if (this.currentSong != undefined) {
      this.currentSong.setVolume(volume * BaseVolume)
    }
  }

  playSong(type: "happy" | "action" | "theme") {
    if (this.musicEnabled == false) {
      return
    }
    if (this.currentSong != undefined) {
      this.currentSong.setVolume(0, 1)
      this.currentSong.loop = false
    }
    let song: String 
    switch (type) {
      case "happy":
        song = HappySongFile[0]
        break;
      case "action":
        song = ActionSongFile[0]
        break;
      case "theme":
        song = MainThemeSongFile[0]
        break;
    }
    this.currentSong = new Sound(type, song, undefined, undefined, {
      autoplay: true,
      loop: true,
      volume: AppContainer.instance.volumes.music * BaseVolume
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
      volume: AppContainer.instance.volumes.music * BaseVolume,
    })
    stinger.onEndedObservable.addOnce(() => {
      if (this.currentSong) {
        this.currentSong.setVolume(AppContainer.instance.volumes.music * BaseVolume, 1)
      }
    })
    console.log("[Music Player] playing stinger", type)
  }
}