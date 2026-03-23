import { Hono } from "hono";

import { ApiError } from "../../middleware/errors";
import {
  listSavedJobsByUserId,
  saveJobForUser,
  unsaveJobForUser,
} from "../../repositories/me/saved-jobs";
import { requireAuthSessionContext } from "../../services/auth/session";

export const meSavedJobsRoute = new Hono();

async function parseJsonBody(c: { req: { json: () => Promise<unknown> } }): Promise<unknown> {
  try {
    return await c.req.json();
  } catch {
    throw new ApiError(400, "INVALID_QUERY", "Invalid JSON body");
  }
}

function parseJobId(body: unknown): string {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new ApiError(400, "INVALID_QUERY", "Invalid 'jobId' body parameter");
  }

  const jobId = (body as { readonly jobId?: unknown }).jobId;

  if (typeof jobId !== "string" || jobId.trim().length === 0) {
    throw new ApiError(400, "INVALID_QUERY", "Invalid 'jobId' body parameter");
  }

  return jobId.trim();
}

meSavedJobsRoute.get("/saved-jobs", (c) => {
  const auth = requireAuthSessionContext(c.req.header("cookie"));
  const items = listSavedJobsByUserId(auth.user.id);

  return c.json({
    data: {
      items,
    },
  });
});

meSavedJobsRoute.post("/saved-jobs", async (c) => {
  const auth = requireAuthSessionContext(c.req.header("cookie"));
  const jobId = parseJobId(await parseJsonBody(c));
  const savedJob = saveJobForUser(auth.user.id, jobId);

  return c.json({
    data: {
      savedJob,
    },
  });
});

meSavedJobsRoute.delete("/saved-jobs", async (c) => {
  const auth = requireAuthSessionContext(c.req.header("cookie"));
  const jobId = parseJobId(await parseJsonBody(c));

  unsaveJobForUser(auth.user.id, jobId);

  return c.json({
    data: {
      ok: true,
    },
  });
});
