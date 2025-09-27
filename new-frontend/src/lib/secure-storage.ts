/**
 * Secure Token Storage Utility
 * Implements secure client-side token storage with encryption and best practices
 */

import { logger } from './secure-logger';

// Simple encryption utilities for client-side storage
class SecureStorage {
  private static readonly STORAGE_PREFIX = '__geo_secure_';
  private static readonly ENCRYPTION_KEY = 'geo_platform_storage_key';

  /**
   * Simple XOR encryption for client-side storage
   * Note: This is NOT cryptographically secure, but better than plain localStorage
   * For production, consider using Web Crypto API or similar
   */
  private static encrypt(text: string): string {
    const key = this.ENCRYPTION_KEY;
    let encrypted = '';

    for (let i = 0; i < text.length; i++) {
      const textChar = text.charCodeAt(i);
      const keyChar = key.charCodeAt(i % key.length);
      encrypted += String.fromCharCode(textChar ^ keyChar);
    }

    return btoa(encrypted); // Base64 encode
  }

  private static decrypt(encryptedText: string): string {
    try {
      const encrypted = atob(encryptedText); // Base64 decode
      const key = this.ENCRYPTION_KEY;
      let decrypted = '';

      for (let i = 0; i < encrypted.length; i++) {
        const encryptedChar = encrypted.charCodeAt(i);
        const keyChar = key.charCodeAt(i % key.length);
        decrypted += String.fromCharCode(encryptedChar ^ keyChar);
      }

      return decrypted;
    } catch {
      return '';
    }
  }

  /**
   * Store sensitive data securely
   */
  static setSecureItem(key: string, value: string): void {
    try {
      const encryptedValue = this.encrypt(value);
      const storageKey = this.STORAGE_PREFIX + key;

      // Use localStorage for both access and refresh tokens (encrypted)
      // This ensures tokens persist across browser refreshes
      localStorage.setItem(storageKey, encryptedValue);

      // Set expiration timestamp for additional security
      const expirationKey = storageKey + '_exp';
      const expiration = Date.now() + (key.includes('access_token') ? 3600000 : 86400000); // 1hr for access, 24h for refresh
      localStorage.setItem(expirationKey, expiration.toString());
    } catch (error) {
      logger.error('Failed to store secure item', { error });
    }
  }

  /**
   * Retrieve sensitive data securely
   */
  static getSecureItem(key: string): string | null {
    try {
      const storageKey = this.STORAGE_PREFIX + key;
      const expirationKey = storageKey + '_exp';

      // Check expiration first
      const expiration = localStorage.getItem(expirationKey);
      if (expiration && Date.now() > parseInt(expiration)) {
        this.removeSecureItem(key);
        return null;
      }

      // Get from localStorage (both access and refresh tokens stored there)
      const encryptedValue = localStorage.getItem(storageKey);

      if (!encryptedValue) {
        return null;
      }

      return this.decrypt(encryptedValue);
    } catch (error) {
      logger.error('Failed to retrieve secure item', { error });
      return null;
    }
  }

  /**
   * Remove sensitive data securely
   */
  static removeSecureItem(key: string): void {
    try {
      const storageKey = this.STORAGE_PREFIX + key;
      const expirationKey = storageKey + '_exp';

      localStorage.removeItem(storageKey);
      localStorage.removeItem(expirationKey);
    } catch (error) {
      logger.error('Failed to remove secure item', { error });
    }
  }

  /**
   * Clear all secure storage
   */
  static clearSecureStorage(): void {
    try {
      // Clear sessionStorage items
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i);
        if (key?.startsWith(this.STORAGE_PREFIX)) {
          sessionStorage.removeItem(key);
        }
      }

