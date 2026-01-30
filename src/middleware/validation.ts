import { body, param, ValidationChain } from 'express-validator';

/**
 * Validation rules for authentication routes
 */
export const registerValidation: ValidationChain[] = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Email non valida')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('La password deve essere almeno 8 caratteri')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La password deve contenere almeno una maiuscola, una minuscola e un numero'),
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('Nome è richiesto')
    .isLength({ min: 2, max: 50 })
    .withMessage('Il nome deve essere tra 2 e 50 caratteri')
    .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/)
    .withMessage('Il nome contiene caratteri non validi'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Cognome è richiesto')
    .isLength({ min: 2, max: 50 })
    .withMessage('Il cognome deve essere tra 2 e 50 caratteri')
    .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/)
    .withMessage('Il cognome contiene caratteri non validi'),
  body('gender')
    .isIn(['male', 'female'])
    .withMessage('Genere deve essere male o female')
];

export const loginValidation: ValidationChain[] = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Email non valida')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password è richiesta')
];

export const forgotPasswordValidation: ValidationChain[] = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Email non valida')
    .normalizeEmail()
];

export const resetPasswordValidation: ValidationChain[] = [
  param('token')
    .notEmpty()
    .withMessage('Token è richiesto'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('La password deve essere almeno 8 caratteri')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La password deve contenere almeno una maiuscola, una minuscola e un numero')
];

export const resendVerificationValidation: ValidationChain[] = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Email non valida')
    .normalizeEmail()
];

/**
 * Validation rules for availability routes
 */
export const submitAvailabilityValidation: ValidationChain[] = [
  body('availabilities')
    .isArray({ min: 1 })
    .withMessage('Almeno una disponibilità è richiesta'),
  body('availabilities.*.shift.day')
    .isIn(['monday', 'thursday', 'friday', 'saturday', 'sunday'])
    .withMessage('Giorno non valido'),
  body('availabilities.*.shift.location')
    .trim()
    .notEmpty()
    .withMessage('Località è richiesta'),
  body('availabilities.*.date')
    .isISO8601()
    .withMessage('Data non valida')
];

export const updateAvailabilityStatusValidation: ValidationChain[] = [
  param('id')
    .isMongoId()
    .withMessage('ID non valido'),
  body('status')
    .isIn(['confirmed', 'rejected'])
    .withMessage('Status deve essere confirmed o rejected')
];

/**
 * Validation rules for schedule routes
 */
export const getScheduleValidation: ValidationChain[] = [
  body('month')
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage('Mese deve essere tra 1 e 12'),
  body('year')
    .optional()
    .isInt({ min: 2020, max: 2100 })
    .withMessage('Anno non valido')
];

/**
 * Validation rules for experience routes
 */
export const createExperienceValidation: ValidationChain[] = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Titolo è richiesto')
    .isLength({ min: 3, max: 200 })
    .withMessage('Il titolo deve essere tra 3 e 200 caratteri'),
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Contenuto è richiesto')
    .isLength({ min: 10, max: 5000 })
    .withMessage('Il contenuto deve essere tra 10 e 5000 caratteri'),
  body('isAnonymous')
    .optional()
    .isBoolean()
    .withMessage('isAnonymous deve essere un booleano')
];

export const updateExperienceValidation: ValidationChain[] = [
  param('id')
    .isMongoId()
    .withMessage('ID non valido'),
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Titolo è richiesto')
    .isLength({ min: 3, max: 200 })
    .withMessage('Il titolo deve essere tra 3 e 200 caratteri'),
  body('content')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Contenuto è richiesto')
    .isLength({ min: 10, max: 5000 })
    .withMessage('Il contenuto deve essere tra 10 e 5000 caratteri')
];
