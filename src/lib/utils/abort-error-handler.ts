/**
 * Utility function to detect Abort-like errors across runtimes
 */
export function isAbortLike(error: unknown): boolean {
  if (!error) return false;
  const msg = typeof error === 'string' ? error : (error as any)?.message || '';
  const name = (error as any)?.name || '';
  return name === 'AbortError' || /AbortError|aborted|ResponseAborted|The user aborted a request/i.test(String(msg));
}

/**
 * Utility function to handle AbortError consistently across the application
 * This prevents AbortError from being treated as a critical error
 */
export function handleAbortError(error: unknown, context: string = 'Unknown'): void {
  if (isAbortLike(error)) {
    // Abort-like errors are usually not critical - they happen when requests are cancelled
    // This is normal behavior when components unmount or navigation occurs
    console.log(`🔄 ${context} was aborted - this is normal behavior`);
    return;
  }
  
  // For non-AbortError, log as usual
  console.error(`❌ Error in ${context}:`, error);
}

/**
 * Wrapper for fetch calls that handles AbortError gracefully
 */
export async function safeFetch(
  url: string, 
  options?: RequestInit, 
  context: string = 'Fetch request'
): Promise<Response> {
  try {
    return await fetch(url, options);
  } catch (error) {
    handleAbortError(error, context);
    throw error; // Re-throw so calling code can handle if needed
  }
}
