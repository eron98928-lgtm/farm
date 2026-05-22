import { PostHog } from "posthog-node";

let client: PostHog | null = null;

function getClient(): PostHog | null {
  if (!process.env.POSTHOG_KEY) return null;
  if (!client) {
    client = new PostHog(process.env.POSTHOG_KEY, {
      host: process.env.POSTHOG_HOST ?? "https://app.posthog.com",
      flushAt: 20,
      flushInterval: 10000,
    });
  }
  return client;
}

export function trackEvent(userId: string, event: string, properties?: Record<string, unknown>) {
  getClient()?.capture({ distinctId: userId, event, properties });
}

export function trackServerEvent(userId: string, event: string, properties?: Record<string, unknown>) {
  trackEvent(userId, event, properties);
}

export async function shutdownAnalytics() {
  await client?.shutdown();
}
