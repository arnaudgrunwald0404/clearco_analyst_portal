/**
 * Shared utility functions for similarity calculations
 * Used across publication discovery modules to eliminate code duplication
 */

/**
 * Calculates title similarity for duplicate detection
 * @param title1 First title to compare
 * @param title2 Second title to compare
 * @returns Similarity score between 0 and 1
 */
export function calculateTitleSimilarity(title1: string, title2: string): number {
  const words1 = title1.split(/\s+/)
  const words2 = title2.split(/\s+/)
  
  const commonWords = words1.filter(word => 
    words2.includes(word) && word.length > 3
  ).length
  
  const totalWords = Math.max(words1.length, words2.length)
  
  return totalWords > 0 ? commonWords / totalWords : 0
}

/**
 * Calculates character-based similarity between two strings
 * @param str1 First string to compare
 * @param str2 Second string to compare
 * @returns Similarity score between 0 and 1
 */
export function calculateCharacterSimilarity(str1: string, str2: string): number {
  const len1 = str1.length
  const len2 = str2.length
  const maxLen = Math.max(len1, len2)
  
  if (maxLen === 0) return 1
  
  let matches = 0
  const minLen = Math.min(len1, len2)
  
  for (let i = 0; i < minLen; i++) {
    if (str1[i] === str2[i]) {
      matches++
    }
  }
  
  return matches / maxLen
}

/**
 * Removes duplicate results based on URL and title similarity
 * @param results Array of search results to deduplicate
 * @param similarityThreshold Threshold for considering titles similar (default: 0.8)
 * @returns Array of unique results
 */
export function removeDuplicateResults<T extends { url: string; title: string }>(
  results: T[],
  similarityThreshold: number = 0.8
): T[] {
  const seen = new Set<string>()
  const unique: T[] = []

  for (const result of results) {
    // Check for exact URL duplicates
    if (seen.has(result.url)) {
      continue
    }

    // Check for title similarity
    const isDuplicate = unique.some(existing => {
      const titleSimilarity = calculateTitleSimilarity(
        existing.title.toLowerCase(),
        result.title.toLowerCase()
      )
      return titleSimilarity > similarityThreshold
    })

    if (!isDuplicate) {
      seen.add(result.url)
      unique.push(result)
    }
  }

  return unique
} 