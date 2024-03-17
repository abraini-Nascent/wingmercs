import { Sound } from "@babylonjs/core"
import { randomItem } from "../random"

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

export class MusicPlayer {

  static instance = new MusicPlayer()

  currentSong: Sound

  private constructor() {}

  playSong(type: "happy" | "action") {
    if (this.currentSong != undefined) {
      this.currentSong.setVolume(0, 100)
      this.currentSong.loop = false
    }
    let song = type == "happy" ? HappySongFile[0] : ActionSongFile[0]
    this.currentSong = new Sound(type, song, undefined, undefined, {
      autoplay: true,
      loop: true
    })
    console.log("[Music Player] playing song", type)
  }
  playStinger(type: "win" | "fail" | "encounter") {
    if (this.currentSong) {
      this.currentSong.setVolume(0.1, 1)
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
      loop: false
    })
    stinger.onEndedObservable.addOnce(() => {
      if (this.currentSong) {
        this.currentSong.setVolume(1, 1)
      }
    })
    console.log("[Music Player] playing stinger", type)
  }
}