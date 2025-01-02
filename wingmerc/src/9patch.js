const fontFileInput = document.getElementById("fontFile")
const textInput = document.getElementById("textInput")
const cellSizeInput = document.getElementById("cellSize")
const fontSizeInput = document.getElementById("fontSize")
const cellHeightInput = document.getElementById("cellHeightSize")
const cellWidthInput = document.getElementById("cellWidthSize")
const generateButton = document.getElementById("generate")
const exportButton = document.getElementById("export")
const canvas = document.getElementById("preview")
const ctx = canvas.getContext("2d")

let fontFace = null
let fontSize = 16
let glyphWidth = 16,
  glyphHeight = 16,
  cellHeightSize = 16,
  cellWidthSize = 16,
  estimatedWidth = 16,
  estimatedHeight = 16
let grid = Array(3)
  .fill(null)
  .map(() => Array(3).fill(null)) // 3x3 grid for 9-patch

fontFileInput.addEventListener("change", handleFontUpload)
textInput.addEventListener("input", handleTextInput)
cellSizeInput.addEventListener("change", (e) => {
  cellSize = parseInt(e.target.value, 10)
})
fontSizeInput.addEventListener("change", (e) => {
  fontSize = parseInt(e.target.value, 10)
})
cellHeightInput.addEventListener("change", (e) => {
  cellHeightSize = parseInt(e.target.value, 10)
})
cellWidthInput.addEventListener("change", (e) => {
  cellWidthSize = parseInt(e.target.value, 10)
})
generateButton.addEventListener("click", generate9Patch)
exportButton.addEventListener("click", export9Patch)

function handleFontUpload(event) {
  const file = event.target.files[0]
  if (file) {
    console.log(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      const font = new FontFace("CustomFont", e.target.result)
      font
        .load()
        .then(() => {
          fontFace = font
          document.fonts.add(fontFace)
          console.log("fontSize", fontSize)
          let size = estimateGlyphSize("=", fontSize)
          console.log(size)
          cellHeightInput.value = size.height
          cellWidthInput.value = size.width
          cellHeightSize = size.height
          cellWidthSize = size.width
          if (textInput.value.length == 9) {
            updateGridWithText(textInput.value)
          }
          alert("Font loaded successfully!")
        })
        .catch((err) => {
          alert("Failed to load font: " + err.message)
        })
    }
    reader.readAsArrayBuffer(file)
  }
}

function estimateGlyphSize(glyph, fontSize) {
  ctx.font = `${fontSize}px CustomFont`
  const metrics = ctx.measureText(glyph)
  console.log("metrics")
  console.log("fontSize", fontSize)
  return {
    width: metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight, // Approximate width of the glyph
    height: metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent - metrics.ideographicBaseline, // Assumes the height equals the font size
  }
}

function handleTextInput(event) {
  const text = event.target.value
  if (text.length === 9) {
    updateGridWithText(text)
  }
}

function updateGridWithText(text) {
  grid = [
    [text[0], text[1], text[2]], // Top row
    [text[3], text[4], text[5]], // Middle row
    [text[6], text[7], text[8]], // Bottom row
  ]
}

function generate9Patch() {
  if (!fontFace) {
    alert("Please upload a font first.")
    return
  }

  console.log("generating ...")
  console.log(cellWidthSize, cellHeightSize)
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.font = `CustomFont`
  ctx.fontSize = `${fontSize}px`
  ctx.textAlign = "center"
  // ctx.textBaseline = "middle"

  // const padding = 2 // Padding for the text

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const char = grid[row][col]
      const x = col * cellWidthSize
      const y = row * cellHeightSize
      console.log(char, x, y)

      ctx.fillText(char, x + cellWidthSize / 2, y + 2 + cellHeightSize / 2)
    }
  }

  glyphWidth = cellWidthSize
  glyphHeight = cellHeightSize
}

function export9Patch() {
  const link = document.createElement("a")
  link.download = "9patch.png"
  link.href = canvas.toDataURL()
  link.click()
}
