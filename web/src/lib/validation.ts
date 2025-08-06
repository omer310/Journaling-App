import { sanitizeInput, validateInput } from './security';

// Validation constants
export const VALIDATION_LIMITS = {
  TITLE_MAX_LENGTH: 200,
  CONTENT_MAX_LENGTH: 50000, // 50KB limit
  TAG_MAX_LENGTH: 50,
  MAX_TAGS_PER_ENTRY: 10,
  SEARCH_QUERY_MAX_LENGTH: 100,
  USERNAME_MAX_LENGTH: 50,
  DESCRIPTION_MAX_LENGTH: 500,
} as const;

// Content type patterns
export const CONTENT_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL: /^https?:\/\/[^\s/$.?#].[^\s]*$/i,
  DATE: /^\d{4}-\d{2}-\d{2}$/,
  TIME: /^\d{2}:\d{2}(:\d{2})?$/,
  HEX_COLOR: /^#[0-9A-Fa-f]{6}$/,
  ALPHANUMERIC: /^[a-zA-Z0-9\s]+$/,
} as const;

// Validation error types
export type ValidationError = {
  field: string;
  message: string;
  code: string;
};

export type ValidationResult = {
  isValid: boolean;
  errors: ValidationError[];
  sanitizedData?: any;
  metadata?: {
    strength?: any;
  };
};

/**
 * Validate journal entry title
 */
export function validateTitle(title: string): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!title || typeof title !== 'string') {
    errors.push({
      field: 'title',
      message: 'Title is required',
      code: 'REQUIRED'
    });
    return { isValid: false, errors };
  }
  
  const sanitizedTitle = sanitizeInput(title.trim());
  
  if (sanitizedTitle.length === 0) {
    errors.push({
      field: 'title',
      message: 'Title cannot be empty',
      code: 'EMPTY'
    });
  } else if (sanitizedTitle.length > VALIDATION_LIMITS.TITLE_MAX_LENGTH) {
    errors.push({
      field: 'title',
      message: `Title must be ${VALIDATION_LIMITS.TITLE_MAX_LENGTH} characters or less`,
      code: 'TOO_LONG'
    });
  } else if (!validateInput(sanitizedTitle)) {
    errors.push({
      field: 'title',
      message: 'Title contains invalid characters',
      code: 'INVALID_CHARS'
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: sanitizedTitle
  };
}

/**
 * Validate journal entry content
 */
export function validateContent(content: string): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!content || typeof content !== 'string') {
    errors.push({
      field: 'content',
      message: 'Content is required',
      code: 'REQUIRED'
    });
    return { isValid: false, errors };
  }
  
  const sanitizedContent = sanitizeInput(content.trim());
  
  if (sanitizedContent.length === 0) {
    errors.push({
      field: 'content',
      message: 'Content cannot be empty',
      code: 'EMPTY'
    });
  } else if (sanitizedContent.length > VALIDATION_LIMITS.CONTENT_MAX_LENGTH) {
    errors.push({
      field: 'content',
      message: `Content must be ${VALIDATION_LIMITS.CONTENT_MAX_LENGTH} characters or less`,
      code: 'TOO_LONG'
    });
  } else if (!validateInput(sanitizedContent)) {
    errors.push({
      field: 'content',
      message: 'Content contains invalid characters',
      code: 'INVALID_CHARS'
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: sanitizedContent
  };
}

/**
 * Validate tags array
 */
export function validateTags(tags: string[]): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!Array.isArray(tags)) {
    errors.push({
      field: 'tags',
      message: 'Tags must be an array',
      code: 'INVALID_TYPE'
    });
    return { isValid: false, errors };
  }
  
  if (tags.length > VALIDATION_LIMITS.MAX_TAGS_PER_ENTRY) {
    errors.push({
      field: 'tags',
      message: `Maximum ${VALIDATION_LIMITS.MAX_TAGS_PER_ENTRY} tags allowed`,
      code: 'TOO_MANY'
    });
  }
  
  const sanitizedTags: string[] = [];
  
  for (let i = 0; i < tags.length; i++) {
    const tag = tags[i];
    
    if (typeof tag !== 'string') {
      errors.push({
        field: `tags[${i}]`,
        message: 'Tag must be a string',
        code: 'INVALID_TYPE'
      });
      continue;
    }
    
    const sanitizedTag = sanitizeInput(tag.trim());
    
    if (sanitizedTag.length === 0) {
      errors.push({
        field: `tags[${i}]`,
        message: 'Tag cannot be empty',
        code: 'EMPTY'
      });
    } else if (sanitizedTag.length > VALIDATION_LIMITS.TAG_MAX_LENGTH) {
      errors.push({
        field: `tags[${i}]`,
        message: `Tag must be ${VALIDATION_LIMITS.TAG_MAX_LENGTH} characters or less`,
        code: 'TOO_LONG'
      });
    } else if (!validateInput(sanitizedTag)) {
      errors.push({
        field: `tags[${i}]`,
        message: 'Tag contains invalid characters',
        code: 'INVALID_CHARS'
      });
    } else {
      sanitizedTags.push(sanitizedTag);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: sanitizedTags
  };
}

/**
 * Validate search query
 */
