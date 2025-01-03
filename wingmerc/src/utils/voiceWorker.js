import SamJs from "sam-js/dist/samjs.min.js"

onmessage = function (e) {
  const { samSentence, voice, samDebug, messageId } = e.data
  // console.log("[Speaking][VoiceWorker] ", e.data)
  const sam = new SamJs({ debug: samDebug, phonetic: true, ...voice })
  const result = sam.buf32(samSentence, true)

  if (result instanceof Float32Array) {
    postMessage({ success: true, audioData: result, messageId }, [result.buffer])
  } else {
    console.error("[Speaking][VoiceWorker] error", "Failed to generate audio data.")
    postMessage({ success: false, error: "Failed to generate audio data." })
  }
}
