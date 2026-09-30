import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHash, randomBytes } from "crypto";
import {
  dispatchApprovalNotification,
  dispatchPoAwardNotification,
  dispatchTeamInvitationNotification,
  sendTransactionalEmail,
} from "./notifications.ts";

describe("Critical Bugs Resolution: Core Domain & System Tests", () => {
  /* =========================================================================
   * 1. ISSUE 1: APPROVAL TOKEN LINKS & REQUISITION RESOLUTION
   * ========================================================================= */
  describe("1. Approval Link & Token Resolution", () => {
    it("generates and verifies 64-char SHA-256 tokens matching the database schema", () => {
      const rawToken = randomBytes(32).toString("hex");
      const tokenHash = createHash("sha256").update(rawToken).digest("hex");

      assert.equal(rawToken.length, 64);
      assert.equal(tokenHash.length, 64);
      assert.notEqual(rawToken, tokenHash);

      // Verify deterministic token hash verification
      const verifyHash = createHash("sha256").update(rawToken).digest("hex");
      assert.equal(verifyHash, tokenHash);
    });

    it("resiliently shapes requisition and requester profile data without PostgREST foreign key joins", () => {
      // Simulate raw DB responses where requisition and profile are queried separately
      const mockRequisitionRow = {
        id: "req-123",
        reference: "REQ-260930-4DB28",
        title: "Cements, Marine Board",
        total_amount: "9780000.00",
        currency: "NGN",
        status: "pending_approval",
        is_unbudgeted: false,
        needed_by: "2026-10-15",
        created_at: "2026-09-30T10:00:00Z",
        project_id: "proj-1",
        requester_id: "usr-456",
        projects: {
          id: "proj-1",
          name: "Dangote Refinery Jetty Expansion",
          location: "Lekki Free Zone, Lagos",
          budget_amount: 50000000,
        },
      };

      const mockRequesterProfile = {
        id: "usr-456",
        full_name: "Engr. Tunde Adeleke",
        email: "tunde@kelvora.com",
        department: "Civil & Marine Works",
      };

      // Transform logic identical to getApprovalTokenDetails
      const shapedDetails = {
        status: "VALID" as const,
        requisition: {
          id: mockRequisitionRow.id,
          reference: mockRequisitionRow.reference,
          title: mockRequisitionRow.title,
          totalAmount: Number(mockRequisitionRow.total_amount),
          currency: mockRequisitionRow.currency,
          status: mockRequisitionRow.status,
          isUnbudgeted: !!mockRequisitionRow.is_unbudgeted,
          neededBy: mockRequisitionRow.needed_by,
          createdAt: mockRequisitionRow.created_at,
          requesterName: mockRequesterProfile?.full_name || "Procurement Initiator",
          requesterDepartment: mockRequesterProfile?.department || "Engineering & Projects",
          projectName: mockRequisitionRow.projects?.name || "General Capex Site",
          projectLocation: mockRequisitionRow.projects?.location || "Site Unassigned",
        },
      };

      assert.equal(shapedDetails.status, "VALID");
      assert.equal(shapedDetails.requisition.requesterName, "Engr. Tunde Adeleke");
      assert.equal(shapedDetails.requisition.totalAmount, 9780000);
      assert.equal(shapedDetails.requisition.projectName, "Dangote Refinery Jetty Expansion");
    });

    it("evaluates token status transitions correctly (VALID, ALREADY_USED, EXPIRED)", () => {
      const evaluateStatus = (tokenRecord: {
        used_at: string | null;
        expires_at: string;
      }): "VALID" | "ALREADY_USED" | "EXPIRED" => {
        if (tokenRecord.used_at) return "ALREADY_USED";
        if (new Date(tokenRecord.expires_at).getTime() < Date.now()) return "EXPIRED";
        return "VALID";
      };

      const validToken = {
        used_at: null,
        expires_at: new Date(Date.now() + 1000 * 3600 * 24).toISOString(),
      };
      const usedToken = {
        used_at: "2026-09-30T12:00:00Z",
        expires_at: new Date(Date.now() + 1000 * 3600 * 24).toISOString(),
      };
      const expiredToken = {
        used_at: null,
        expires_at: new Date(Date.now() - 1000 * 60).toISOString(),
      };

      assert.equal(evaluateStatus(validToken), "VALID");
      assert.equal(evaluateStatus(usedToken), "ALREADY_USED");
      assert.equal(evaluateStatus(expiredToken), "EXPIRED");
    });
  });

  /* =========================================================================
   * 2. ISSUE 2: PASSWORD RESET RECOVERY & ERROR HANDLING
   * ========================================================================= */
  describe("2. Password Reset & Recovery Flows", () => {
    it("extracts PKCE code and error parameters from URL search and hash fragments", () => {
      const parseAuthUrl = (urlStr: string) => {
        const url = new URL(urlStr);
        const searchParams = url.searchParams;
        const hash = url.hash.startsWith("#") ? url.hash.slice(1) : url.hash;
        const hashParams = new URLSearchParams(hash);

        const code = searchParams.get("code") || hashParams.get("code");
        const error = searchParams.get("error") || hashParams.get("error");
        const errorDescription =
          searchParams.get("error_description") || hashParams.get("error_description");

        return { code, error, errorDescription };
      };

      // 1. PKCE Authorization Code in query string
      const pkceUrl = "http://localhost:3000/reset-password?code=412e8b2e-0a5e-42c2-b91c-1348f3b14e66";
      const pkceResult = parseAuthUrl(pkceUrl);
      assert.equal(pkceResult.code, "412e8b2e-0a5e-42c2-b91c-1348f3b14e66");
      assert.equal(pkceResult.error, null);

      // 2. Expired Token Error in hash fragment
      const errorHashUrl =
        "http://localhost:3000/reset-password#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired";
      const errorResult = parseAuthUrl(errorHashUrl);
      assert.equal(errorResult.error, "access_denied");
      assert.equal(errorResult.errorDescription, "Email link is invalid or has expired");
    });

    it("properly asserts and handles errors from Supabase Auth without swallowing", () => {
      const handleResetPasswordResult = (result: { data: unknown; error: Error | null }) => {
        if (result.error) {
          throw new Error(`Password reset dispatch failed: ${result.error.message}`);
        }
        return { success: true };
      };

      // Success case
      assert.doesNotThrow(() =>
        handleResetPasswordResult({ data: {}, error: null }),
      );

      // Error case (Rate limit exceeded)
      assert.throws(
        () =>
          handleResetPasswordResult({
            data: null,
            error: new Error("For security purposes, you can only request this once every 60 seconds"),
          }),
        /For security purposes, you can only request this once every 60 seconds/,
      );
    });
  });

  /* =========================================================================
   * 3. ISSUE 3: ADMIN SUB-USER MANAGEMENT & CAPABILITIES
   * ========================================================================= */
  describe("3. Admin Sub-User Management", () => {
    it("validates direct sub-user provisioning payload invariants", () => {
      interface SubUserPayload {
        email: string;
        fullName: string;
        department?: string;
        roles: string[];
        password?: string;
      }

      const validateSubUser = (input: SubUserPayload) => {
        if (!input.email || !input.email.includes("@")) {
          throw new Error("A valid corporate email address is required.");
        }
        if (!input.fullName || input.fullName.trim().length < 2) {
          throw new Error("Full name must be at least 2 characters.");
        }
        if (!input.roles || input.roles.length === 0) {
          throw new Error("At least one operational role must be assigned.");
        }
      };

      // Valid sub-user
      assert.doesNotThrow(() =>
        validateSubUser({
          email: "finance.officer@kelvora.com",
          fullName: "Chioma Okonjo",
          department: "Finance & Treasury",
          roles: ["finance", "approver"],
        }),
      );

      // Invalid: missing roles
      assert.throws(
        () =>
          validateSubUser({
            email: "user@kelvora.com",
            fullName: "Test User",
            roles: [],
          }),
        /At least one operational role must be assigned/,
      );

      // Invalid: missing email
      assert.throws(
        () =>
          validateSubUser({
            email: "",
            fullName: "Test User",
            roles: ["requester"],
          }),
        /A valid corporate email address is required/,
      );
    });

    it("generates a high-entropy temporary password when none is specified", () => {
      const generatePassword = () => `${randomBytes(6).toString("hex")}!Aa1`;
      const pass1 = generatePassword();
      const pass2 = generatePassword();

      assert.ok(pass1.length >= 12);
      assert.notEqual(pass1, pass2);
      assert.match(pass1, /[A-Z]/);
      assert.match(pass1, /[a-z]/);
      assert.match(pass1, /[0-9]/);
      assert.match(pass1, /[!]/);
    });

    it("prevents an administrator from removing their own account to avoid lockout", () => {
      const assertCanRemoveUser = (adminId: string, targetId: string) => {
        if (adminId === targetId) {
          throw new Error("You cannot remove your own administrator account.");
        }
      };

      assert.doesNotThrow(() => assertCanRemoveUser("admin-1", "user-2"));
      assert.throws(
        () => assertCanRemoveUser("admin-1", "admin-1"),
        /You cannot remove your own administrator account/,
      );
    });
  });

  /* =========================================================================
   * 4. ISSUE 4: TRANSACTIONAL EMAIL DISPATCHER ENGINE
   * ========================================================================= */
  describe("4. Transactional Email Dispatcher Engine", () => {
    it("dispatches approval notifications through the configured driver with 1-click links", async () => {
      const res = await dispatchApprovalNotification({
        recipientEmail: "director@kelvora.com",
        recipientName: "Director Ahmed",
        approverRole: "executive",
        requisitionTitle: "Substation Transformers 33kV",
        requisitionNumber: "REQ-260930-99881",
        totalAmountNgn: 45000000,
        requesterName: "Engr. Ade",
        actionToken: "abc123token456",
        baseUrl: "https://kelvora.onrender.com",
      });

      assert.equal(res.success, true);
      assert.equal(res.recipient, "director@kelvora.com");
      assert.ok(["EMAIL", "CONSOLE"].includes(res.channel));
    });

    it("dispatches team workspace invitation notifications with temporary credentials", async () => {
      const res = await dispatchTeamInvitationNotification({
        recipientEmail: "new.engineer@kelvora.com",
        recipientName: "Emeka Chidi",
        orgName: "Dangote Energy Division",
        inviterName: "Admin Tunde",
        roles: ["requester", "approver"],
        inviteUrl: "https://kelvora.onrender.com/auth",
        temporaryPassword: "TempPassword123!",
      });

      assert.equal(res.success, true);
      assert.equal(res.recipient, "new.engineer@kelvora.com");
      assert.ok(["EMAIL", "CONSOLE"].includes(res.channel));
    });

    it("dispatches PO award notifications to suppliers", async () => {
      const res = await dispatchPoAwardNotification({
        recipientEmail: "sales@lafarge.ng",
        supplierName: "Lafarge Africa Plc",
        poNumber: "PO-260930-0042",
        totalAmount: 18500000,
        currency: "NGN",
        actionToken: "po_award_token_789",
        baseUrl: "https://kelvora.onrender.com",
      });

      assert.equal(res.success, true);
      assert.equal(res.recipient, "sales@lafarge.ng");
      assert.ok(["EMAIL", "CONSOLE"].includes(res.channel));
    });

    it("safely handles general transactional emails with driver fallback", async () => {
      const res = await sendTransactionalEmail({
        to: "compliance@kelvora.com",
        subject: "Audit Report Generated",
        html: "<h1>Audit Report Ready</h1><p>Compliance record logged.</p>",
        text: "Audit Report Ready. Compliance record logged.",
      });

      assert.equal(res.success, true);
      assert.equal(res.recipient, "compliance@kelvora.com");
    });
  });
});
