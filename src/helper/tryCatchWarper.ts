import { ApiResponse } from "@/lib/api.response";
import { handleError } from "@/lib/error/handleError";

export async function tryCatchWrapper<T, A extends unknown[]>(
  fn: (...args: A) => Promise<ApiResponse<T>>,
  ...args: A
): Promise<Response> {
  try {
    const response = await fn(...args);
    return new Response(JSON.stringify(response), {
      status: response.statusCode,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error: unknown) {
    const { payload, status } = handleError(error);
    return new Response(JSON.stringify(payload), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }
}
