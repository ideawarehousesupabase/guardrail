import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Guardrail Intelligence Engine — Franklin" },
      {
        name: "description",
        content: "MSP security guardrails, drift monitoring and evidence ledger.",
      },
      { property: "og:title", content: "Guardrail Intelligence Engine — Franklin" },
      {
        property: "og:description",
        content: "MSP security guardrails, drift monitoring and evidence ledger.",
      },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/login" });
  },
});
