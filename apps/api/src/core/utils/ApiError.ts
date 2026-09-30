export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "TOO_MANY_REQUESTS"
  | "INTERNAL_SERVER_ERROR";

const DEFAULT_MESSAGES: Record<ApiErrorCode, string> = {
  BAD_REQUEST: "Bad request",
  UNAUTHORIZED: "Authentication required",
  FORBIDDEN: "Insufficient permissions",
  NOT_FOUND: "Resource not found",
  CONFLICT: "Resource conflict",
  TOO_MANY_REQUESTS: "Too many requests",
  INTERNAL_SERVER_ERROR: "Internal server error",
};

export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: ApiErrorCode;
  readonly details?: unknown;
  readonly isOperational = true;

  constructor(
    statusCode: number,
    code: ApiErrorCode,
    message?: string,
    details?: unknown
  ) {
    super(message ?? DEFAULT_MESSAGES[code]);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, ApiError.prototype);
    Error.captureStackTrace(this, ApiError);
  }

  static badRequest(message?: string, details?: unknown) {
    return new ApiError(400, "BAD_REQUEST", message, details);
  }
  static unauthorized(message?: string, details?: unknown) {
    return new ApiError(401, "UNAUTHORIZED", message, details);
  }
  static forbidden(message?: string, details?: unknown) {
    return new ApiError(403, "FORBIDDEN", message, details);
  }
  static notFound(message?: string, details?: unknown) {
    return new ApiError(404, "NOT_FOUND", message, details);
  }
  static conflict(message?: string, details?: unknown) {
    return new ApiError(409, "CONFLICT", message, details);
  }
  static tooManyRequests(message?: string, details?: unknown) {
    return new ApiError(429, "TOO_MANY_REQUESTS", message, details);
  }
  static internal(message?: string, details?: unknown) {
    return new ApiError(500, "INTERNAL_SERVER_ERROR", message, details);
  }
}
