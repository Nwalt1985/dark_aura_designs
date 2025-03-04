import {
  ErrorType,
  CustomError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  ExternalServiceError,
  DatabaseError,
  InternalError,
} from '../../errors/CustomError';

describe('Custom Error Classes', () => {
  describe('CustomError', () => {
    it('should create a custom error with the correct properties', () => {
      const error = new CustomError(ErrorType.VALIDATION, 'Test error message', 400, {
        field: 'value',
      });

      expect(error).toBeInstanceOf(Error);
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.message).toBe('Test error message');
      expect(error.code).toBe(400);
      expect(error.details).toEqual({ field: 'value' });
      expect(error.name).toBe('CustomError');
      expect(error.stack).toBeDefined();
    });

    it('should convert to JSON format correctly', () => {
      const error = new CustomError(ErrorType.VALIDATION, 'Test error message', 400, {
        field: 'value',
      });
      const json = error.toJSON();

      expect(json).toEqual({
        type: ErrorType.VALIDATION,
        message: 'Test error message',
        code: 400,
        details: { field: 'value' },
        stack: error.stack,
      });
    });
  });

  describe('ValidationError', () => {
    it('should create a validation error with the correct properties', () => {
      const error = new ValidationError('Invalid input', { field: 'value' });

      expect(error).toBeInstanceOf(CustomError);
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.message).toBe('Invalid input');
      expect(error.code).toBe(400);
      expect(error.details).toEqual({ field: 'value' });
    });
  });

  describe('AuthenticationError', () => {
    it('should create an authentication error with the correct properties', () => {
      const error = new AuthenticationError('Not authenticated');

      expect(error).toBeInstanceOf(CustomError);
      expect(error.type).toBe(ErrorType.AUTHENTICATION);
      expect(error.message).toBe('Not authenticated');
      expect(error.code).toBe(401);
    });
  });

  describe('AuthorizationError', () => {
    it('should create an authorization error with the correct properties', () => {
      const error = new AuthorizationError('Not authorized');

      expect(error).toBeInstanceOf(CustomError);
      expect(error.type).toBe(ErrorType.AUTHORIZATION);
      expect(error.message).toBe('Not authorized');
      expect(error.code).toBe(403);
    });
  });

  describe('NotFoundError', () => {
    it('should create a not found error with the correct properties', () => {
      const error = new NotFoundError('Resource not found');

      expect(error).toBeInstanceOf(CustomError);
      expect(error.type).toBe(ErrorType.NOT_FOUND);
      expect(error.message).toBe('Resource not found');
      expect(error.code).toBe(404);
    });
  });

  describe('ConflictError', () => {
    it('should create a conflict error with the correct properties', () => {
      const error = new ConflictError('Resource already exists');

      expect(error).toBeInstanceOf(CustomError);
      expect(error.type).toBe(ErrorType.CONFLICT);
      expect(error.message).toBe('Resource already exists');
      expect(error.code).toBe(409);
    });
  });

  describe('ExternalServiceError', () => {
    it('should create an external service error with the correct properties', () => {
      const error = new ExternalServiceError('External service failed');

      expect(error).toBeInstanceOf(CustomError);
      expect(error.type).toBe(ErrorType.EXTERNAL_SERVICE);
      expect(error.message).toBe('External service failed');
      expect(error.code).toBe(502);
    });
  });

  describe('DatabaseError', () => {
    it('should create a database error with the correct properties', () => {
      const error = new DatabaseError('Database operation failed');

      expect(error).toBeInstanceOf(CustomError);
      expect(error.type).toBe(ErrorType.DATABASE);
      expect(error.message).toBe('Database operation failed');
      expect(error.code).toBe(503);
    });
  });

  describe('InternalError', () => {
    it('should create an internal error with the correct properties', () => {
      const error = new InternalError('Internal server error');

      expect(error).toBeInstanceOf(CustomError);
      expect(error.type).toBe(ErrorType.INTERNAL);
      expect(error.message).toBe('Internal server error');
      expect(error.code).toBe(500);
    });
  });
});
