/**
 * SECURITY: Input Sanitization Utilities
 * Prevents XSS attacks and validates user input
 */

/**
 * SECURITY: Sanitize HTML content to prevent XSS
 */
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * SECURITY: Sanitize text input for database storage
 */
export function sanitizeText(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .substring(0, 10000); // Limit length to prevent DoS
}

/**
 * SECURITY: Validate and sanitize email addresses
 */
export function sanitizeEmail(email: string): string | null {
  if (typeof email !== 'string') {
    return null;
  }
  
  const sanitized = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(sanitized) || sanitized.length > 254) {
    return null;
  }
  
  return sanitized;
}

/**
 * SECURITY: Validate and sanitize phone numbers
 */
export function sanitizePhone(phone: string): string | null {
  if (typeof phone !== 'string') {
    return null;
  }
  
  // Remove all non-digit characters except + at the start
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Basic validation: should be 10-15 digits, optionally starting with +
  const phoneRegex = /^(\+?[1-9]\d{1,14})$/;
  
  if (!phoneRegex.test(cleaned)) {
    return null;
  }
  
  return cleaned;
}

/**
 * SECURITY: Validate file names to prevent path traversal
 */
export function sanitizeFileName(fileName: string): string | null {
  if (typeof fileName !== 'string') {
    return null;
  }
  
  // Remove path traversal attempts and dangerous characters
  const sanitized = fileName
    .replace(/[<>:"/\\|?*]/g, '') // Windows forbidden characters
    .replace(/\.\./g, '') // Path traversal
    .replace(/^\.+/, '') // Leading dots
    .trim();
  
  // Check for reserved names (Windows)
  const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;
  if (reservedNames.test(sanitized)) {
    return null;
  }
  
  // Must have reasonable length and contain valid characters
  if (sanitized.length === 0 || sanitized.length > 255) {
    return null;
  }
  
  return sanitized;
}

/**
 * SECURITY: Validate and sanitize URLs
 */
export function sanitizeUrl(url: string): string | null {
  if (typeof url !== 'string') {
    return null;
  }
  
  try {
    const parsed = new URL(url);
    
    // Only allow safe protocols
    const allowedProtocols = ['http:', 'https:', 'mailto:'];
    if (!allowedProtocols.includes(parsed.protocol)) {
      return null;
    }
    
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * SECURITY: Sanitize search queries to prevent injection
 */
export function sanitizeSearchQuery(query: string): string {
  if (typeof query !== 'string') {
    return '';
  }
  
  return query
    .trim()
    .replace(/[%_\\]/g, '\\$&') // Escape SQL LIKE wildcards
    .replace(/['"`;]/g, '') // Remove dangerous SQL characters
    .substring(0, 100); // Limit length
}

/**
 * SECURITY: Validate UUID format
 */
export function isValidUuid(uuid: string): boolean {
  if (typeof uuid !== 'string') {
    return false;
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * SECURITY: Sanitize client data before database operations
 */
export function sanitizeClientData(data: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeText(value);
    } else if (typeof value === 'number' && isFinite(value)) {
      sanitized[key] = value;
    } else if (typeof value === 'boolean') {
      sanitized[key] = value;
    } else if (value === null || value === undefined) {
      sanitized[key] = value;
    }
    // Skip other types for security
  }
  
  return sanitized;
}

/**
 * SECURITY: Rate limiting helper
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(key: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
}

/**
 * SECURITY: Clean up rate limit map periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 300000); // Clean up every 5 minutes
