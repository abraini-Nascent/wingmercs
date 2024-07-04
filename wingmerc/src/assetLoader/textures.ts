export const SpaceInterestTextures = {
  // moon1Single: "./assets/planets/moon-1-single.png",
  asteroid1Single: "./assets/planets/asteroid-1-single.png",
  asteroid2Single: "./assets/planets/asteroid-2-single.png",
  blackhole1Animated: "./assets/planets/blackhole-1-animated.png",
  // blackhole1Single: "./assets/planets/blackhole-1-single.png",
  galaxy1Animated: "./assets/planets/galaxy-1-animated.png",
  // galaxy1Single: "./assets/planets/galaxy-1-single.png",
  gas1Animated: "./assets/planets/gas-1-animated.png",
  // gas1Single: "./assets/planets/gas-1-single.png",
  lava1Animated: "./assets/planets/lava-1-animated.png",
  // lava1Single: "./assets/planets/lava-1-single.png",
  moon1Animated: "./assets/planets/moon-1-animated.png",
} as const
export const TextureUrls = {
  ...SpaceInterestTextures
} as const

export type SpaceInterestTextures = typeof SpaceInterestTextures[keyof typeof SpaceInterestTextures];