      // Clear localStorage items
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.STORAGE_PREFIX)) {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      logger.error('Failed to clear secure storage', { error });
    }
  }

  /**
   * Check if running in secure context (HTTPS)
   */
  static isSecureContext(): boolean {
    return window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost';
  }

  /**
   * Validate storage availability and security
   */
  static validateStorageContext(): { isValid: boolean; warnings: string[] } {
    const warnings: string[] = [];
    let isValid = true;

    // Check if storage is available
    try {
      localStorage.setItem('__test', 'test');
      localStorage.removeItem('__test');
      sessionStorage.setItem('__test', 'test');
      sessionStorage.removeItem('__test');
    } catch {
      warnings.push('Browser storage is not available');
      isValid = false;
    }

    // Check secure context
    if (!this.isSecureContext()) {
      warnings.push('Application is not running in a secure context (HTTPS)');
    }

    // Check for private browsing (some browsers disable localStorage)
    try {
      localStorage.setItem('__storage_test', '1');
      localStorage.removeItem('__storage_test');
    } catch {
      warnings.push('Private browsing mode may affect token storage');
    }

    return { isValid, warnings };
  }
}

/**
 * Enhanced Token Manager with Secure Storage
 */
export const secureTokenManager = {
  // Token keys
  ACCESS_TOKEN_KEY: 'geo_access_token',
  REFRESH_TOKEN_KEY: 'geo_refresh_token',
  ORGANIZATION_KEY: 'geo_organization_id',

  /**
   * Validate storage before any operation
   */
  validateStorage(): boolean {
    const validation = SecureStorage.validateStorageContext();
    if (!validation.isValid) {
      logger.error('Secure storage validation failed', { warnings: validation.warnings });
    }
    return validation.isValid;
  },

  /**
   * Get access token securely
   */
  getAccessToken(): string | null {
    if (!this.validateStorage()) return null;
    return SecureStorage.getSecureItem(this.ACCESS_TOKEN_KEY);
  },

  /**
   * Get refresh token securely
   */
  getRefreshToken(): string | null {
    if (!this.validateStorage()) return null;
    return SecureStorage.getSecureItem(this.REFRESH_TOKEN_KEY);
  },

  /**
   * Get organization ID securely
   */
  getOrganizationId(): string | null {
    if (!this.validateStorage()) return null;
    return SecureStorage.getSecureItem(this.ORGANIZATION_KEY);
  },

  /**
   * Set access token securely
   */
  setAccessToken(token: string): void {
    if (!this.validateStorage()) return;
    SecureStorage.setSecureItem(this.ACCESS_TOKEN_KEY, token);
  },

  /**
   * Set refresh token securely
   */
  setRefreshToken(token: string): void {
    if (!this.validateStorage()) return;
    SecureStorage.setSecureItem(this.REFRESH_TOKEN_KEY, token);
  },

  /**
   * Set organization ID securely
   */
  setOrganizationId(orgId: string): void {
    if (!this.validateStorage()) return;
    SecureStorage.setSecureItem(this.ORGANIZATION_KEY, orgId);
  },

  /**
   * Clear all tokens securely
   */
  clearTokens(): void {
    SecureStorage.removeSecureItem(this.ACCESS_TOKEN_KEY);
    SecureStorage.removeSecureItem(this.REFRESH_TOKEN_KEY);
    SecureStorage.removeSecureItem(this.ORGANIZATION_KEY);
  },

  /**
   * Clear all secure storage
   */
  clearAll(): void {
    SecureStorage.clearSecureStorage();
  },

  /**
   * Check if user has valid tokens
   */
  hasValidTokens(): boolean {
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();
    return !!(accessToken || refreshToken);
  },

  /**
   * Check if user is authenticated (has access token or refresh token)
   */
  isAuthenticated(): boolean {
    return this.hasValidTokens();
  }
};

// Export for backward compatibility and migration
export { SecureStorage };

// Initialize storage validation on module load
const validation = SecureStorage.validateStorageContext();
if (validation.warnings.length > 0) {
  logger.warn('Secure Storage Warnings', { warnings: validation.warnings });
}

export default secureTokenManager;