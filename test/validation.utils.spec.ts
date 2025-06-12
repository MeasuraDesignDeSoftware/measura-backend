import { ValidationUtils } from '../src/shared/utils/validation.utils';

describe('ValidationUtils', () => {
  describe('isValidEmail', () => {
    it('should return true for valid email addresses', () => {
      expect(ValidationUtils.isValidEmail('test@example.com')).toBe(true);
      expect(ValidationUtils.isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(ValidationUtils.isValidEmail('admin+tag@company.org')).toBe(true);
    });

    it('should return false for invalid email addresses', () => {
      expect(ValidationUtils.isValidEmail('invalid-email')).toBe(false);
      expect(ValidationUtils.isValidEmail('@domain.com')).toBe(false);
      expect(ValidationUtils.isValidEmail('user@')).toBe(false);
      expect(ValidationUtils.isValidEmail('user@domain')).toBe(false);
      expect(ValidationUtils.isValidEmail('')).toBe(false);
    });
  });

  describe('isValidPassword', () => {
    it('should return true for valid passwords', () => {
      expect(ValidationUtils.isValidPassword('password123')).toBe(true);
      expect(ValidationUtils.isValidPassword('12345678')).toBe(true);
      expect(ValidationUtils.isValidPassword('a'.repeat(128))).toBe(true);
    });

    it('should return false for invalid passwords', () => {
      expect(ValidationUtils.isValidPassword('short')).toBe(false);
      expect(ValidationUtils.isValidPassword('1234567')).toBe(false);
      expect(ValidationUtils.isValidPassword('a'.repeat(129))).toBe(false);
      expect(ValidationUtils.isValidPassword('')).toBe(false);
    });
  });

  describe('isValidObjectId', () => {
    it('should return true for valid MongoDB ObjectIds', () => {
      expect(ValidationUtils.isValidObjectId('507f1f77bcf86cd799439011')).toBe(
        true,
      );
      expect(ValidationUtils.isValidObjectId('123456789012345678901234')).toBe(
        true,
      );
      expect(ValidationUtils.isValidObjectId('abcdefabcdefabcdefabcdef')).toBe(
        true,
      );
    });

    it('should return false for invalid ObjectIds', () => {
      expect(ValidationUtils.isValidObjectId('invalid-id')).toBe(false);
      expect(ValidationUtils.isValidObjectId('12345')).toBe(false);
      expect(ValidationUtils.isValidObjectId('507f1f77bcf86cd79943901g')).toBe(
        false,
      );
      expect(ValidationUtils.isValidObjectId('')).toBe(false);
    });
  });

  describe('sanitizeString', () => {
    it('should remove dangerous characters and trim whitespace', () => {
      expect(ValidationUtils.sanitizeString('  hello world  ')).toBe(
        'hello world',
      );
      expect(
        ValidationUtils.sanitizeString('<script>alert("xss")</script>'),
      ).toBe('scriptalert("xss")/script');
      expect(ValidationUtils.sanitizeString('normal text')).toBe('normal text');
    });

    it('should handle empty strings', () => {
      expect(ValidationUtils.sanitizeString('')).toBe('');
      expect(ValidationUtils.sanitizeString('   ')).toBe('');
    });
  });

  describe('isValidFileType', () => {
    const allowedTypes = ['pdf', 'doc', 'docx', 'txt'];

    it('should return true for allowed file types', () => {
      expect(
        ValidationUtils.isValidFileType('document.pdf', allowedTypes),
      ).toBe(true);
      expect(ValidationUtils.isValidFileType('file.DOC', allowedTypes)).toBe(
        true,
      );
      expect(ValidationUtils.isValidFileType('text.txt', allowedTypes)).toBe(
        true,
      );
    });

    it('should return false for disallowed file types', () => {
      expect(ValidationUtils.isValidFileType('image.jpg', allowedTypes)).toBe(
        false,
      );
      expect(ValidationUtils.isValidFileType('script.js', allowedTypes)).toBe(
        false,
      );
      expect(ValidationUtils.isValidFileType('noextension', allowedTypes)).toBe(
        false,
      );
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(ValidationUtils.formatFileSize(0)).toBe('0 Bytes');
      expect(ValidationUtils.formatFileSize(1024)).toBe('1 KB');
      expect(ValidationUtils.formatFileSize(1048576)).toBe('1 MB');
      expect(ValidationUtils.formatFileSize(1073741824)).toBe('1 GB');
    });

    it('should handle decimal values', () => {
      expect(ValidationUtils.formatFileSize(1536)).toBe('1.5 KB');
      expect(ValidationUtils.formatFileSize(2097152)).toBe('2 MB');
    });
  });

  describe('isWithinRange', () => {
    it('should return true for values within range', () => {
      expect(ValidationUtils.isWithinRange(5, 1, 10)).toBe(true);
      expect(ValidationUtils.isWithinRange(1, 1, 10)).toBe(true);
      expect(ValidationUtils.isWithinRange(10, 1, 10)).toBe(true);
    });

    it('should return false for values outside range', () => {
      expect(ValidationUtils.isWithinRange(0, 1, 10)).toBe(false);
      expect(ValidationUtils.isWithinRange(11, 1, 10)).toBe(false);
      expect(ValidationUtils.isWithinRange(-5, 1, 10)).toBe(false);
    });
  });

  describe('generateRandomString', () => {
    it('should generate string of correct length', () => {
      expect(ValidationUtils.generateRandomString(10)).toHaveLength(10);
      expect(ValidationUtils.generateRandomString(20)).toHaveLength(20);
      expect(ValidationUtils.generateRandomString(0)).toHaveLength(0);
    });

    it('should generate different strings on multiple calls', () => {
      const string1 = ValidationUtils.generateRandomString(10);
      const string2 = ValidationUtils.generateRandomString(10);
      expect(string1).not.toBe(string2);
    });

    it('should only contain alphanumeric characters', () => {
      const randomString = ValidationUtils.generateRandomString(100);
      expect(randomString).toMatch(/^[A-Za-z0-9]+$/);
    });
  });
});
