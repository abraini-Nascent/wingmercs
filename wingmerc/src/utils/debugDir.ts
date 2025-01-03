const urlParams = new URLSearchParams(window.location.search)
const debug = urlParams.has("debug")
const debugDirWrap = Function.prototype.bind.call(console.dir, console)
const noop = () => {}
export const debugDir = debug ? debugDirWrap : noop
