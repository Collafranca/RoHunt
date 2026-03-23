import type { Context } from "hono";

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;

  public constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const handleError = (error: unknown, c: Context) => {
  const apiError =
    error instanceof ApiError
      ? error
      : new ApiError(500, "INTERNAL_SERVER_ERROR", "Internal server error");

  const requestId = c.get("requestId") as string | undefined;

  if (requestId) {
    c.header("x-request-id", requestId);
  }

  return c.json(
    {
      error: {
        code: apiError.code,
        message: apiError.message,
      },
      requestId,
    },
    apiError.status,
  );
};
