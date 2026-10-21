import { createServerFn } from "@tanstack/react-start";

/**
 * Returns the publishable Firebase web keys stored as project secrets.
 * Firebase web API keys are public identifiers, not credentials.
 */
export const getFirebaseWebConfig = createServerFn({ method: "GET" }).handler(async () => ({
  apiKey: process.env["GOOGLE_API_KEY"] ?? "",
  measurementId: process.env["GOOGLE_ANALYTICS_MEASUREMENT_ID"] ?? "",
}));
