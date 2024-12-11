import SamJs from "sam-js"

onmessage = function (e) {
  const { samSentence, voice, samDebug } = e.data
  console.log("[VoiceWorker] ", e.data)
  const sam = new SamJs({ debug: samDebug, phonetic: true, ...voice })
  const result = sam.buf32(samSentence, true)

  if (result instanceof Float32Array) {
    postMessage({ success: true, audioData: result }, [result.buffer])
  } else {
    postMessage({ success: false, error: "Failed to generate audio data." })
  }
}
