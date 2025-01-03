import SamJs from "sam-js"
import { Engine, Sound } from "@babylonjs/core"
import { translateIPA } from "../data/IAP"
import { AppContainer } from "../app.container"
import { Entity, world } from "../world/world"
import { debugLog } from "./debuglog"
const worker = new Worker(new URL("./voiceWorker.js", import.meta.url), { type: "module" })
/**
 * Test if a bit is set.
 * @param {Number} bits The bits.
 * @param {Number} mask The mask to test.
 * @return {boolean}
 */
function matchesBitmask(bits, mask) {
  return (bits & mask) !== 0
}

function text2Uint8Array(text) {
  var buffer = new Uint8Array(text.length)
  text.split("").forEach(function (e, index) {
    buffer[index] = e.charCodeAt(0)
  })
  return buffer
}

function Uint32ToUint8Array(uint32) {
  var result = new Uint8Array(4)
  result[0] = uint32
  result[1] = uint32 >> 8
  result[2] = uint32 >> 16
  result[3] = uint32 >> 24

  return result
}

function Uint16ToUint8Array(uint16) {
  var result = new Uint8Array(2)
  result[0] = uint16
  result[1] = uint16 >> 8

  return result
}

export function CreatAudioSource(audiobuffer) {
  let context = Engine.audioEngine.audioContext
  // var source = context.createBufferSource();
  var soundBuffer = context.createBuffer(1, audiobuffer.length, 22050)
  var buffer = soundBuffer.getChannelData(0)
  for (var i = 0; i < audiobuffer.length; i++) {
    buffer[i] = audiobuffer[i]
  }
  return soundBuffer
  // source.buffer = soundBuffer;
  // return source
}
export const SAM: Voice = {
  speed: 52,
  pitch: 64,
  throat: 128,
  mouth: 128,
}
export type Voice = {
  speed: number
  pitch: number
  throat: number
  mouth: number
}
export async function VoiceSoundLocal(phoneticSentence: string, voice: Voice): Promise<Sound | undefined> {
  const samSentence = translateIPA(phoneticSentence, AppContainer.instance.debug)
  // debugLog(`${bark.english}: \\${samSentence}\\`)
  const sam = new SamJs({
    debug: AppContainer.instance.debug,
    phonetic: true,
    ...voice,
  })
  const result = sam.buf32(samSentence, true)
  if (result instanceof Float32Array) {
    // const audioBuffer = RenderAudioBuffer(result)
    const audioBuffer = CreatAudioSource(result)
    let sound = new Sound(phoneticSentence, audioBuffer, undefined, undefined)
    sound.setVolume(AppContainer.instance.volumes.global * AppContainer.instance.volumes.voice)
    return sound
  } else {
    return undefined
  }
}
let messagesCount = 0
export async function VoiceSoundWorker(phoneticSentence: string, voice: Voice): Promise<Sound | undefined> {
  debugLog("[Speaking] creating", phoneticSentence)
  return new Promise((resolve, reject) => {
    const thisMessageId = messagesCount++
    const listener = (event) => {
      const { success, audioData, error, messageId } = event.data
      if (messageId != thisMessageId) {
        // not my sound
        return
      }
      if (success) {
        const context = Engine.audioEngine.audioContext
        const audioBuffer = context.createBuffer(1, audioData.length, 22050)
        audioBuffer.copyToChannel(new Float32Array(audioData), 0)
        const sound = CreateSoundFromAudioBuffer(audioBuffer)
        worker.removeEventListener("message", listener)
        resolve(sound)
      } else {
        console.error("[Speaking] error:", error)
        reject(error)
      }
    }
    worker.addEventListener("message", listener)

    worker.onerror = (error) => {
      console.error("Worker error:", error)
      reject(error)
    }
    const samSentence = translateIPA(phoneticSentence, AppContainer.instance.debug)
    worker.postMessage({
      samSentence,
      voice,
      samDebug: false, //AppContainer.instance.debug,
      messageId: thisMessageId,
    })
  })
}
export const VoiceSound = VoiceSoundWorker

function CreateSoundFromAudioBuffer(audioBuffer: AudioBuffer): Sound {
  const sound = new Sound("VoiceSound", audioBuffer, undefined, undefined)
  sound.setVolume(AppContainer.instance.volumes.global * AppContainer.instance.volumes.voice)
  return sound
}
export function PlayVoiceSound(sound: Sound | undefined, entity: Entity) {
  if (sound) {
    debugLog("[Speaking]", entity.id)
    sound.maxDistance = 10000
    sound.spatialSound = true
    sound.attachToMesh(entity.node)
    sound.play()
    world.addComponent(entity, "speaking", sound)
    sound.onEndedObservable.addOnce(() => {
      if (entity.speaking == sound) {
        world.removeComponent(entity, "speaking")
      }
      sound.detachFromMesh()
      sound.dispose()
    })
  }
}
export function RenderAudioBuffer(audiobuffer): Uint8Array {
  // Calculate buffer size.
  var realbuffer = new Uint8Array(
    4 + // "RIFF"
      4 + // uint32 filesize
      4 + // "WAVE"
      4 + // "fmt "
      4 + // uint32 fmt length
      2 + // uint16 fmt
      2 + // uint16 channels
      4 + // uint32 sample rate
      4 + // uint32 bytes per second
      2 + // uint16 block align
      2 + // uint16 bits per sample
      4 + // "data"
      4 + // uint32 chunk length
      audiobuffer.length
  )

  var pos = 0
  var write = function (buffer) {
    realbuffer.set(buffer, pos)
    pos += buffer.length
  }

  //RIFF header
  write(text2Uint8Array("RIFF")) // chunkID
  write(Uint32ToUint8Array(audiobuffer.length + 12 + 16 + 8 - 8)) // ChunkSize
  write(text2Uint8Array("WAVE")) // riffType
  //format chunk
  write(text2Uint8Array("fmt "))
  write(Uint32ToUint8Array(16)) // ChunkSize
  write(Uint16ToUint8Array(1)) // wFormatTag - 1 = PCM
  write(Uint16ToUint8Array(1)) // channels
  write(Uint32ToUint8Array(22050)) // samplerate
  write(Uint32ToUint8Array(22050)) // bytes/second
  write(Uint16ToUint8Array(1)) // blockalign
  write(Uint16ToUint8Array(8)) // bits per sample
  //data chunk
  write(text2Uint8Array("data"))
  write(Uint32ToUint8Array(audiobuffer.length)) // buffer length
  write(audiobuffer)

  return audiobuffer
}
