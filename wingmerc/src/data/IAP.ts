/**
 * This is a mapping of the SAM phonetic symbol to the International Phonetic Alphabet symbol
 * so that we can swap betweern the two
 */
export const SAM = {
  // VOWELS
  IY: {example: "feet", glyph: "i"},
  IH: {example: "pin", glyph: "ɪ"},
  EH: {example: "beg", glyph: "ɛ"},
  AE: {example: "Sam", glyph: "æ"},
  AA: {example: "pot", glyph: "ɑ"},
  AH: {example: "budget", glyph: "ʌ"},
  AO: {example: "talk", glyph: "ɔ"},
  OH: {example: "cone", glyph: "oʊ"},
  UH: {example: "book", glyph: "ʊ"},
  UX: {example: "loot", glyph: "uː"},
  ER: {example: "bird", glyph: "ɜːr"},
  AX: {example: "gallon", glyph: "ə"},
  IX: {example: "digit", glyph: "ɪ"},
  // DIPTHONGS
  EY: {example: "made", glyph: "eɪ"},
  AY: {example: "high", glyph: "aɪ"},
  OY: {example: "boy", glyph: "ɔɪ"},
  AW: {example: "how", glyph: "aʊ"},
  OW: {example: "slow", glyph: "oʊ"},
  UW: {example: "crew", glyph: "uː"},
  // VOICED CONSONANTS
  R: {example: "red", glyph: "r"},
  L: {example: "allow", glyph: "l"},
  W: {example: "away", glyph: "w"},
  WH: {example: "whale", glyph: "ʍ"},
  Y: {example: "you", glyph: "j"},
  M: {example: "Sam", glyph: "m"},
  N: {example: "man", glyph: "n"},
  NX: {example: "song", glyph: "ŋ"},
  B: {example: "bad", glyph: "b"},
  D: {example: "dog", glyph: "d"},
  G: {example: "again", glyph: "ɡ"},
  J: {example: "judge", glyph: "dʒ"},
  Z: {example: "zoo", glyph: "z"},
  ZH: {example: "pleasure", glyph: "ʒ"},
  V: {example: "seven", glyph: "v"},
  DH: {example: "then", glyph: "ð"},
  // UNVOICED CONSONANTS
  S: {example: "Sam", glyph: "s"},
  SH: {example: "fish", glyph: "ʃ"},
  F: {example: "fish", glyph: "f"},
  TH: {example: "thin", glyph: "θ"},
  P: {example: "poke", glyph: "p"},
  T: {example: "talk", glyph: "t"},
  K: {example: "cake", glyph: "k"},
  CH: {example: "speech", glyph: "tʃ"},
  "/H": {example: "ahead", glyph: "h"},
  // SPECIAL PHONEMES
  UL: {example: "settle (= AXL)", glyph: "əl"},
  UM: {example: "astronomy (= AXM)", glyph: "əm"},
  UN: {example: "function (= ASN)", glyph: "ən"},
  Q: {example: "kitt**-**en (glottal stop)", glyph: "ʔ"},
}

