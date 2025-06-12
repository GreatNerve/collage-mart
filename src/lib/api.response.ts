export type ApiResponseType<T = null> = {
  success: boolean;
  message: string;
  data: T | null;
  statusCode: number;
  code?: string;
  error?: unknown;
};

export class ApiResponse<T = null> implements ApiResponseType<T> {
  success: boolean;
  message: string;
  data: T | null;
  statusCode: number;
  code?: string;
  error?: unknown;

  constructor({
    success,
    message,
    data = null,
    statusCode,
    code,
    error,
  }: ApiResponseType<T>) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.statusCode = statusCode;
    this.code = code;
    this.error = error;
  }

  static success<T>(options: {
    data: T;
    message?: string;
    statusCode?: number;
    code?: string;
  }): ApiResponse<T> {
    return new ApiResponse<T>({
      success: true,
      message: options.message ?? "Success",
      data: options.data,
      statusCode: options.statusCode ?? 200,
      code: options.code,
    });
  }

  static error<T = null>(options: {
    message?: string;
    statusCode?: number;
    code?: string;
    error?: unknown;
  }): ApiResponse<T> {
    return new ApiResponse<T>({
      success: false,
      message: options.message ?? "Internal Server Error",
      data: null,
      statusCode: options.statusCode ?? 500,
      code: options.code,
      error: options.error,
    });
  }
}
