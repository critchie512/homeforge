import serverless from "serverless-http";
import type { Handler } from "@netlify/functions";
import { createApp } from "../../server/app";

// Netlify Functions have no persistent process — each cold start re-runs
// this module top-to-bottom. We memoize the built Express app + serverless
// handler across warm invocations of the same function container so the
// Postgres connection pool (created inside server/storage.ts) is reused
// rather than rebuilt on every single request.
let handlerPromise: Promise<ReturnType<typeof serverless>> | null = null;

function getHandler() {
  if (!handlerPromise) {
    handlerPromise = createApp().then((app) => serverless(app));
  }
  return handlerPromise;
}

export const handler: Handler = async (event, context) => {
  const fn = await getHandler();
  return fn(event, context) as any;
};
