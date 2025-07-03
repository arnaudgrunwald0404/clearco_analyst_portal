/**
 * Banner art utility functions for the Analyst Portal
 */

// List of available banner art images
const BANNER_IMAGES = [
  '1dx_cO8C-Uo96jkN9s37Z.png',
  '2Tg5KspbisdY8ZTJoxeVl.png',
  '5tEKURo4T77ldqhwOMzP9.png',
  '9lMol_h5pI87vU98809v1.png',
  'Hb69s7w2QpEHL_EFKf5sk.png',
  'MrimxUc-da9zHuQFtGRFw.png',
  'X9_TKuWP0SGOtOcNaLfj8.png',
  '_rdWUavWadbVzyHjV-FRp.png',
  'n42VjhWcnVyK4ktZZ0cDv.png',
  'ntSsbKjPpJNYm5ymbcpfn.png',
  'vRZHfJjXFnfFXcYA0rjYI.png',
  'w2CIPUBNpahDzOv0S_ozq.png'
]

/**
 * Get a random banner image filename
 * @returns {string} Random banner image filename
 */
export function getRandomBannerImage(): string {
  const randomIndex = Math.floor(Math.random() * BANNER_IMAGES.length)
  return BANNER_IMAGES[randomIndex]
}

/**
 * Get the full path to a banner image
 * @param {string} filename - The banner image filename
 * @returns {string} Full path to the banner image
 */
export function getBannerImagePath(filename: string): string {
  return `/banner-art/${filename}`
}

/**
 * Get a random banner image with full path
 * @returns {string} Full path to a random banner image
 */
export function getRandomBannerImagePath(): string {
  const filename = getRandomBannerImage()
  return getBannerImagePath(filename)
}

/**
 * Get all available banner images with full paths
 * @returns {string[]} Array of all banner image paths
 */
export function getAllBannerImagePaths(): string[] {
  return BANNER_IMAGES.map(filename => getBannerImagePath(filename))
}
