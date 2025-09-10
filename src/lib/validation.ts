// Comprehensive validation utilities for forms and data

export interface ValidationRule<T = any> {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  min?: number
  max?: number
  custom?: (value: T) => string | null
  message?: string
}

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

export interface FieldValidationResult {
  isValid: boolean
  error: string | null
}

// Common validation patterns
export const VALIDATION_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\+]?[1-9][\d]{0,15}$/,
  phoneUS: /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  name: /^[a-zA-Z\s\-'\.]+$/,
  address: /^[a-zA-Z0-9\s\-\.,#\/]+$/,
  price: /^\d+(\.\d{1,2})?$/
}

// Common validation messages
export const VALIDATION_MESSAGES = {
  required: 'This field is required',
  email: 'Please enter a valid email address',
  phone: 'Please enter a valid phone number',
  minLength: (min: number) => `Must be at least ${min} characters long`,
  maxLength: (max: number) => `Must be no more than ${max} characters long`,
  min: (min: number) => `Must be at least ${min}`,
  max: (max: number) => `Must be no more than ${max}`,
  pattern: 'Please enter a valid format',
  futureDate: 'Date must be in the future',
  pastDate: 'Date must be in the past',
  positiveNumber: 'Must be a positive number',
  integer: 'Must be a whole number'
}

// Validate a single field
export function validateField<T>(
  value: T,
  rules: ValidationRule<T>,
  fieldName: string = 'field'
): FieldValidationResult {
  // Handle null/undefined values
  if (value === null || value === undefined || value === '') {
    if (rules.required) {
      return {
        isValid: false,
        error: rules.message || VALIDATION_MESSAGES.required
      }
    }
    return { isValid: true, error: null }
  }

  const stringValue = String(value).trim()

  // Required validation
  if (rules.required && (!stringValue || stringValue.length === 0)) {
    return {
      isValid: false,
      error: rules.message || VALIDATION_MESSAGES.required
    }
  }

  // Length validations
  if (rules.minLength && stringValue.length < rules.minLength) {
    return {
      isValid: false,
      error: rules.message || VALIDATION_MESSAGES.minLength(rules.minLength)
    }
  }

  if (rules.maxLength && stringValue.length > rules.maxLength) {
    return {
      isValid: false,
      error: rules.message || VALIDATION_MESSAGES.maxLength(rules.maxLength)
    }
  }

  // Numeric validations
  if (typeof value === 'number' || !isNaN(Number(stringValue))) {
    const numValue = Number(stringValue)
    
    if (rules.min !== undefined && numValue < rules.min) {
      return {
        isValid: false,
        error: rules.message || VALIDATION_MESSAGES.min(rules.min)
      }
    }

    if (rules.max !== undefined && numValue > rules.max) {
      return {
        isValid: false,
        error: rules.message || VALIDATION_MESSAGES.max(rules.max)
      }
    }
  }

  // Pattern validation
  if (rules.pattern && !rules.pattern.test(stringValue)) {
    return {
      isValid: false,
      error: rules.message || VALIDATION_MESSAGES.pattern
    }
  }

  // Custom validation
  if (rules.custom) {
    const customError = rules.custom(value)
    if (customError) {
      return {
        isValid: false,
        error: customError
      }
    }
  }

  return { isValid: true, error: null }
}

// Validate multiple fields
export function validateForm<T extends Record<string, any>>(
  data: T,
  rules: Record<keyof T, ValidationRule>
): ValidationResult {
  const errors: Record<string, string> = {}
  let isValid = true

  for (const [fieldName, fieldRules] of Object.entries(rules)) {
    const fieldValue = data[fieldName as keyof T]
    const result = validateField(fieldValue, fieldRules, fieldName)
    
    if (!result.isValid) {
      errors[fieldName] = result.error!
      isValid = false
    }
  }

  return { isValid, errors }
}

// Specific validation functions
export function validateEmail(email: string): FieldValidationResult {
  return validateField(email, {
    required: true,
    pattern: VALIDATION_PATTERNS.email,
    message: VALIDATION_MESSAGES.email
  })
}

export function validatePhone(phone: string): FieldValidationResult {
  return validateField(phone, {
    required: true,
    pattern: VALIDATION_PATTERNS.phoneUS,
    message: VALIDATION_MESSAGES.phone
  })
}

export function validateName(name: string): FieldValidationResult {
  return validateField(name, {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: VALIDATION_PATTERNS.name,
    message: 'Please enter a valid name'
  })
}

export function validateAddress(address: string): FieldValidationResult {
  return validateField(address, {
    required: true,
    minLength: 10,
    maxLength: 200,
    pattern: VALIDATION_PATTERNS.address,
    message: 'Please enter a valid address'
  })
}

export function validatePrice(price: string | number): FieldValidationResult {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price
  return validateField(numPrice, {
    required: true,
    min: 0.01,
    max: 999999.99,
    custom: (value) => {
      if (isNaN(value)) return 'Please enter a valid price'
      if (value <= 0) return VALIDATION_MESSAGES.positiveNumber
      return null
    }
  })
}

export function validateQuantity(quantity: string | number): FieldValidationResult {
  const numQuantity = typeof quantity === 'string' ? parseInt(quantity) : quantity
  return validateField(numQuantity, {
    required: true,
    min: 1,
    max: 1000,
    custom: (value) => {
      if (isNaN(value)) return 'Please enter a valid quantity'
      if (!Number.isInteger(value)) return VALIDATION_MESSAGES.integer
      if (value <= 0) return VALIDATION_MESSAGES.positiveNumber
      return null
    }
  })
}

export function validateFutureDate(date: string): FieldValidationResult {
  return validateField(date, {
    required: true,
    custom: (value) => {
      const inputDate = new Date(value)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (isNaN(inputDate.getTime())) {
        return 'Please enter a valid date'
      }
      
      if (inputDate < today) {
        return VALIDATION_MESSAGES.futureDate
      }
      
      return null
    }
  })
}

// Form validation schemas
export const CUSTOMER_REQUEST_SCHEMA = {
  customer_name: {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: VALIDATION_PATTERNS.name,
    message: 'Please enter your full name'
  },
  customer_email: {
    required: true,
    pattern: VALIDATION_PATTERNS.email,
    message: VALIDATION_MESSAGES.email
  },
  customer_phone: {
    required: true,
    pattern: VALIDATION_PATTERNS.phoneUS,
    message: VALIDATION_MESSAGES.phone
  },
  pickup_address: {
    required: true,
    minLength: 10,
    maxLength: 200,
    pattern: VALIDATION_PATTERNS.address,
    message: 'Please enter a complete address'
  },
  pickup_date: {
    required: true,
    custom: (value: string) => {
      const inputDate = new Date(value)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (isNaN(inputDate.getTime())) {
        return 'Please select a valid date'
      }
      
      if (inputDate < today) {
        return 'Pickup date must be today or in the future'
      }
      
      // Check if date is too far in the future (e.g., 1 year)
      const oneYearFromNow = new Date()
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)
      
      if (inputDate > oneYearFromNow) {
        return 'Pickup date cannot be more than 1 year in the future'
      }
      
      return null
    }
  },
  pickup_time_slot: {
    required: true,
    message: 'Please select a pickup time slot'
  },
  special_instructions: {
    maxLength: 500,
    message: 'Special instructions cannot exceed 500 characters'
  }
}

