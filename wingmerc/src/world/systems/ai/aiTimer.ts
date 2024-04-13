export function aiTimer(blackboard: any, key: string, dt: number, delay: number, time: number, action: () => void) {
  if (blackboard[key] != undefined) {
    let timer = blackboard[key]
    if (timer.time > 0) {
      timer.time -= dt
      action()
    } else if (timer.delay > 0) {
      timer.delay -= dt
      if (timer.delay <= 0) {
        timer.delay = delay
        timer.time = time
      }
    }
  } else {
    blackboard[key] = {
      time: 0,
      delay: delay
    }
  }
}