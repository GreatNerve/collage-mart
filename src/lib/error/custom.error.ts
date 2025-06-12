
export class HttpError extends Error {
  statusCode: number;
  code: string;

  constructor(
    message: string,
    statusCode = 500,
    code: HTTP_CODES = HTTP_CODES.INTERNAL_ERROR
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}


export enum HTTP_CODES {
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  BAD_REQUEST = "BAD_REQUEST",
  INTERNAL_ERROR = "INTERNAL_ERROR",
  CONFLICT = "CONFLICT",
  ZOD_VALIDATION_ERROR = "ZOD_VALIDATION_ERROR",
  CREATED = "CREATED",
  OK = "OK",
  NO_CONTENT = "NO_CONTENT",
  DELETED = "DELETED",
  UPDATED = "UPDATED",
}