const IPA = {
  // VOWELS
  "i": {example: "feet", glyph: "IY"},
  "iː": {example: "feet", glyph: "IY"},
  "ɪ": {example: "pin", glyph: "IH"},
  "ɛ": {example: "beg", glyph: "EH"}, // SAM doesn't distinguish between bet & beg
  "e": {example: "bet", glyph: "EH"}, // SAM doesn't distinguish between bet & beg
  "æ": {example: "Sam", glyph: "AE"},
  "ɑ": {example: "pot", glyph: "AA"},
  "ʌ": {example: "budget", glyph: "AH"},
  // "ɔː": {example: "caught", glyph: "AO"},
  "ɔ": {example: "talk", glyph: "AO"},
  "oʊ": {example: "cone", glyph: "OH"},
  "ʊ": {example: "book", glyph: "UH"},
  "uː": {example: "loot", glyph: "UX"},
  "ɜ": {example: "bird", glyph: "ER"},
  "ə": {example: "gallon", glyph: "AX"},
  // "ɪ": {example: "digit", glyph: "IX"},
  // DIPTHONGS
  "eɪ": {example: "made", glyph: "EY"},
  "aɪ": {example: "high", glyph: "AY"},
  "ɔɪ": {example: "boy", glyph: "OY"},
  "aʊ": {example: "how", glyph: "AW"},
  // "oʊ": {example: "slow", glyph: "OW"},
  // "uː": {example: "crew", glyph: "UW"},
  // VOICED CONSONANTS
  "r": {example: "red", glyph: "R"},
  "l": {example: "allow", glyph: "L"},
  "w": {example: "away", glyph: "W"},
  "ʍ": {example: "whale", glyph: "WH"},
  "j": {example: "you", glyph: "Y"},
  "m": {example: "Sam", glyph: "M"},
  "n": {example: "man", glyph: "N"},
  "ŋ": {example: "song", glyph: "NX"},
  "b": {example: "bad", glyph: "B"},
  "d": {example: "dog", glyph: "D"},
  "ɡ": {example: "again", glyph: "G"},
  "dʒ": {example: "judge", glyph: "J"},
  "z": {example: "zoo", glyph: "Z"},
  "ʒ": {example: "pleasure", glyph: "ZH"},
  "v": {example: "seven", glyph: "V"},
  "ð": {example: "then", glyph: "DH"},
  // UNVOICED CONSONANTS
  "s": {example: "Sam", glyph: "S"},
  "ʃ": {example: "fish", glyph: "SH"},
  "f": {example: "fish", glyph: "F"},
  "θ": {example: "thin", glyph: "TH"},
  "p": {example: "poke", glyph: "P"},
  "t": {example: "talk", glyph: "T"},
  "k": {example: "cake", glyph: "K"},
  "tʃ": {example: "speech", glyph: "CH"},
  "h": {example: "ahead", glyph: "/H"},
  // SPECIAL PHONEMES
  "əl": {example: "settle (= AXL)", glyph: "UL"},
  "əm": {example: "astronomy (= AXM)", glyph: "UM"},
  "ən": {example: "function (= ASN)", glyph: "UN"},
  "ʔ": {example: "kitt**-**en (glottal stop)", glyph: "Q"},
}

export function translateIPA(sentence: string, log: boolean = false): string {
  let translated: string[] = []
  log && console.log("[translateIPA] translating:", sentence)
  let words = sentence.split(" ");
  for (let word of words) {
    log && console.log("[translateIPA] translating word:", word)
    let translatedWord = ""
    let stress = false
    for (let i = 0; i < word.length;) {
      let step = 1
      let search = word[i]
      if (search == "ˈ") {
        stress = true
        i += 1
        continue
      }
      if (search == "/") {
        i += 1
        continue
      }
      let match: { example: string; glyph: string; } = IPA[search]
      if (match == undefined) {
        step += 1
        search = word[i]+word[i+1]
        match = IPA[search]
      }
      if (match == undefined) {
        step += 2
        search = word[i]+word[i+1]+word[i+2]
        match = IPA[search]
      }
      if (match == undefined) {
        log && console.error(`[translateIPA] no match found for \\${word[i]}\\`)
        // if we don't find a match skip the symbol - return the unmatched symbol
        // translatedWord += word[i]
        i += 1
        continue
      }
      log && console.log(`[translateIPA] match \\${match.glyph}\\ "${match.example}" found for \\${search}\\`)
      // add the match to the translated sentence
      translatedWord += match.glyph
      // add stress if set
      if (stress) {
        translatedWord += "3"
        stress = false
      }
      // step forward by the size of the search
      i += step
    }
    translated.push(translatedWord)
  }
  log && console.log(`[translateIPA] translation: "${translated.join(" ")}"`)
  return translated.join(" ")
}

if (window != undefined) {
  (window as any).tranlateIPA = translateIPA
}