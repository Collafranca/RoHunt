import { Hono } from "hono";

import { authAdminMiddleware } from "./middleware/auth-admin";
import { authInternalMiddleware } from "./middleware/auth-internal";
import { authSessionMiddleware } from "./middleware/auth-session";
import { handleError } from "./middleware/errors";
import { rateLimitMiddleware } from "./middleware/rate-limit";
import { requestIdMiddleware } from "./middleware/request-id";
import { adminHealthRoute } from "./routes/admin/health";
import { internalHealthRoute } from "./routes/internal/health";
import { meBackgroundCheckRoute } from "./routes/me/background-check";
import { meAuthRoute } from "./routes/me/auth";
import { meHealthRoute } from "./routes/me/health";
import { meNotificationsRoute } from "./routes/me/notifications";
import { mePortfolioReviewsRoute } from "./routes/me/portfolio-reviews";
import { meSavedJobsRoute } from "./routes/me/saved-jobs";
import { meSettingsRoute } from "./routes/me/settings";
import { publicHealthRoute } from "./routes/public/health";
import { publicJobsRoute } from "./routes/public/jobs";
import { publicReferencesRoute } from "./routes/public/references";
import { publicScamsRoute } from "./routes/public/scams";
import { publicStatusRoute } from "./routes/public/status";

type AppBindings = {
  Variables: {
    requestId: string;
  };
};

export const app = new Hono<AppBindings>();

app.use("*", requestIdMiddleware);
app.use("*", rateLimitMiddleware);

app.route("/v1/public", publicHealthRoute);
app.route("/v1/public", publicJobsRoute);
app.route("/v1/public", publicScamsRoute);
app.route("/v1/public", publicReferencesRoute);
app.route("/v1/public", publicStatusRoute);

app.use("/v1/me/*", authSessionMiddleware);
app.route("/v1/me", meAuthRoute);
app.route("/v1/me", meHealthRoute);
app.route("/v1/me", meSavedJobsRoute);
app.route("/v1/me", meNotificationsRoute);
app.route("/v1/me", meBackgroundCheckRoute);
app.route("/v1/me", mePortfolioReviewsRoute);
app.route("/v1/me", meSettingsRoute);

app.use("/v1/admin/*", authAdminMiddleware);
app.route("/v1/admin", adminHealthRoute);

app.use("/v1/internal/*", authInternalMiddleware);
app.route("/v1/internal", internalHealthRoute);

app.onError(handleError);
