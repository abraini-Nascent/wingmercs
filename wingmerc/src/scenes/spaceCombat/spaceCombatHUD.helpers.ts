const BlackCharacters = ["▏","▎","▍","▌","▋","▊","▉"];

export function barPercentCustom(percent: number, chunks: number): string {

  const chunkValue = 100 / chunks;
  const result: number[] = [];

  for (let i = 0; i < chunks; i++) {
      const chunkPercentage = Math.min(chunkValue, percent)
      result.push(Math.round((chunkPercentage/chunkValue) * 100))
      percent -= chunkPercentage
  }
  return result.map(p => blockPercent(p)).join("")
}
export function barPercent(f: number): string {
  let shield: string[] = []
  if (f > 66) {
    shield.push("▉")
    shield.push("▉")
    shield.push(`\u202E${blockPercent(Math.round((f-67)/33*100))}\u202D`)
  } else if (f > 33) {
    shield.push("▉")
    shield.push(`\u202E${blockPercent(Math.round((f-34)/33*100))}\u202D`)
    shield.push(" ")
  } else if (f > 0) {
    shield.push(`\u202E${blockPercent(Math.round(f/33*100))}\u202D`)
    shield.push(" ")
    shield.push(" ")
  } else {
    shield.push(" ")
    shield.push(" ")
    shield.push(" ")
  }
  return shield.join("")
}
export function blockPercent(percent: number): string {
  const indexes = BlackCharacters.length - 1
  const index = (percent/100) * indexes
  const char = BlackCharacters[Math.floor(index)]
  return char
}