import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";
import { api } from "./_generated/api";

const http = httpRouter();

auth.addHttpRoutes(http);

// Webhook endpoint for external triggers (IFTTT, Zapier, Apple Shortcuts, etc.)
http.route({
  path: "/api/webhook/transaction",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();

      // Validate required fields
      if (!body.amount || !body.merchantName) {
        return new Response(
          JSON.stringify({ error: "Missing required fields: amount, merchantName" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Validate API key if provided (optional security)
      const apiKey = request.headers.get("X-API-Key");
      const expectedKey = process.env.WEBHOOK_API_KEY;
      if (expectedKey && apiKey !== expectedKey) {
        return new Response(
          JSON.stringify({ error: "Invalid API key" }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: false,
          message: "Direct webhook creation is deprecated. Please use Open Banking sync in Settings > Holidays.",
        }),
        { status: 410, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Webhook error:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }),
});

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
    // Redirect the user back to the frontend after auth
    const siteUrl = process.env.SITE_URL || process.env.CONVEX_SITE_URL || "http://localhost:8080";

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

// TrueLayer webhook callback
http.route({
  path: "/api/webhook/truelayer",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();

      // TrueLayer sends transaction webhooks with this structure
      if (body.type === "transactions" && body.data) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "TrueLayer webhooks are deprecated. Please sync via Settings > Holidays.",
          }),
          { status: 410, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: "Event acknowledged" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("TrueLayer webhook error:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }),
});

export default http;
