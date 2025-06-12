import { ApiResponse } from "../api.response";
import { HttpError } from "./custom.error";
import { HTTP_CODES } from "./custom.error";

export function handleError(error: unknown) {
  if (error instanceof ApiResponse) {
    return {
      payload: ApiResponse.error({
        message: error.message,
        statusCode: error.statusCode,
        code: error.code,
        error: error.error,
      }),
      status: error.statusCode,
    };
  }

  if (error instanceof HttpError) {
    return {
      payload: ApiResponse.error({
        message: error.message,
        statusCode: error.statusCode,
        code: error.code,
      }),
      status: error.statusCode,
    };
  }

  return {
    payload: ApiResponse.error({
      message: "Internal Server Error",
      statusCode: 500,
      error,
      code: HTTP_CODES.INTERNAL_ERROR,
    }),
    status: 500,
  };
}
