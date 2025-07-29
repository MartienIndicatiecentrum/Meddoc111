/**
 * Validation utilities tests
 * Demonstrates testing patterns for the project
 */

import {
  validateFile,
  validateEmail,
  validatePhone,
  validateDate,
  safeValidateClient,
  ClientSchema,
} from '@/utils/validation';

describe('Validation Utils', () => {
  describe('validateFile', () => {
    it('should validate valid PDF file', () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const result = validateFile(file);
      expect(result.valid).toBe(true);
    });

    it('should reject file larger than 10MB', () => {
      const file = new File(['x'.repeat(11 * 1024 * 1024)], 'large.pdf', {
        type: 'application/pdf',
      });
      const result = validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('te groot');
    });

    it('should reject unsupported file type', () => {
      const file = new File(['test'], 'test.exe', { type: 'application/x-executable' });
      const result = validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('niet ondersteund');
    });
  });

  describe('validateEmail', () => {
    it('should validate valid email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
      ];

      validEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.valid).toBe(true);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user@.com',
      ];

      invalidEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Ongeldig e-mailadres');
      });
    });

    it('should accept empty email', () => {
      const result = validateEmail('');
      expect(result.valid).toBe(true);
    });
  });

  describe('validatePhone', () => {
    it('should validate valid Dutch phone numbers', () => {
      const validPhones = [
        '0612345678',
        '+31612345678',
        '0201234567',
        '+31201234567',
      ];

      validPhones.forEach(phone => {
        const result = validatePhone(phone);
        expect(result.valid).toBe(true);
      });
    });

    it('should reject invalid phone numbers', () => {
      const invalidPhones = [
        '123456789',
        '061234567',
        '+3161234567',
        'abc1234567',
      ];

      invalidPhones.forEach(phone => {
        const result = validatePhone(phone);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Ongeldig telefoonnummer');
      });
    });

    it('should accept empty phone number', () => {
      const result = validatePhone('');
      expect(result.valid).toBe(true);
    });
  });

  describe('validateDate', () => {
    it('should validate valid dates', () => {
      const validDates = [
        '2023-01-01',
        '2020-12-31',
        new Date('2023-06-15'),
      ];

      validDates.forEach(date => {
        const result = validateDate(date);
        expect(result.valid).toBe(true);
      });
    });

    it('should reject future dates', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const result = validateDate(futureDate);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('toekomst');
    });

    it('should reject invalid dates', () => {
      const invalidDates = [
        'invalid-date',
        '2023-13-01',
        '2023-02-30',
      ];

      invalidDates.forEach(date => {
        const result = validateDate(date);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Ongeldige datum');
      });
    });
  });

  describe('safeValidateClient', () => {
    it('should validate valid client data', () => {
      const validClient = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '0612345678',
        status: 'active' as const,
      };

      const result = safeValidateClient(validClient);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('John Doe');
      }
    });

    it('should return errors for invalid client data', () => {
      const invalidClient = {
        name: '', // Required field empty
        email: 'invalid-email',
        phone: 'invalid-phone',
      };

      const result = safeValidateClient(invalidClient);
      expect(result.success).toBe(false);
      if (result.success === false) {
        expect(result.errors).toContain('Naam is verplicht');
        expect(result.errors).toContain('Ongeldig e-mailadres');
      }
    });
  });

  describe('ClientSchema', () => {
    it('should parse valid client data', () => {
      const validClient = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '0612345678',
        status: 'active' as const,
      };

      const result = ClientSchema.parse(validClient);
      expect(result.name).toBe('Jane Doe');
      expect(result.email).toBe('jane@example.com');
    });

    it('should throw error for invalid client data', () => {
      const invalidClient = {
        name: '', // Required field empty
        email: 'invalid-email',
      };

      expect(() => ClientSchema.parse(invalidClient)).toThrow();
    });
  });
});