export function validateSearchQuery(query: string): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!query || typeof query !== 'string') {
    return { isValid: false, errors: [{
      field: 'query',
      message: 'Search query is required',
      code: 'REQUIRED'
    }] };
  }
  
  const sanitizedQuery = sanitizeInput(query.trim());
  
  if (sanitizedQuery.length === 0) {
    errors.push({
      field: 'query',
      message: 'Search query cannot be empty',
      code: 'EMPTY'
    });
  } else if (sanitizedQuery.length > VALIDATION_LIMITS.SEARCH_QUERY_MAX_LENGTH) {
    errors.push({
      field: 'query',
      message: `Search query must be ${VALIDATION_LIMITS.SEARCH_QUERY_MAX_LENGTH} characters or less`,
      code: 'TOO_LONG'
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: sanitizedQuery
  };
}

/**
 * Validate complete journal entry
 */
export function validateJournalEntry(entry: {
  title: string;
  content: string;
  tags?: string[];
  mood?: string;
  date?: string;
}): ValidationResult {
  const errors: ValidationError[] = [];
  const sanitizedData: any = {};
  
  // Validate title
  const titleValidation = validateTitle(entry.title);
  if (!titleValidation.isValid) {
    errors.push(...titleValidation.errors);
  } else {
    sanitizedData.title = titleValidation.sanitizedData;
  }
  
  // Validate content
  const contentValidation = validateContent(entry.content);
  if (!contentValidation.isValid) {
    errors.push(...contentValidation.errors);
  } else {
    sanitizedData.content = contentValidation.sanitizedData;
  }
  
  // Validate tags
  if (entry.tags) {
    const tagsValidation = validateTags(entry.tags);
    if (!tagsValidation.isValid) {
      errors.push(...tagsValidation.errors);
    } else {
      sanitizedData.tags = tagsValidation.sanitizedData;
    }
  }
  
  // Validate mood
  if (entry.mood) {
    const validMoods = ['happy', 'neutral', 'sad'];
    if (!validMoods.includes(entry.mood)) {
      errors.push({
        field: 'mood',
        message: 'Invalid mood value',
        code: 'INVALID_VALUE'
      });
    } else {
      sanitizedData.mood = entry.mood;
    }
  }
  
  // Validate date
  if (entry.date) {
    if (!CONTENT_PATTERNS.DATE.test(entry.date)) {
      errors.push({
        field: 'date',
        message: 'Invalid date format (YYYY-MM-DD)',
        code: 'INVALID_FORMAT'
      });
    } else {
      sanitizedData.date = entry.date;
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: errors.length === 0 ? sanitizedData : undefined
  };
}

/**
 * Validate email address
 */
export function validateEmail(email: string): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!email || typeof email !== 'string') {
    errors.push({
      field: 'email',
      message: 'Email is required',
      code: 'REQUIRED'
    });
    return { isValid: false, errors };
  }
  
  const sanitizedEmail = sanitizeInput(email.trim().toLowerCase());
  
  if (sanitizedEmail.length === 0) {
    errors.push({
      field: 'email',
      message: 'Email cannot be empty',
      code: 'EMPTY'
    });
  } else if (!CONTENT_PATTERNS.EMAIL.test(sanitizedEmail)) {
    errors.push({
      field: 'email',
      message: 'Invalid email format',
      code: 'INVALID_FORMAT'
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: sanitizedEmail
  };
}

import { validatePasswordStrength, DEFAULT_PASSWORD_REQUIREMENTS } from './passwordStrength';

/**
 * Validate password strength with enhanced security checks
 */
export function validatePassword(password: string, userInfo?: { email?: string; name?: string; username?: string }): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!password || typeof password !== 'string') {
    errors.push({
      field: 'password',
      message: 'Password is required',
      code: 'REQUIRED'
    });
    return { isValid: false, errors };
  }
  
  // Use enhanced password strength validation
  const strengthResult = validatePasswordStrength(password, userInfo, DEFAULT_PASSWORD_REQUIREMENTS);
  
  // Convert strength feedback to validation errors
  strengthResult.feedback.forEach(message => {
    errors.push({
      field: 'password',
      message,
      code: 'WEAK_PASSWORD'
    });
  });
  
  // Add specific error codes for common issues
  if (password.length < DEFAULT_PASSWORD_REQUIREMENTS.minLength) {
    errors.push({
      field: 'password',
      message: `Password must be at least ${DEFAULT_PASSWORD_REQUIREMENTS.minLength} characters long`,
      code: 'TOO_SHORT'
    });
  }
  
  if (password.length > DEFAULT_PASSWORD_REQUIREMENTS.maxLength) {
    errors.push({
      field: 'password',
      message: `Password must be ${DEFAULT_PASSWORD_REQUIREMENTS.maxLength} characters or less`,
      code: 'TOO_LONG'
    });
  }
  
  if (DEFAULT_PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push({
      field: 'password',
      message: 'Password must contain at least one uppercase letter',
      code: 'MISSING_UPPERCASE'
    });
  }
  
  if (DEFAULT_PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push({
      field: 'password',
      message: 'Password must contain at least one lowercase letter',
      code: 'MISSING_LOWERCASE'
    });
  }
  
  if (DEFAULT_PASSWORD_REQUIREMENTS.requireNumbers && !/\d/.test(password)) {
    errors.push({
      field: 'password',
      message: 'Password must contain at least one number',
      code: 'MISSING_NUMBER'
    });
  }
  
  if (DEFAULT_PASSWORD_REQUIREMENTS.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push({
      field: 'password',
      message: 'Password must contain at least one special character',
      code: 'MISSING_SPECIAL_CHAR'
    });
  }
  
  if (strengthResult.isCommon) {
    errors.push({
      field: 'password',
      message: 'This password is too common. Please choose a more unique password.',
      code: 'COMMON_PASSWORD'
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: password,
    // Include strength information for UI feedback
    metadata: {
      strength: strengthResult
    }
  };
} 