import { Hono } from "hono";

import { ApiError } from "../../middleware/errors";
import { requireAuthSessionContext } from "../../services/auth/session";
import { listPortfolioReviewHistory, submitPortfolioReview } from "../../services/me/reviews";

export const mePortfolioReviewsRoute = new Hono();

type PortfolioReviewBody = {
  readonly portfolioUrl?: unknown;
  readonly focus?: unknown;
};

async function parseJsonBody(c: { req: { json: () => Promise<unknown> } }): Promise<unknown> {
  try {
    return await c.req.json();
  } catch {
    throw new ApiError(400, "INVALID_QUERY", "Invalid JSON body");
  }
}

function parseBody(body: unknown): { readonly portfolioUrl: string; readonly focus: string } {
  const normalized = body as PortfolioReviewBody;

  if (typeof normalized?.portfolioUrl !== "string" || normalized.portfolioUrl.trim().length === 0) {
    throw new ApiError(400, "INVALID_QUERY", "Invalid 'portfolioUrl' body parameter");
  }

  if (typeof normalized?.focus !== "string" || normalized.focus.trim().length === 0) {
    throw new ApiError(400, "INVALID_QUERY", "Invalid 'focus' body parameter");
  }

  return {
    portfolioUrl: normalized.portfolioUrl.trim(),
    focus: normalized.focus.trim(),
  };
}

mePortfolioReviewsRoute.get("/portfolio-reviews", (c) => {
  const auth = requireAuthSessionContext(c.req.header("cookie"));
  const items = listPortfolioReviewHistory(auth.user.id);

  return c.json({
    data: {
      items,
    },
  });
});

mePortfolioReviewsRoute.post("/portfolio-reviews", async (c) => {
  const auth = requireAuthSessionContext(c.req.header("cookie"));
  const body = parseBody(await parseJsonBody(c));

  const review = submitPortfolioReview({
    userId: auth.user.id,
    portfolioUrl: body.portfolioUrl,
    focus: body.focus,
  });

  return c.json({
    data: {
      review,
    },
  });
});