export const SERVICE_SCHEMA = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: VALIDATION_PATTERNS.name,
    message: 'Please enter a service name'
  },
  description: {
    maxLength: 500,
    message: 'Description cannot exceed 500 characters'
  },
  price_per_item: {
    custom: (value: any) => {
      if (value === null || value === undefined || value === '') {
        return null // Optional field
      }
      return validatePrice(value).error
    }
  },
  price_per_pound: {
    custom: (value: any) => {
      if (value === null || value === undefined || value === '') {
        return null // Optional field
      }
      return validatePrice(value).error
    }
  }
}

// Sanitization functions
export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, '')
}

export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function sanitizePhone(phone: string): string {
  return phone.replace(/[^\d\-\(\)\s\+]/g, '')
}

export function sanitizeAddress(address: string): string {
  return address.trim().replace(/[<>]/g, '')
}

// Validation helpers for common use cases
export function validateFormData<T extends Record<string, any>>(
  data: T,
  schema: Record<keyof T, ValidationRule>
): { isValid: boolean; errors: Record<string, string>; sanitizedData: T } {
  const validation = validateForm(data, schema)
  
  // Sanitize the data
  const sanitizedData = { ...data }
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      switch (key) {
        case 'customer_email':
          sanitizedData[key as keyof T] = sanitizeEmail(value) as T[keyof T]
          break
        case 'customer_phone':
          sanitizedData[key as keyof T] = sanitizePhone(value) as T[keyof T]
          break
        case 'pickup_address':
          sanitizedData[key as keyof T] = sanitizeAddress(value) as T[keyof T]
          break
        default:
          sanitizedData[key as keyof T] = sanitizeString(value) as T[keyof T]
      }
    }
  }
  
  return {
    isValid: validation.isValid,
    errors: validation.errors,
    sanitizedData
  }
}
