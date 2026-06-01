/**
 * Secrets - Built-in Skill
 * Guide for managing API keys and sensitive configuration
 */

export const SECRETS_SKILL = String.raw`---
name: server-secrets
description: Server Mode - Encrypted secrets (API keys, tokens) for edge functions.
---

# Secrets Management

## Purpose
Guide for creating, managing, and using secrets (API keys, tokens, sensitive config).

---

## How Secrets Work

1. **AI creates placeholder** - JSON file with name and description
2. **User sets value** - In Server Settings > Secrets
3. **Edge functions access** - Via ` + "`secrets.get('SECRET_NAME')`" + `

Values are encrypted at rest and never exposed to the AI.

---

## File Location

` + "```" + `
/.server/secrets/{SECRET_NAME}.json
` + "```" + `

Secret names must be **SCREAMING_SNAKE_CASE**.

---

## JSON Format

` + "```" + `json
{
  "name": "SECRET_NAME",
  "description": "What this secret is for"
}
` + "```" + `

---

## Creating Secrets

### Via Shell Command

` + "```" + `bash
# Hanzo Commerce API key
echo '{"name":"HANZO_COMMERCE_API_KEY","description":"Hanzo Commerce API key for payment processing"}' > /.server/secrets/HANZO_COMMERCE_API_KEY.json

# SendGrid for email
echo '{"name":"SENDGRID_KEY","description":"SendGrid API key for sending emails"}' > /.server/secrets/SENDGRID_KEY.json

# OpenAI API key
echo '{"name":"OPENAI_API_KEY","description":"OpenAI API key for AI features"}' > /.server/secrets/OPENAI_API_KEY.json

# Database connection (external)
echo '{"name":"EXTERNAL_DB_URL","description":"Connection string for external PostgreSQL database"}' > /.server/secrets/EXTERNAL_DB_URL.json

# Webhook secret
echo '{"name":"WEBHOOK_SECRET","description":"Secret for verifying incoming webhooks"}' > /.server/secrets/WEBHOOK_SECRET.json
` + "```" + `

---

## Using Secrets in Edge Functions

### Basic Usage

` + "```" + `javascript
const apiKey = secrets.get('HANZO_COMMERCE_API_KEY');
if (!apiKey) {
  Response.error('Commerce not configured. Set the secret in Server Settings.', 500);
  return;
}

// Use the secret
const response = await fetch('https://api.hanzo.ai/v1/checkout/charge', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + apiKey,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ amount: 1000, currency: 'usd' })
});
` + "```" + `

### Check If Secret Exists

` + "```" + `javascript
if (secrets.has('OPTIONAL_FEATURE_KEY')) {
  // Feature is configured
  const key = secrets.get('OPTIONAL_FEATURE_KEY');
  // Use it...
} else {
  // Feature not configured, use fallback
}
` + "```" + `

---

## Common Secret Patterns

### Payment Processing (Hanzo Commerce)

` + "```" + `bash
echo '{"name":"HANZO_COMMERCE_API_KEY","description":"Hanzo Commerce API key"}' > /.server/secrets/HANZO_COMMERCE_API_KEY.json
echo '{"name":"HANZO_COMMERCE_WEBHOOK_SECRET","description":"Hanzo Commerce webhook signing secret"}' > /.server/secrets/HANZO_COMMERCE_WEBHOOK_SECRET.json
` + "```" + `

### Email Services

` + "```" + `bash
# SendGrid
echo '{"name":"SENDGRID_KEY","description":"SendGrid API key"}' > /.server/secrets/SENDGRID_KEY.json

# Mailgun
echo '{"name":"MAILGUN_API_KEY","description":"Mailgun API key"}' > /.server/secrets/MAILGUN_API_KEY.json
echo '{"name":"MAILGUN_DOMAIN","description":"Mailgun sending domain"}' > /.server/secrets/MAILGUN_DOMAIN.json

# Resend
echo '{"name":"RESEND_API_KEY","description":"Resend API key"}' > /.server/secrets/RESEND_API_KEY.json
` + "```" + `

### AI/ML Services

` + "```" + `bash
echo '{"name":"OPENAI_API_KEY","description":"OpenAI API key for GPT"}' > /.server/secrets/OPENAI_API_KEY.json
echo '{"name":"ANTHROPIC_API_KEY","description":"Anthropic API key for Claude"}' > /.server/secrets/ANTHROPIC_API_KEY.json
` + "```" + `

### OAuth/Social Login

` + "```" + `bash
echo '{"name":"GOOGLE_CLIENT_ID","description":"Google OAuth client ID"}' > /.server/secrets/GOOGLE_CLIENT_ID.json
echo '{"name":"GOOGLE_CLIENT_SECRET","description":"Google OAuth client secret"}' > /.server/secrets/GOOGLE_CLIENT_SECRET.json
echo '{"name":"GITHUB_CLIENT_ID","description":"GitHub OAuth client ID"}' > /.server/secrets/GITHUB_CLIENT_ID.json
echo '{"name":"GITHUB_CLIENT_SECRET","description":"GitHub OAuth client secret"}' > /.server/secrets/GITHUB_CLIENT_SECRET.json
` + "```" + `

### External Databases

` + "```" + `bash
echo '{"name":"SUPABASE_URL","description":"Supabase project URL"}' > /.server/secrets/SUPABASE_URL.json
echo '{"name":"SUPABASE_KEY","description":"Supabase anon/service key"}' > /.server/secrets/SUPABASE_KEY.json
echo '{"name":"MONGODB_URI","description":"MongoDB connection string"}' > /.server/secrets/MONGODB_URI.json
` + "```" + `

---

## Example: Complete Payment Flow

### 1. Create Secrets

` + "```" + `bash
echo '{"name":"HANZO_COMMERCE_API_KEY","description":"Hanzo Commerce API key"}' > /.server/secrets/HANZO_COMMERCE_API_KEY.json
` + "```" + `

### 2. Create Edge Function

` + "```" + `json
{
  "name": "create-checkout",
  "method": "POST",
  "enabled": true,
  "code": "const commerceKey = secrets.get('HANZO_COMMERCE_API_KEY');\nif (!commerceKey) { Response.error('Commerce not configured', 500); return; }\n\nconst { planId, successUrl, cancelUrl } = request.body;\nif (!planId) { Response.error('planId required', 400); return; }\n\nconst res = await fetch('https://api.hanzo.ai/v1/checkout/charge', {\n  method: 'POST',\n  headers: {\n    'Authorization': 'Bearer ' + commerceKey,\n    'Content-Type': 'application/json'\n  },\n  body: JSON.stringify({\n    planId,\n    mode: 'payment',\n    successUrl: successUrl || 'https://example.com/success',\n    cancelUrl: cancelUrl || 'https://example.com/cancel',\n    paymentMethod: { type: 'card' }\n  })\n});\n\nconst session = await res.json();\nif (!res.ok) { Response.error(session.error || 'Commerce error', 400); return; }\nResponse.json({ url: session.url });"
}
` + "```" + `

### 3. User Sets Value

User goes to **Server Settings > Secrets** and enters their Hanzo Commerce API key.

---

## Example: Email with SendGrid

### 1. Create Secret

` + "```" + `bash
echo '{"name":"SENDGRID_KEY","description":"SendGrid API key"}' > /.server/secrets/SENDGRID_KEY.json
` + "```" + `

### 2. Create Edge Function

` + "```" + `json
{
  "name": "send-email",
  "method": "POST",
  "enabled": true,
  "code": "const apiKey = secrets.get('SENDGRID_KEY');\nif (!apiKey) { Response.error('Email not configured', 500); return; }\n\nconst { to, subject, body } = request.body;\nif (!to || !subject) { Response.error('to and subject required', 400); return; }\n\nconst res = await fetch('https://api.sendgrid.com/v3/mail/send', {\n  method: 'POST',\n  headers: {\n    'Authorization': 'Bearer ' + apiKey,\n    'Content-Type': 'application/json'\n  },\n  body: JSON.stringify({\n    personalizations: [{ to: [{ email: to }] }],\n    from: { email: 'noreply@example.com' },\n    subject,\n    content: [{ type: 'text/plain', value: body || '' }]\n  })\n});\n\nif (!res.ok) {\n  const err = await res.text();\n  Response.error('Failed to send: ' + err, 500);\n  return;\n}\nResponse.json({ sent: true });"
}
` + "```" + `

---

## Security Best Practices

### Always Check Secrets Exist

` + "```" + `javascript
// WRONG - may be undefined
const key = secrets.get('API_KEY');
await fetch(url, { headers: { 'Authorization': key } });

// CORRECT - validate first
const key = secrets.get('API_KEY');
if (!key) {
  Response.error('API key not configured', 500);
  return;
}
await fetch(url, { headers: { 'Authorization': key } });
` + "```" + `

### Never Log Secrets

` + "```" + `javascript
// WRONG - exposes secret in logs
const key = secrets.get('API_KEY');
console.log('Using key:', key);

// CORRECT - log without value
const key = secrets.get('API_KEY');
console.log('API key configured:', !!key);
` + "```" + `

### Don't Return Secrets in Responses

` + "```" + `javascript
// WRONG - exposes secret
Response.json({ apiKey: secrets.get('API_KEY') });

// CORRECT - only return non-sensitive data
Response.json({ configured: secrets.has('API_KEY') });
` + "```" + `

---

## Naming Conventions

| Good | Bad |
|------|-----|
| ` + "`HANZO_COMMERCE_API_KEY`" + ` | ` + "`commerceApiKey`" + ` |
| ` + "`SENDGRID_KEY`" + ` | ` + "`sendgrid-key`" + ` |
| ` + "`OPENAI_API_KEY`" + ` | ` + "`OpenAI_Key`" + ` |
| ` + "`WEBHOOK_SECRET`" + ` | ` + "`webhooksecret`" + ` |

Use SCREAMING_SNAKE_CASE for all secret names.
`;
