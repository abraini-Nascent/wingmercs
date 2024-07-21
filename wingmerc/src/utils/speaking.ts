import SamJs from 'sam-js';
import { Engine, Sound } from '@babylonjs/core';
import { translateIPA } from '../data/IAP';
import { AppContainer } from '../app.container';
/**
   * Test if a bit is set.
   * @param {Number} bits The bits.
   * @param {Number} mask The mask to test.
   * @return {boolean}
   */
function matchesBitmask (bits, mask) {
  return (bits & mask) !== 0;
}


function text2Uint8Array (text) {
  var buffer = new Uint8Array(text.length);
  text.split('').forEach(function (e, index) {
    buffer[index] = e.charCodeAt(0);
  });
  return buffer;
}

function Uint32ToUint8Array (uint32) {
  var result = new Uint8Array(4);
  result[0]  = uint32;
  result[1]  = uint32 >>  8;
  result[2]  = uint32 >> 16;
  result[3]  = uint32 >> 24;

  return result;
}

function Uint16ToUint8Array (uint16) {
  var result = new Uint8Array(2);
  result[0]  = uint16;
  result[1]  = uint16 >> 8;

  return result;
}

export function CreatAudioSource(audiobuffer) {
  let context = Engine.audioEngine.audioContext;
  // var source = context.createBufferSource();
  var soundBuffer = context.createBuffer(1, audiobuffer.length, 22050);
  var buffer = soundBuffer.getChannelData(0);
  for(var i=0; i<audiobuffer.length; i++) {
    buffer[i] = audiobuffer[i];
  }
  return soundBuffer
  // source.buffer = soundBuffer;
  // return source
}
export const SAM: Voice = {
  speed: 52,
  pitch: 64,
  throat: 128,
  mouth: 128
}
export type Voice = {
  speed: number,
  pitch: number,
  throat: number,
  mouth: number
}
export function VoiceSound(phoneticSentence: string, voice: Voice): Sound | undefined {
  const samSentence = translateIPA(phoneticSentence, AppContainer.instance.debug)
  // console.log(`${bark.english}: \\${samSentence}\\`)
  return
  const sam = new SamJs({
    debug: AppContainer.instance.debug,
    phonetic: true,
    ...voice
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
  );

  var pos=0;
  var write = function (buffer) {
    realbuffer.set(buffer, pos);
    pos+=buffer.length;
  };

  //RIFF header
  write(text2Uint8Array('RIFF')); // chunkID
  write(Uint32ToUint8Array(audiobuffer.length + 12 + 16 + 8 - 8)); // ChunkSize
  write(text2Uint8Array('WAVE')); // riffType
  //format chunk
  write(text2Uint8Array('fmt '));
  write(Uint32ToUint8Array(16)); // ChunkSize
  write(Uint16ToUint8Array(1)); // wFormatTag - 1 = PCM
  write(Uint16ToUint8Array(1)); // channels
  write(Uint32ToUint8Array(22050)); // samplerate
  write(Uint32ToUint8Array(22050)); // bytes/second
  write(Uint16ToUint8Array(1)); // blockalign
  write(Uint16ToUint8Array(8)); // bits per sample
  //data chunk
  write(text2Uint8Array('data'));
  write(Uint32ToUint8Array(audiobuffer.length)); // buffer length
  write(audiobuffer);

  return audiobuffer;
}