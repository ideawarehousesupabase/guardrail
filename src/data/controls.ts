import type { GuardrailCategory } from "./types";

export interface ControlDefinition {
  key: GuardrailCategory;
  name: string;
  short: string;
  /** Ordered from weakest (0) to strongest. */
  levels: string[];
}

export const CONTROLS: ControlDefinition[] = [
  {
    key: "mfa",
    name: "Multi-Factor Authentication",
    short: "MFA",
    levels: [
      "MFA not enforced",
      "MFA enforced for administrators only",
      "MFA for all users (SMS permitted)",
      "MFA for all users via authenticator app",
      "Phishing-resistant MFA for all users",
    ],
  },
  {
    key: "privileged",
    name: "Privileged Access",
    short: "Privileged Access",
    levels: [
      "Multiple standing Global Administrators",
      "Standing admin roles, quarterly review",
      "Dedicated admin accounts, monthly review",
      "Just-in-time admin elevation with approval",
    ],
  },
  {
    key: "inactive",
    name: "Inactive Accounts",
    short: "Inactive Accounts",
    levels: [
      "No inactive account review",
      "Review accounts inactive 180+ days",
      "Disable accounts inactive 90+ days",
      "Disable accounts inactive 45+ days",
    ],
  },
  {
    key: "sharing",
    name: "External Sharing",
    short: "External Sharing",
    levels: [
      "Anonymous 'Anyone' links allowed",
      "'Anyone' links with 30-day expiry",
      "Sharing with authenticated guests only",
      "Sharing with approved partner domains only",
    ],
  },
  {
    key: "device",
    name: "Device Compliance",
    short: "Device Compliance",
    levels: [
      "No device compliance policy",
      "Compliance reported, not enforced",
      "Compliant device required for email and files",
      "Compliant, encrypted device required for all apps",
    ],
  },
];

export const CONTROL_BY_KEY = Object.fromEntries(CONTROLS.map((c) => [c.key, c])) as Record<
  GuardrailCategory,
  ControlDefinition
>;
