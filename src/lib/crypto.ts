import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const SECRET_KEY = process.env.ENCRYPTION_SECRET || 'your-secret-key-change-this-in-production'
const IV_LENGTH = 16
const SALT_LENGTH = 64
const KEY_LENGTH = 32

function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, 100000, KEY_LENGTH, 'sha256')
}

export function encrypt(text: string): string {
  try {
    // Generate random salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH)
    const iv = crypto.randomBytes(IV_LENGTH)
    
    // Derive key from secret and salt
    const key = deriveKey(SECRET_KEY, salt)
    
    // Create cipher
    const cipher = crypto.createCipherGCM(ALGORITHM, key, iv)
    
    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    // Get the authentication tag
    const authTag = cipher.getAuthTag()
    
    // Combine salt, iv, authTag, and encrypted data
    const combined = Buffer.concat([
      salt,
      iv,
      authTag,
      Buffer.from(encrypted, 'hex')
    ])
    
    return combined.toString('base64')
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt data')
  }
}

export function decrypt(encryptedData: string): string {
  try {
    // Parse the base64 encoded data
    const combined = Buffer.from(encryptedData, 'base64')
    
    // Extract components
    const salt = combined.subarray(0, SALT_LENGTH)
    const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
    const authTag = combined.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + 16)
    const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + 16)
    
    // Derive key from secret and salt
    const key = deriveKey(SECRET_KEY, salt)
    
    // Create decipher
    const decipher = crypto.createDecipherGCM(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)
    
    // Decrypt the data
    let decrypted = decipher.update(encrypted, undefined, 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    console.error('Decryption error:', error)
    throw new Error('Failed to decrypt data')
  }
}

// Utility function to hash passwords or other sensitive data
export function hash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex')
}

// Utility function to generate secure random tokens
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}
