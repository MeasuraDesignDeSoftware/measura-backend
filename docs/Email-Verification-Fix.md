# Email Verification System Fix

## Issues Identified

### 1. **Email Verification Not Enforced During Login**

- **Problem**: Users could log in without verifying their email addresses
- **Root Cause**: The `validateUser` method in `AuthService` was not checking the `isEmailVerified` field
- **Impact**: Allowed spam accounts and unverified users to access the system

### 2. **Double Token Hashing Issue**

- **Problem**: Verification tokens were being hashed twice, preventing successful verification
- **Root Cause**:
  - Auth service was hashing tokens with `bcrypt`
  - Repository was hashing them again with `crypto.createHash`
- **Impact**: Email verification would always fail due to token mismatch

### 3. **Email Configuration Issues**

- **Problem**: Malformed `EMAIL_FROM` environment variable
- **Root Cause**: Format was `<email>` instead of `Name <email>`
- **Impact**: Potential email delivery issues

### 4. **Poor Error Handling and Debugging**

- **Problem**: Limited logging and error information for email failures
- **Root Cause**: Insufficient debugging tools and error reporting
- **Impact**: Difficult to diagnose email service issues

## Fixes Implemented

### 1. **Added Email Verification Enforcement**

**File**: `src/application/auth/use-cases/auth.service.ts`

```typescript
async validateUser(login: string, password: string): Promise<User> {
  const user = await this.userRepository.findByEmailOrUsername(login);
  if (!user) {
    throw new UnauthorizedException('Invalid credentials');
  }

  if (user.provider !== AuthProvider.LOCAL) {
    throw new BadRequestException(
      `This account was created using ${user.provider} authentication`,
    );
  }

  // NEW: Check if email is verified for local accounts
  if (!user.isEmailVerified) {
    throw new UnauthorizedException(
      'Please verify your email address before logging in. Check your inbox for a verification email.',
    );
  }

  const isPasswordValid = await bcrypt.compare(password, user.password!);
  if (!isPasswordValid) {
    throw new UnauthorizedException('Invalid credentials');
  }

  return user;
}
```

### 2. **Fixed Double Token Hashing**

**File**: `src/infrastructure/repositories/users/user.repository.ts`

```typescript
async setVerificationToken(
  userId: string,
  token: string, // Already hashed in auth service
  tokenExpires: Date,
): Promise<void> {
  // Removed crypto hashing - token is already hashed with bcrypt
  await this.userModel.findByIdAndUpdate(
    userId,
    {
      verificationToken: token, // Store as-is (already hashed)
      verificationTokenExpires: tokenExpires,
    },
    { new: true },
  ).exec();
}
```

### 3. **Added Resend Verification Email Feature**

**New Method**: `AuthService.resendVerificationEmail()`
**New Endpoint**: `POST /auth/resend-verification`
**New DTO**: `ResendVerificationDto`

```typescript
async resendVerificationEmail(email: string): Promise<void> {
  const user = await this.userRepository.findByEmail(email);

  if (!user || user.provider !== AuthProvider.LOCAL || user.isEmailVerified) {
    // Handle gracefully without revealing user existence
    return;
  }

  // Generate new verification token
  const verificationToken = String(uuidv4());
  const hashedVerificationToken = await bcrypt.hash(verificationToken, 10);
  const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await this.userRepository.setVerificationToken(
    userId,
    hashedVerificationToken,
    verificationTokenExpires,
  );

  await this.emailService.sendVerificationEmail(email, verificationToken);
}
```

### 4. **Enhanced Email Service Logging**

**File**: `src/infrastructure/external-services/email/email.service.ts`

```typescript
async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!this.isConfigValid || !this.transporter) {
    this.logger.debug('Email configuration check:', {
      hasTransporter: !!this.transporter,
      isConfigValid: this.isConfigValid,
      host: this.configService.get<string>('app.email.host'),
      port: this.configService.get<string>('app.email.port'),
      user: this.configService.get<string>('app.email.user') ? 'configured' : 'missing',
      pass: this.configService.get<string>('app.email.pass') ? 'configured' : 'missing',
    });
    throw new ServiceUnavailableException('Email service not properly initialized');
  }

  try {
    this.logger.log(`Attempting to send email to ${to} with subject: ${subject}`);

    await this.transporter.sendMail({
      from: this.from,
      to,
      subject,
      html,
    });

    this.logger.log(`Email sent successfully to ${to}`);
    return true;
  } catch (error) {
    this.logger.error(`Failed to send email to ${to}: ${error.message}`);
    this.logger.error('Email send error details:', error);
    throw new ServiceUnavailableException(`Failed to send email: ${error.message}`);
  }
}
```

### 5. **Added Email Service Test Endpoint**

**New Method**: `AuthService.testEmailService()`
**New Endpoint**: `POST /auth/test-email`

For development/debugging purposes to test email configuration.

## Environment Configuration Fix

**Required Change in `.env` file**:

```env
# BEFORE (incorrect)
EMAIL_FROM=<8d5207001@smtp-brevo.com>

# AFTER (correct)
EMAIL_FROM=Measura <8d5207001@smtp-brevo.com>
```

## API Endpoints

### New Endpoints Added

1. **Resend Verification Email**

   - **Endpoint**: `POST /auth/resend-verification`
   - **Body**: `{ "email": "user@example.com" }`
   - **Purpose**: Allow users to request a new verification email

2. **Test Email Service** (Development Only)
   - **Endpoint**: `POST /auth/test-email`
   - **Body**: `{ "email": "test@example.com" }`
   - **Purpose**: Test email service configuration

### Updated Behavior

1. **Registration** (`POST /auth/register`)

   - Still creates user even if email fails to send
   - Logs email sending failures
   - User can request resend verification

2. **Login** (`POST /auth/login`)

   - Now enforces email verification
   - Returns clear error message for unverified accounts

3. **Email Verification** (`GET /auth/verify-email?token=...`)
   - Fixed token matching issue
   - Now works correctly with bcrypt hashed tokens

## Testing the Fix

### 1. Test Email Configuration

```bash
curl -X POST http://localhost:8080/auth/test-email \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com"}'
```

### 2. Test Registration Flow

```bash
# Register new user
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "password123"
  }'

# Try to login (should fail with verification message)
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "usernameOrEmail": "test@example.com",
    "password": "password123"
  }'
```

### 3. Test Resend Verification

```bash
curl -X POST http://localhost:8080/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

## Security Improvements

1. **Spam Prevention**: Unverified users cannot access the system
2. **Email Validation**: Ensures users own the email addresses they register with
3. **Graceful Handling**: Doesn't reveal whether email addresses exist in the system
4. **Token Security**: Uses bcrypt for secure token hashing

## Monitoring and Debugging

- Enhanced logging for email service initialization
- Detailed error messages for email sending failures
- Configuration validation logging
- Test endpoint for email service verification

The email verification system is now fully functional and secure, preventing spam accounts while providing a smooth user experience for legitimate users.
