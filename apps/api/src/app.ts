import { Hono } from "hono";

import { authAdminMiddleware } from "./middleware/auth-admin";
import { authInternalMiddleware } from "./middleware/auth-internal";
import { authSessionMiddleware } from "./middleware/auth-session";
import { handleError } from "./middleware/errors";
import { rateLimitMiddleware } from "./middleware/rate-limit";
import { requestIdMiddleware } from "./middleware/request-id";
import { adminHealthRoute } from "./routes/admin/health";
import { internalHealthRoute } from "./routes/internal/health";
import { meHealthRoute } from "./routes/me/health";
import { publicHealthRoute } from "./routes/public/health";

type AppBindings = {
  Variables: {
    requestId: string;
  };
};

export const app = new Hono<AppBindings>();

app.use("*", requestIdMiddleware);
app.use("*", rateLimitMiddleware);

app.route("/v1/public", publicHealthRoute);

app.use("/v1/me/*", authSessionMiddleware);
app.route("/v1/me", meHealthRoute);

app.use("/v1/admin/*", authAdminMiddleware);
app.route("/v1/admin", adminHealthRoute);

app.use("/v1/internal/*", authInternalMiddleware);
app.route("/v1/internal", internalHealthRoute);

app.onError(handleError);
