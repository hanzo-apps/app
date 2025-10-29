import { z, ZodError, ZodSchema } from 'zod';
import { NextRequest } from 'next/server';

// Common validation schemas
export const schemas = {
  // Authentication schemas
  login: z.object({
    code: z.string().min(1, 'Authorization code is required'),
    state: z.string().optional(),
  }),

  // User data schemas
  userId: z.string().uuid('Invalid user ID format'),

  email: z.string().email('Invalid email format'),

  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),

  // Project schemas
  projectId: z.string().regex(/^[a-z0-9-]+$/, 'Invalid project ID format'),

  projectName: z
    .string()
    .min(1, 'Project name is required')
    .max(100, 'Project name is too long')
    .regex(/^[a-zA-Z0-9\s_-]+$/, 'Project name contains invalid characters'),

  // File paths and names
  filePath: z
    .string()
    .regex(/^[a-zA-Z0-9/_.-]+$/, 'Invalid file path')
    .refine((path) => !path.includes('..'), 'Path traversal detected'),

  // API request schemas
  pagination: z.object({
    page: z.number().int().positive().default(1),
    limit: z.number().int().min(1).max(100).default(20),
    sort: z.enum(['asc', 'desc']).default('desc'),
  }),

  // Payment schemas
  stripeCustomerId: z.string().startsWith('cus_', 'Invalid Stripe customer ID'),

  stripePaymentIntentId: z.string().startsWith('pi_', 'Invalid payment intent ID'),

  // AI/LLM schemas
  aiPrompt: z
    .string()
    .min(1, 'Prompt is required')
    .max(10000, 'Prompt is too long')
    .transform((val) => sanitizeInput(val)),

  modelName: z.enum([
    'gpt-4',
    'gpt-4-turbo',
    'gpt-3.5-turbo',
    'claude-3-opus',
    'claude-3-sonnet',
    'claude-3-haiku',
    'llama-3',
    'mixtral',
  ]),

  // URL validation
  url: z.string().url('Invalid URL format').refine((url) => {
    const parsed = new URL(url);
    // Only allow HTTP(S) protocols
    return ['http:', 'https:'].includes(parsed.protocol);
  }, 'Only HTTP(S) URLs are allowed'),

  // Image upload validation
  imageUpload: z.object({
    filename: z.string().regex(/^[a-zA-Z0-9._-]+\.(jpg|jpeg|png|gif|webp)$/i, 'Invalid image filename'),
    size: z.number().max(10 * 1024 * 1024, 'Image size must be less than 10MB'),
    mimeType: z.enum(['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  }),
};

// HTML sanitization function
export function sanitizeInput(input: string): string {
  // Basic HTML entity encoding
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// SQL injection prevention
export function sanitizeSQLInput(input: string): string {
  // Remove or escape potentially dangerous SQL characters
  return input
    .replace(/['";\\]/g, '') // Remove quotes and backslashes
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove multi-line comment start
    .replace(/\*\//g, '') // Remove multi-line comment end
    .replace(/xp_/gi, '') // Remove extended stored procedures
    .replace(/sp_/gi, '') // Remove system stored procedures
    .trim();
}

// NoSQL injection prevention for MongoDB
export function sanitizeMongoInput(input: any): any {
  if (typeof input === 'string') {
    // Remove MongoDB operators
    return input.replace(/[$]/g, '');
  }

  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const key in input) {
      // Skip keys that start with $ (MongoDB operators)
      if (!key.startsWith('$')) {
        sanitized[key] = sanitizeMongoInput(input[key]);
      }
    }
    return sanitized;
  }

  return input;
}

// Validation middleware
export async function validateRequest<T>(
  data: unknown,
  schema: ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; errors: string[] }> {
  try {
    const validated = await schema.parseAsync(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = error.issues.map((err) => `${err.path.join('.')}: ${err.message}`);
      return { success: false, errors };
    }
    return { success: false, errors: ['Validation failed'] };
  }
}

// Request body validation helper
export async function validateBody<T>(
  req: NextRequest,
  schema: ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; errors: string[] }> {
  try {
    const body = await req.json();
    return validateRequest(body, schema);
  } catch (error) {
    return { success: false, errors: ['Invalid JSON body'] };
  }
}

// Query parameters validation helper
export function validateQuery<T>(
  searchParams: URLSearchParams,
  schema: ZodSchema<T>
): { success: true; data: T } | { success: false; errors: string[] } {
  const params: Record<string, any> = {};

  for (const [key, value] of searchParams.entries()) {
    // Handle array parameters (e.g., ?ids=1&ids=2)
    if (params[key]) {
      if (!Array.isArray(params[key])) {
        params[key] = [params[key]];
      }
      params[key].push(value);
    } else {
      params[key] = value;
    }
  }

  try {
    const validated = schema.parse(params);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = error.issues.map((err) => `${err.path.join('.')}: ${err.message}`);
      return { success: false, errors };
    }
    return { success: false, errors: ['Query validation failed'] };
  }
}

// File upload validation
export function validateFileUpload(file: {
  name: string;
  size: number;
  type: string;
}): { valid: boolean; error?: string } {
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.txt', '.md'];
  const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'text/markdown',
  ];

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size exceeds 10MB limit' };
  }

  // Check file extension
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return { valid: false, error: `File type ${extension} is not allowed` };
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: `MIME type ${file.type} is not allowed` };
  }

  // Check for potential path traversal in filename
  if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
    return { valid: false, error: 'Invalid filename' };
  }

  return { valid: true };
}

// CSRF token validation
export function validateCSRFToken(token: string | null, sessionToken: string): boolean {
  if (!token || !sessionToken) {
    return false;
  }

  // Compare tokens using constant-time comparison to prevent timing attacks
  if (token.length !== sessionToken.length) {
    return false;
  }

  let valid = true;
  for (let i = 0; i < token.length; i++) {
    if (token[i] !== sessionToken[i]) {
      valid = false;
    }
  }

  return valid;
}

// Export validation middleware for use in API routes
export const validation = {
  schemas,
  sanitizeInput,
  sanitizeSQLInput,
  sanitizeMongoInput,
  validateRequest,
  validateBody,
  validateQuery,
  validateFileUpload,
  validateCSRFToken,
};