import { type ApiResponse } from "@/types/common";

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
  } catch (error) {
    console.error("Error in tryCatchWrapper:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Internal Server Error",
        data: null,
        statusCode: 500,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
