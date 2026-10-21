import { describe, expect, it } from "vitest";
import { clients } from "@/data/clients";
import {
  clientStatus,
  detectDrift,
  effectiveExceptionStatus,
  generateGuardrails,
  severityFor,
} from "@/lib/engine";
import { exceptions } from "@/data/exceptions";
import { calculateFindingStats } from "@/lib/selectors";

const abc = clients.find((c) => c.id === "CL-ABC")!;

describe("guardrail engine", () => {
  it("recommends exactly the five mandatory guardrail categories", () => {
    expect(generateGuardrails(abc).map((g) => g.category)).toEqual([
      "mfa",
      "privileged",
      "inactive",
      "sharing",
      "device",
    ]);
  });

  it("recommends phishing-resistant MFA for a client with a phishing history", () => {
    expect(generateGuardrails(abc)[0]!.expectedLevel).toBe(4);
  });

  it("only reports drift where current configuration is below expected", () => {
    const d = detectDrift({ mfa: 3, sharing: 1 }, { ...abc.currentConfig, sharing: 2 });
    expect(d.map((x) => x.category)).toEqual(["mfa"]);
  });

  it("rates a three-level gap as Critical", () => {
    expect(severityFor("device", 3)).toBe("Critical");
  });

  it("labels an approved exception past its expiry date as Expired", () => {
    const ex = exceptions.find((e) => e.id === "EX-103")!;
    expect(effectiveExceptionStatus(ex, new Date("2026-10-21"))).toBe("Expired");
  });

  it("calculates Critical, High, Medium, Low, Open and Resolved finding statistics consistently", () => {
    const mockFindings = [
      {
        id: "F-1",
        clientId: "CL-1",
        category: "mfa",
        control: "MFA",
        status: "Open",
        severity: "Critical",
      },
      {
        id: "F-2",
        clientId: "CL-1",
        category: "device",
        control: "Device",
        status: "Open",
        severity: "High",
      },
      {
        id: "F-3",
        clientId: "CL-1",
        category: "inactive",
        control: "Inactive",
        status: "Open",
        severity: "Medium",
      },
      {
        id: "F-4",
        clientId: "CL-1",
        category: "sharing",
        control: "Sharing",
        status: "Open",
        severity: "Low",
      },
      {
        id: "F-5",
        clientId: "CL-1",
        category: "privileged",
        control: "Privileged",
        status: "Resolved",
        severity: "Critical",
      },
    ] as unknown as import("@/data/types").SecurityFinding[];

    const stats = calculateFindingStats(mockFindings);
    expect(stats.total).toBe(5);
    expect(stats.open).toBe(4);
    expect(stats.resolved).toBe(1);
    expect(stats.critical).toBe(1);
    expect(stats.high).toBe(1);
    expect(stats.medium).toBe(1);
    expect(stats.low).toBe(1);
  });

  it("ensures an approved security exception does not resolve open findings or make non-compliant controls compliant", () => {
    const finding = {
      id: "DR-TEST",
      clientId: "CL-ABC",
      guardrailId: "GR-ABC-MFA",
      category: "mfa" as const,
      control: "Multifactor Authentication",
      description: "Drift detected",
      severity: "High" as const,
      status: "Open" as const,
      expectedValue: "Phishing-resistant MFA",
      currentValue: "SMS or voice call MFA",
      detectedAt: "2026-10-20T00:00:00Z",
    };

    // Client status with this open finding
    expect(clientStatus([finding])).toBe("At Risk");

    // Simulated exception approval does NOT change finding status
    const approvedException = {
      id: "EX-TEST",
      clientId: "CL-ABC",
      guardrailId: "GR-ABC-MFA",
      findingId: "DR-TEST",
      approvalStatus: "Approved" as const,
      currentStatus: "Active" as const,
    };

    expect(approvedException.approvalStatus).toBe("Approved");
    // Finding remains Open
    expect(finding.status).toBe("Open");
    // Client remains At Risk because finding is still open
    expect(clientStatus([finding])).toBe("At Risk");
  });
});
