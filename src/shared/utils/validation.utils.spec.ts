import { BadRequestException } from '@nestjs/common';
import { ValidationUtils } from './validation.utils';

describe('ValidationUtils', () => {
  describe('validateEmail', () => {
    it('should return true for valid email addresses', () => {
      expect(ValidationUtils.validateEmail('test@example.com')).toBe(true);
      expect(ValidationUtils.validateEmail('user.name@domain.co.uk')).toBe(
        true,
      );
      expect(ValidationUtils.validateEmail('user+tag@example.com')).toBe(true);
    });

    it('should return false for invalid email addresses', () => {
      expect(ValidationUtils.validateEmail('invalid')).toBe(false);
      expect(ValidationUtils.validateEmail('invalid@')).toBe(false);
      expect(ValidationUtils.validateEmail('@domain.com')).toBe(false);
      expect(ValidationUtils.validateEmail('invalid@domain')).toBe(false);
      expect(ValidationUtils.validateEmail('')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should not throw for valid passwords', () => {
      expect(() =>
        ValidationUtils.validatePassword('Test123!@#'),
      ).not.toThrow();
      expect(() =>
        ValidationUtils.validatePassword('Complex1Password!'),
      ).not.toThrow();
    });

    it('should throw for password shorter than 8 characters', () => {
      expect(() => ValidationUtils.validatePassword('Test1!')).toThrow(
        BadRequestException,
      );
      expect(() => ValidationUtils.validatePassword('Test1!')).toThrow(
        'Password must be at least 8 characters long',
      );
    });

    it('should throw for password without uppercase letter', () => {
      expect(() => ValidationUtils.validatePassword('test123!@#')).toThrow(
        BadRequestException,
      );
      expect(() => ValidationUtils.validatePassword('test123!@#')).toThrow(
        'Password must contain at least one uppercase letter',
      );
    });

    it('should throw for password without lowercase letter', () => {
      expect(() => ValidationUtils.validatePassword('TEST123!@#')).toThrow(
        BadRequestException,
      );
      expect(() => ValidationUtils.validatePassword('TEST123!@#')).toThrow(
        'Password must contain at least one lowercase letter',
      );
    });

    it('should throw for password without number', () => {
      expect(() => ValidationUtils.validatePassword('TestPassword!')).toThrow(
        BadRequestException,
      );
      expect(() => ValidationUtils.validatePassword('TestPassword!')).toThrow(
        'Password must contain at least one number',
      );
    });

    it('should throw for password without special character', () => {
      expect(() => ValidationUtils.validatePassword('TestPassword123')).toThrow(
        BadRequestException,
      );
      expect(() => ValidationUtils.validatePassword('TestPassword123')).toThrow(
        'Password must contain at least one special character',
      );
    });
  });

  describe('validatePhoneNumber', () => {
    it('should return true for valid phone numbers', () => {
      expect(ValidationUtils.validatePhoneNumber('+1234567890')).toBe(true);
      expect(ValidationUtils.validatePhoneNumber('1234567890')).toBe(true);
      expect(ValidationUtils.validatePhoneNumber('+551199999999')).toBe(true);
    });

    it('should return false for invalid phone numbers', () => {
      expect(ValidationUtils.validatePhoneNumber('invalid')).toBe(false);
      expect(ValidationUtils.validatePhoneNumber('123')).toBe(false);
      expect(ValidationUtils.validatePhoneNumber('')).toBe(false);
      expect(ValidationUtils.validatePhoneNumber('++1234567890')).toBe(false);
    });
  });

  describe('validateDate', () => {
    it('should return true for valid dates', () => {
      expect(ValidationUtils.validateDate('2024-03-14')).toBe(true);
      expect(ValidationUtils.validateDate('2024/03/14')).toBe(true);
      expect(ValidationUtils.validateDate('2024-03-14T12:00:00Z')).toBe(true);
    });

    it('should return false for invalid dates', () => {
      expect(ValidationUtils.validateDate('invalid')).toBe(false);
      expect(ValidationUtils.validateDate('2024-13-14')).toBe(false);
      expect(ValidationUtils.validateDate('2024-00-00')).toBe(false);
      expect(ValidationUtils.validateDate('')).toBe(false);
    });
  });
});
