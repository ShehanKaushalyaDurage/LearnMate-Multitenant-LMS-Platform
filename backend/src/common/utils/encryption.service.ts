/**
 * LearnHub — AES-256-GCM Encryption Service
 *
 * Provides symmetric encryption/decryption for sensitive data:
 * - Tenant database passwords stored in the master DB
 * - NIC numbers and other PII
 *
 * FORMAT: iv:authTag:cipherText (all hex-encoded, colon-separated)
 *
 * SECURITY NOTES:
 * - Uses AES-256-GCM (authenticated encryption with associated data)
 * - Each encryption generates a unique random IV
 * - The auth tag prevents tampering with the ciphertext
 * - ENCRYPTION_KEY must be a 32-byte (64 hex chars) key from environment
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

@Injectable()
export class EncryptionService {
    private readonly logger = new Logger(EncryptionService.name);
    private readonly algorithm = 'aes-256-gcm' as const;
    private readonly key: Buffer;

    constructor(private readonly configService: ConfigService) {
        const keyHex = this.configService.get<string>('encryption.key');
        if (!keyHex) {
            throw new Error('ENCRYPTION_KEY environment variable is not set');
        }

        this.key = Buffer.from(keyHex, 'hex');
        if (this.key.length !== 32) {
            throw new Error(
                `ENCRYPTION_KEY must be 32 bytes (64 hex chars). Got ${this.key.length} bytes.`,
            );
        }
    }

    /**
     * Encrypt a plaintext string using AES-256-GCM
     *
     * @param plaintext - The text to encrypt
     * @returns Encrypted string in format "iv:authTag:cipherText"
     */
    encrypt(plaintext: string): string {
        // Generate a random 16-byte initialization vector
        const iv = randomBytes(16);

        // Create cipher with key and IV
        const cipher = createCipheriv(this.algorithm, this.key, iv);

        // Encrypt the plaintext
        let encrypted = cipher.update(plaintext, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        // Get the authentication tag (16 bytes)
        const authTag = cipher.getAuthTag();

        // Return as "iv:authTag:cipherText"
        return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    }

    /**
     * Decrypt a string that was encrypted with encrypt()
     *
     * @param encryptedText - The encrypted string in format "iv:authTag:cipherText"
     * @returns The original plaintext string
     * @throws Error if decryption fails (wrong key, tampered data, etc.)
     */
    decrypt(encryptedText: string): string {
        try {
            const parts = encryptedText.split(':');
            if (parts.length !== 3) {
                throw new Error('Invalid encrypted text format. Expected "iv:authTag:cipherText"');
            }

            const [ivHex, authTagHex, cipherTextHex] = parts;

            const iv = Buffer.from(ivHex, 'hex');
            const authTag = Buffer.from(authTagHex, 'hex');

            // Create decipher
            const decipher = createDecipheriv(this.algorithm, this.key, iv);
            decipher.setAuthTag(authTag);

            // Decrypt
            let decrypted = decipher.update(cipherTextHex, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            return decrypted;
        } catch (error) {
            this.logger.error('Decryption failed', error);
            throw new Error('Failed to decrypt data. The encryption key may be incorrect.');
        }
    }
}
