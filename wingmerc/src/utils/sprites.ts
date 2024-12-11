import { VertexBuffer } from "@babylonjs/core";

export function setSpriteUVs(plane, index, columns, rows) {
  var uvs = plane.getVerticesData(VertexBuffer.UVKind);
  
  // Calculate the sprite size in UV space
  var spriteWidth = 1 / columns;
  var spriteHeight = 1 / rows;
  
  // Calculate row and column for the sprite index
  var column = index % columns;
  var row = Math.floor(index / columns);
  
  // Calculate the UV offset for the sprite
  var uMin = column * spriteWidth;
  var uMax = uMin + spriteWidth;
  var vMin = 1 - (row + 1) * spriteHeight;
  var vMax = vMin + spriteHeight;
  
  // Update UVs
  uvs[0] = uMin; uvs[1] = vMax;
  uvs[2] = uMax; uvs[3] = vMax;
  uvs[4] = uMax; uvs[5] = vMin;
  uvs[6] = uMin; uvs[7] = vMin;
  
  // Apply the new UVs to the plane
  plane.updateVerticesData(VertexBuffer.UVKind, uvs);

  setBackFaceUVs(plane, uMin, uMax, vMin, vMax)
}

export function setSpriteBackUVs(plane, index, columns, rows) {
  var uvs = plane.getVerticesData(VertexBuffer.UVKind);
  
  // Calculate the sprite size in UV space
  var spriteWidth = 1 / columns;
  var spriteHeight = 1 / rows;
  
  // Calculate row and column for the sprite index
  var column = index % columns;
  var row = Math.floor(index / columns);
  
  // Calculate the UV offset for the sprite
  var uMin = column * spriteWidth;
  var uMax = uMin + spriteWidth;
  var vMin = 1 - (row + 1) * spriteHeight;
  var vMax = vMin + spriteHeight;

  setBackFaceUVs(plane, uMin, uMax, vMin, vMax)
}

function setBackFaceUVs(plane, uMin, uMax, vMin, vMax) {
  var uvs = plane.getVerticesData(VertexBuffer.UVKind);
  
  // The back face UVs are at indices 8 to 15
  // Indices for back face: 
  // [8, 9] -> top-left, [10, 11] -> top-right, [12, 13] -> bottom-right, [14, 15] -> bottom-left
  
  uvs[8]  = uMin; uvs[9]  = vMax;  // Top-left
  uvs[10] = uMax; uvs[11] = vMax;  // Top-right
  uvs[12] = uMax; uvs[13] = vMin;  // Bottom-right
  uvs[14] = uMin; uvs[15] = vMin;  // Bottom-left
  
  // Apply the new UVs to the plane
  plane.updateVerticesData(VertexBuffer.UVKind, uvs);
}