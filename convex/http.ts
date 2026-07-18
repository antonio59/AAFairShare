import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";
import { api } from "./_generated/api";

const http = httpRouter();

auth.addHttpRoutes(http);

// Health check endpoint
http.route({
  path: "/api/health",
  method: "GET",
  handler: httpAction(async () => {
    return new Response(
      JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }),
});

// TrueLayer OAuth callback
http.route({
  path: "/api/callback/truelayer",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");
    const errorDescription = url.searchParams.get("error_description");
    const state = url.searchParams.get("state");

    // Get the frontend URL for redirect
    // Redirect the user back to the frontend after auth (use custom domain if set)
    const rawSiteUrl = process.env.SITE_URL || "http://localhost:8080";
    const siteUrl = rawSiteUrl.match(/^https?:\/\//) ? rawSiteUrl : `https://${rawSiteUrl}`;

    if (error) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: `${siteUrl}/settings?tab=automation&bank_error=${encodeURIComponent(errorDescription || error)}`,
        },
      });
    }

    if (!code) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: `${siteUrl}/settings?tab=automation&bank_error=No authorization code received`,
        },
      });
    }

    try {
      // Exchange code for tokens and store bank link
      const result = await ctx.runAction(api.banking.exchangeCode, { code, state: state || "" });

      return new Response(null, {
        status: 302,
        headers: {
          Location: `${siteUrl}/settings?tab=automation&bank_success=${result.accountsLinked}`,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return new Response(null, {
        status: 302,
        headers: {
          Location: `${siteUrl}/settings?tab=automation&bank_error=${encodeURIComponent(message)}`,
        },
      });
    }
  }),
});

export default http;
