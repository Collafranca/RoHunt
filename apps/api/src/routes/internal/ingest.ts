import { Hono } from "hono";

export const internalIngestRoute = new Hono();

internalIngestRoute.post("/ingest/jobs", (c) => {
  return c.json(
    {
      data: {
        accepted: true,
      },
    },
    202,
  );
});
