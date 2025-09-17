// ID generation utilities for Time & Wellness Application

/**
 * Generate a unique ID with prefix for database entities
 * @param prefix - Prefix for the ID (e.g., 'user', 'task', 'health')
 * @returns A unique ID string
 */
export function generateId(prefix: string): string {
  // Generate a unique ID using crypto.randomUUID() if available, 
  // otherwise use a combination of timestamp and random numbers
  
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    // Use crypto.randomUUID() in Cloudflare Workers and modern Node.js
    const uuid = crypto.randomUUID().replace(/-/g, '');
    return `${prefix}_${uuid}`;
  }
  
  // Fallback for environments without crypto.randomUUID()
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  const additionalRandom = Math.random().toString(36).substring(2, 10);
  
  return `${prefix}_${timestamp}${randomPart}${additionalRandom}`;
}

/**
 * Generate a short ID for display purposes (8 characters)
 * @param prefix - Prefix for the ID
 * @returns A short unique ID string
 */
export function generateShortId(prefix: string): string {
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `${prefix}_${randomPart}`;
}

/**
 * Generate a numeric ID (useful for certain scenarios)
 * @returns A unique numeric ID
 */
export function generateNumericId(): number {
  return Date.now() + Math.floor(Math.random() * 10000);
}

/**
 * Validate if an ID has the expected prefix
 * @param id - The ID to validate
 * @param expectedPrefix - The expected prefix
 * @returns True if the ID has the correct prefix
 */
export function validateIdPrefix(id: string, expectedPrefix: string): boolean {
  return id.startsWith(`${expectedPrefix}_`);
}

/**
 * Extract the prefix from an ID
 * @param id - The ID to extract the prefix from
 * @returns The prefix or null if not found
 */
export function extractIdPrefix(id: string): string | null {
  const parts = id.split('_');
  return parts.length > 1 ? parts[0] : null;
}

/**
 * Generate a secure random string for tokens and secrets
 * @param length - Length of the random string (default: 32)
 * @returns A secure random string
 */
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    // Use crypto.getRandomValues() for better security
    const randomArray = new Uint8Array(length);
    crypto.getRandomValues(randomArray);
    
    for (let i = 0; i < length; i++) {
      result += chars[randomArray[i] % chars.length];
    }
  } else {
    // Fallback to Math.random() (less secure but functional)
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  
  return result;
}

/**
 * Generate a URL-safe slug from a string
 * @param text - The text to convert to a slug
 * @param maxLength - Maximum length of the slug (default: 50)
 * @returns A URL-safe slug
 */
export function generateSlug(text: string, maxLength: number = 50): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with hyphens
    .replace(/[^\w\-]+/g, '')       // Remove non-word characters except hyphens
    .replace(/\-\-+/g, '-')         // Replace multiple hyphens with single hyphen
    .replace(/^-+/, '')             // Remove leading hyphens
    .replace(/-+$/, '')             // Remove trailing hyphens
    .substring(0, maxLength);       // Limit length
}

/**
 * Generate a filename-safe string from text
 * @param text - The text to convert
 * @param extension - File extension to append (optional)
 * @returns A filename-safe string
 */
export function generateFileName(text: string, extension?: string): string {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const slug = generateSlug(text, 30);
  const fileName = `${timestamp}_${slug}`;
  
  return extension ? `${fileName}.${extension}` : fileName;
}