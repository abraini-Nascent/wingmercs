const urlParams = new URLSearchParams(window.location.search)
const debug = urlParams.has("debug")
const debugLogWrap = Function.prototype.bind.call(console.log, console)
const noop = () => {}
export const debugLog = debug ? debugLogWrap : noop
