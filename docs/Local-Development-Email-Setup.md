# Local Development Email Setup

## Problem

When developing locally, verification emails don't arrive in Gmail because:

- Gmail's anti-phishing filters block verification links from new domains
- Test emails work fine, but registration/verification emails get filtered

## Solutions for Local Development

### Option 1: Email Testing Services (Recommended)

#### Mailtrap (Free, Best for Development)

1. Sign up at [mailtrap.io](https://mailtrap.io) (free account)
2. Create a new inbox
3. Update your `.env` file:

```bash
# For development only
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=your_mailtrap_username
SMTP_PASS=your_mailtrap_password
EMAIL_FROM=Measura <noreply@measura.local>
FRONTEND_URL=http://localhost:3000
```

#### Ethereal Email (Temporary Testing)

1. Go to [ethereal.email](https://ethereal.email)
2. Click "Create Ethereal Account" (generates temporary credentials)
3. Use the provided SMTP settings in your `.env`

### Option 2: Console Email Output (Development Only)

Add this to your email service for development:

```typescript
// In development, also log email content
if (process.env.NODE_ENV === 'development') {
  console.log('=== EMAIL CONTENT ===');
  console.log('To:', to);
  console.log('Subject:', subject);
  console.log('HTML:', html);
  console.log('====================');
}
```

### Option 3: Real Gmail Delivery (Advanced)

To get verification emails in Gmail during development:

1. **Add measura.xyz to Gmail contacts**
2. **Check All Mail section** (not just Inbox)
3. **Search for**: `from:contact@measura.xyz`
4. **Wait 24-48 hours** for domain reputation to improve
5. **Mark as "Not Spam"** if found in spam folder

## Current Status

- ✅ Email service is working correctly
- ✅ Test emails arrive in Gmail
- ❌ Verification emails filtered by Gmail (anti-phishing)
- ✅ All emails sent successfully from application

## Recommendation

**Use Mailtrap for local development** - it shows you exactly how your emails look and allows you to test the complete verification flow without Gmail's restrictions.

## Production Notes

Your current production setup with `contact@measura.xyz` and Brevo is correct and will work fine in production where:

- Domain reputation builds over time
- Users expect and whitelist verification emails
- Email volume helps with deliverability
