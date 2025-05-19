import * as bcrypt from 'bcrypt';

export class Password {
  private readonly value: string;
  private static readonly SALT_ROUNDS = 10;

  private constructor(value: string) {
    this.value = value;
  }

  /**
   * Factory method to create a Password from plain text
   * @param plainText Plain text password
   * @returns New Password instance with hashed value
   */
  static async fromPlainText(plainText: string): Promise<Password> {
    this.validate(plainText);
    const hashedPassword = await bcrypt.hash(plainText, this.SALT_ROUNDS);
    return new Password(hashedPassword);
  }

  /**
   * Factory method to create a Password from an already hashed value
   * @param hashedValue Previously hashed password value
   * @returns New Password instance with the provided hashed value
   */
  static fromHashed(hashedValue: string): Password {
    if (!/^\$2[aby]?\$\d{2}\$[./A-Za-z0-9]{53}$/.test(hashedValue)) {
      throw new Error('Invalid bcrypt hash supplied');
    }
    return new Password(hashedValue);
  }

  /**
   * Validates that the provided password meets security requirements
   * @param password Plain text password to validate
   * @throws Error if password does not meet requirements
   */
  static validate(password: string): void {
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    if (!/(?=.*[a-z])/.test(password)) {
      throw new Error('Password must contain at least one lowercase letter');
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      throw new Error('Password must contain at least one uppercase letter');
    }

    if (!/(?=.*\d)/.test(password)) {
      throw new Error('Password must contain at least one number');
    }

    if (!/(?=.*[@$!%*?&])/.test(password)) {
      throw new Error('Password must contain at least one special character');
    }
  }

  /**
   * Compares a plain text password with the hashed password
   * @param plainText Plain text password to compare
   * @returns True if passwords match, false otherwise
   */
  async compare(plainText: string): Promise<boolean> {
    return bcrypt.compare(plainText, this.value);
  }

  /**
   * Get the hashed password value
   * @returns The hashed password
   */
  getValue(): string {
    return this.value;
  }
}
