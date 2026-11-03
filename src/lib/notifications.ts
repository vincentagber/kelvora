/**
 * Outbound Transactional Notification Engine (Email & WhatsApp)
 *
 * Implements multi-channel notification dispatchers with:
 * 1. Supabase / Resend / Transactional HTTP Email Driver
 * 2. Termii / WhatsApp Direct 1-Click Action Messaging
 * 3. Safe Development Console Mode Fallback
 */

export interface NotificationDispatchResult {
  success: boolean;
  channel: "EMAIL" | "WHATSAPP" | "SMS" | "CONSOLE";
  messageId?: string;
  recipient: string;
  error?: string;
  details?: Record<string, unknown>;
}

export interface ApprovalNotificationParams {
  recipientEmail: string;
  recipientName: string;
  recipientPhone?: string | null;
  approverRole: string;
  requisitionTitle: string;
  requisitionNumber: string;
  totalAmountNgn: number;
  requesterName: string;
  actionToken: string;
  baseUrl?: string;
}

export interface PoNotificationParams {
  recipientEmail: string;
  recipientPhone?: string | null;
  supplierName: string;
  poNumber: string;
  totalAmount: number;
  currency: string;
  actionToken: string;
  baseUrl?: string;
}

export interface TeamInvitationNotificationParams {
  recipientEmail: string;
  recipientName?: string;
  orgName: string;
  inviterName: string;
  roles: string[];
  inviteUrl: string;
  temporaryPassword?: string;
  baseUrl?: string;
}

export interface GenericEmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Dispatches an outbound SMS or WhatsApp message via Termii API
 */
export async function dispatchTermiiMessage(input: {
  to: string;
  message: string;
  channel?: "whatsapp" | "generic" | "dnd";
}): Promise<NotificationDispatchResult> {
  const termiiApiKey = process.env["TERMII_API_KEY"];
  const whatsappDriver = process.env["WHATSAPP_DRIVER"] || "console";
  const cleanPhone = input.to.replace(/[^0-9+]/g, "");

  if (whatsappDriver !== "console" && termiiApiKey) {
    try {
      const response = await fetch("https://api.ng.termii.com/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: cleanPhone,
          from: "Kelvora",
          sms: input.message,
          type: "plain",
          channel: input.channel || "whatsapp",
          api_key: termiiApiKey,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[Notification] Termii API Error:", errorText);
        return {
          success: false,
          channel: "WHATSAPP",
          recipient: cleanPhone,
          error: errorText,
        };
      }

      const resData = await response.json();
      return {
        success: true,
        channel: "WHATSAPP",
        messageId: resData.message_id || `termii_${Date.now()}`,
        recipient: cleanPhone,
      };
    } catch (err) {
      console.error("[Notification] Termii dispatch failed:", err);
      return {
        success: false,
        channel: "WHATSAPP",
        recipient: cleanPhone,
        error: String(err),
      };
    }
  }

  // Development Console Fallback
  console.log(`\n================== [NOTIFICATIONS DISPATCH: WHATSAPP / SMS] ==================`);
  console.log(`To: ${cleanPhone}`);
  console.log(`Channel: ${whatsappDriver.toUpperCase()}`);
  console.log(`Message:\n${input.message}`);
  console.log(`==============================================================================\n`);

  return {
    success: true,
    channel: "CONSOLE",
    recipient: cleanPhone,
    messageId: `mock_wa_${Date.now()}`,
  };
}

/**
 * Core transactional email dispatcher.
 * Supports:
 * - Direct SMTP (cPanel / Hostinger / standard mail server over port 465 SSL)
 * - Brevo (Sendinblue) HTTP API Driver (Over standard HTTPS port 443)
 * - Supabase Email Delivery (via Edge Function)
 * - Automatic seamless fallback across configured providers
 * - Safe development console mode
 */
export async function sendTransactionalEmail(
  payload: GenericEmailPayload,
): Promise<NotificationDispatchResult> {
  const emailDriver = (process.env["EMAIL_DRIVER"] || "smtp").toLowerCase();
  const fromEmail = process.env["EMAIL_FROM"] || "Kelvora <kelvora@useprocurely.com>";
  const supabaseUrl =
    process.env["SUPABASE_URL"] ||
    process.env["VITE_SUPABASE_URL"] ||
    process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const serviceRoleKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];

  const errors: string[] = [];

  // 1. Direct SMTP Delivery
  const trySmtp = async (): Promise<NotificationDispatchResult | null> => {
    const smtpHost = process.env["SMTP_HOST"] || "162.254.39.203";
    const smtpUser = process.env["SMTP_USER"] || "kelvora@useprocurely.com";
    const smtpPass = process.env["SMTP_PASS"] || "B[vw~J}7K=qHz?mX";
    const smtpPort = Number(process.env["SMTP_PORT"] || 465);
    const smtpSecure = process.env["SMTP_SECURE"] === "false" ? false : smtpPort === 465;

    if (!smtpHost || !smtpUser || !smtpPass) {
      errors.push("SMTP credentials incomplete");
      return null;
    }

    try {
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        tls: {
          rejectUnauthorized: false,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
      });

      const info = await transporter.sendMail({
        from: fromEmail,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      });

      return {
        success: true,
        channel: "EMAIL",
        messageId: info.messageId || `smtp_${Date.now()}`,
        recipient: payload.to,
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn("[Notification Engine] Direct SMTP delivery failed:", msg);
      errors.push(`SMTP error: ${msg}`);
      return null;
    }
  };

  // 2. Brevo (Sendinblue) HTTP API Delivery
  const tryBrevo = async (): Promise<NotificationDispatchResult | null> => {
    const brevoApiKey = process.env["BREVO_API_KEY"];
    if (!brevoApiKey) {
      errors.push("BREVO_API_KEY not configured");
      return null;
    }

    try {
      let senderName = "Kelvora";
      let senderEmail = "kelvora@useprocurely.com";
      const fromMatch = fromEmail.match(/^(.*?)\s*<(.+?)>$/);
      if (fromMatch) {
        senderName = fromMatch[1]?.trim() || "Kelvora";
        const candidate = fromMatch[2]?.trim() || "kelvora@useprocurely.com";
        senderEmail = candidate.toLowerCase().includes("resend.dev")
          ? "kelvora@useprocurely.com"
          : candidate;
      } else if (fromEmail.includes("@")) {
        senderEmail = fromEmail.toLowerCase().includes("resend.dev")
          ? "kelvora@useprocurely.com"
          : fromEmail.trim();
      }

      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          accept: "application/json",
          "api-key": brevoApiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email: payload.to }],
          subject: payload.subject,
          htmlContent: payload.html,
          textContent: payload.text || undefined,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`[Notification Engine] Brevo delivery error (${response.status}):`, errText);
        errors.push(`Brevo error (${response.status}): ${errText}`);
        return null;
      }

      const resData = (await response.json()) as { messageId?: string };
      return {
        success: true,
        channel: "EMAIL",
        messageId: resData.messageId || `brevo_${Date.now()}`,
        recipient: payload.to,
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn("[Notification Engine] Brevo HTTP call failed:", msg);
      errors.push(`Brevo error: ${msg}`);
      return null;
    }
  };

  // 3. Supabase Edge Function Delivery
  const trySupabase = async (): Promise<NotificationDispatchResult | null> => {
    if (!supabaseUrl || !serviceRoleKey) return null;
    try {
      const edgeUrl = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/send-email`;
      const response = await fetch(edgeUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: payload.to,
          subject: payload.subject,
          html: payload.html,
          text: payload.text,
        }),
      });

      if (response.ok) {
        const resData = (await response.json().catch(() => ({}))) as { id?: string };
        return {
          success: true,
          channel: "EMAIL",
          messageId: resData.id || `supabase_fn_${Date.now()}`,
          recipient: payload.to,
        };
      }
      const errText = await response.text().catch(() => "");
      errors.push(`Supabase edge error: ${errText}`);
      return null;
    } catch (e) {
      errors.push(`Supabase edge error: ${String(e)}`);
      return null;
    }
  };

  // Dispatch according to priority with automatic resilient failover
  let result: NotificationDispatchResult | null = null;

  if (emailDriver === "brevo") {
    // 1. Try Brevo first
    result = await tryBrevo();
    // 2. If Brevo failed (e.g. 401 unrecognised IP or rate limit), fail over to SMTP
    if (!result) {
      console.log("[Notification Engine] Brevo unavailable, failing over to direct SMTP...");
      result = await trySmtp();
    }
    // 3. If SMTP also failed, try Supabase Edge
    if (!result) {
      result = await trySupabase();
    }
  } else if (emailDriver === "supabase") {
    result = await trySupabase();
    if (!result) result = await trySmtp();
    if (!result) result = await tryBrevo();
  } else if (emailDriver === "console") {
    // Explicit console testing mode requested
  } else {
    // Default: try direct SMTP first
    result = await trySmtp();
    // If SMTP failed (e.g. port 465 blocked on cloud), fail over to Brevo over port 443
    if (!result) {
      console.log("[Notification Engine] SMTP unavailable, failing over to Brevo...");
      result = await tryBrevo();
    }
    if (!result) {
      result = await trySupabase();
    }
  }

  if (result) {
    return result;
  }

  // Never treat console output as delivery in production or log credential emails there.
  if (process.env["NODE_ENV"] === "production") {
    return {
      success: false,
      channel: "EMAIL",
      recipient: payload.to,
      error: errors.join(" | ") || "No configured email provider accepted the message.",
    };
  }

  // Fallback: Console Logging with full payload details for local dev & testing
  console.log(`\n================== [NOTIFICATIONS DISPATCH: EMAIL (${emailDriver.toUpperCase()})] ==================`);
  console.log(`From:    ${fromEmail}`);
  console.log(`To:      ${payload.to}`);
  console.log(`Subject: ${payload.subject}`);
  console.log(`--- Content Preview ---`);
  console.log(payload.text || payload.html.replace(/<[^>]+>/g, " ").slice(0, 300));
  if (errors.length) {
    console.log(`--- Driver Fallback Notes ---`);
    console.log(errors.join("\n"));
  }
  console.log(`========================================================================\n`);

  return {
    success: true,
    channel: "CONSOLE",
    recipient: payload.to,
    messageId: `console_mail_${Date.now()}`,
    details: {
      subject: payload.subject,
      recipient: payload.to,
      driver: emailDriver,
      errors,
    },
  };
}

/**
 * Dispatches an automated approval request email & WhatsApp notification with 1-click token
 */
export async function dispatchApprovalNotification(
  params: ApprovalNotificationParams,
): Promise<NotificationDispatchResult> {
  const baseUrl = (params.baseUrl || process.env["APP_BASE_URL"] || "http://localhost:3000").replace(/\/$/, "");
  const approveUrl = `${baseUrl}/approve/${params.actionToken}?decision=approved`;
  const rejectUrl = `${baseUrl}/approve/${params.actionToken}?decision=rejected`;
  const viewUrl = `${baseUrl}/approve/${params.actionToken}`;

  // Dispatch WhatsApp alert if phone number is provided
  if (params.recipientPhone) {
    const waText =
      `Kelvora: Spend Requisition ${params.requisitionNumber} needs your approval as ${params.approverRole}.\n\n` +
      `Title: ${params.requisitionTitle}\n` +
      `Amount: ₦${params.totalAmountNgn.toLocaleString("en-NG", { minimumFractionDigits: 2 })}\n` +
      `Requested by: ${params.requesterName}\n\n` +
      `Tap below to review & approve:\n${viewUrl}\n\n` +
      `Direct Approve: ${approveUrl}\n` +
      `Direct Reject: ${rejectUrl}`;

    dispatchTermiiMessage({
      to: params.recipientPhone,
      message: waText,
      channel: "whatsapp",
    }).catch((e) => console.error("[Notification] Outbound WhatsApp background error:", e));
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 12px; background-color: #ffffff;">
      <div style="border-bottom: 2px solid #0B1457; padding-bottom: 12px; margin-bottom: 20px;">
        <h2 style="color: #0B1457; margin: 0 0 4px 0; font-size: 20px;">Kelvora — Approval Clearance Required</h2>
        <span style="color: #64748B; font-size: 12px;">Auditable Procurement Workflow</span>
      </div>
      <p style="color: #334155; font-size: 14px; line-height: 1.5;">Hello ${params.recipientName}, a new spend requisition requires your approval clearance as <strong>${params.approverRole}</strong>.</p>
      
      <div style="background-color: #F8FAFC; padding: 18px; border-radius: 8px; margin: 20px 0; border: 1px solid #E2E8F0;">
        <p style="margin: 4px 0; font-size: 13px; color: #475569;"><strong>Requisition:</strong> ${params.requisitionTitle} (${params.requisitionNumber})</p>
        <p style="margin: 4px 0; font-size: 13px; color: #475569;"><strong>Requested By:</strong> ${params.requesterName}</p>
        <p style="margin: 8px 0 0 0; font-size: 16px; color: #0B1457; font-weight: bold;"><strong>Total Amount:</strong> ₦${params.totalAmountNgn.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</p>
      </div>

      <div style="margin: 28px 0; display: flex; gap: 12px;">
        <a href="${approveUrl}" style="background-color: #0001FF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px; display: inline-block;">Approve Immediately</a>
        <a href="${rejectUrl}" style="background-color: #EF4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px; display: inline-block; margin-left: 8px;">Reject</a>
      </div>

      <p style="font-size: 12px; color: #64748B; margin-top: 24px; line-height: 1.5;">
        This single-use cryptographic link expires in 72 hours. Alternatively, log in to review full line items:
        <br/><a href="${viewUrl}" style="color: #0001FF; font-weight: 600;">View in Dashboard (${viewUrl})</a>
      </p>
    </div>
  `;

  return sendTransactionalEmail({
    to: params.recipientEmail,
    subject: `Action Required: Approval Needed for Requisition ${params.requisitionNumber}`,
    html,
    text: `Approval required for ${params.requisitionNumber}: ${params.requisitionTitle} (₦${params.totalAmountNgn}). Review & Approve: ${viewUrl}`,
  });
}

/**
 * Dispatches an automated Purchase Order award notification to a supplier
 */
export async function dispatchPoAwardNotification(
  params: PoNotificationParams,
): Promise<NotificationDispatchResult> {
  const baseUrl = (params.baseUrl || process.env["APP_BASE_URL"] || "http://localhost:3000").replace(/\/$/, "");
  const ackUrl = `${baseUrl}/quote/${params.actionToken}`;

  // Optional WhatsApp alert to supplier contact
  if (params.recipientPhone) {
    const waText =
      `Kelvora: Purchase Order Awarded!\n\n` +
      `Order: ${params.poNumber}\n` +
      `Total: ${params.currency} ${params.totalAmount.toLocaleString()}\n\n` +
      `Please review order specifications and submit delivery confirmation here:\n${ackUrl}`;

    dispatchTermiiMessage({
      to: params.recipientPhone,
      message: waText,
      channel: "whatsapp",
    }).catch((e) => console.error("[Notification] Outbound PO WhatsApp error:", e));
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: #0B1457; margin-bottom: 8px;">Purchase Order Award Notification</h2>
      <p style="color: #4B556D; font-size: 14px;">Hello ${params.supplierName}, you have been officially awarded Purchase Order <strong>${params.poNumber}</strong>.</p>
      
      <div style="background-color: #F8FAFC; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #E2E8F0;">
        <p style="margin: 4px 0; font-size: 13px;"><strong>PO Number:</strong> ${params.poNumber}</p>
        <p style="margin: 4px 0; font-size: 14px; color: #0B1457;"><strong>Total Order Value:</strong> ${params.currency} ${params.totalAmount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</p>
      </div>

      <div style="margin: 24px 0;">
        <a href="${ackUrl}" style="background-color: #0001FF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">Review & Acknowledge Purchase Order</a>
      </div>

      <p style="font-size: 12px; color: #94A3B8; margin-top: 24px;">Please review the order specifications and confirm delivery timeline. No account registration is required.</p>
    </div>
  `;

  return sendTransactionalEmail({
    to: params.recipientEmail,
    subject: `Purchase Order Awarded: ${params.poNumber}`,
    html,
    text: `Purchase Order ${params.poNumber} awarded. Review and acknowledge: ${ackUrl}`,
  });
}

/**
 * Dispatches an automated invitation notification to a new organization teammate / sub-user
 */
export async function dispatchTeamInvitationNotification(
  params: TeamInvitationNotificationParams,
): Promise<NotificationDispatchResult> {
  const baseUrl = (params.baseUrl || process.env["APP_BASE_URL"] || "http://localhost:3000").replace(/\/$/, "");
  const loginUrl = `${baseUrl}/auth`;
  const inviteUrl = params.inviteUrl || loginUrl;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 12px; background-color: #ffffff;">
      <div style="border-bottom: 2px solid #0B1457; padding-bottom: 12px; margin-bottom: 20px;">
        <h2 style="color: #0B1457; margin: 0 0 4px 0; font-size: 20px;">Kelvora — Team Workspace Invitation</h2>
        <span style="color: #64748B; font-size: 12px;">Enterprise Procurement & Spend Management</span>
      </div>
      <p style="color: #334155; font-size: 14px; line-height: 1.5;">
        Hello${params.recipientName ? ` ${params.recipientName}` : ""},
        <br/><br/>
        <strong>${params.inviterName}</strong> has invited you to join the <strong>${params.orgName}</strong> workspace on Kelvora.
      </p>

      <div style="background-color: #F8FAFC; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #E2E8F0;">
        <p style="margin: 4px 0; font-size: 13px; color: #475569;"><strong>Organization:</strong> ${params.orgName}</p>
        <p style="margin: 4px 0; font-size: 13px; color: #475569;"><strong>Assigned Roles:</strong> ${params.roles.join(", ")}</p>
        ${
          params.temporaryPassword
            ? `<p style="margin: 8px 0 0 0; font-size: 13px; color: #0B1457;"><strong>Temporary Password:</strong> <code style="background: #E2E8F0; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${params.temporaryPassword}</code></p>`
            : ""
        }
      </div>

      <div style="margin: 24px 0;">
        <a href="${inviteUrl}" style="background-color: #0001FF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">
          ${params.temporaryPassword ? "Sign In to Your Workspace" : "Accept Invitation & Join"}
        </a>
      </div>

      <p style="font-size: 12px; color: #64748B; margin-top: 24px; line-height: 1.5;">
        You can access your team portal directly at: <a href="${inviteUrl}" style="color: #0001FF;">${inviteUrl}</a>.
        ${params.temporaryPassword ? " Please change your password upon your first sign in." : ""}
      </p>
    </div>
  `;

  return sendTransactionalEmail({
    to: params.recipientEmail,
    subject: `You've been invited to join ${params.orgName} on Kelvora`,
    html,
    text: `You've been invited to join ${params.orgName} on Kelvora as ${params.roles.join(", ")}. Sign in: ${inviteUrl}`,
  });
}

/**
 * Dispatches a welcoming notification to a newly registered user with their workspace details
 */
export async function dispatchWelcomeNotification(params: {
  recipientEmail: string;
  recipientName: string;
  orgName: string;
  baseUrl?: string | undefined;
}): Promise<NotificationDispatchResult> {
  const baseUrl = (params.baseUrl || process.env["APP_BASE_URL"] || "https://kelvora.onrender.com").replace(/\/$/, "");
  const dashboardUrl = `${baseUrl}/dashboard`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border: 1px solid #E2E8F0; border-radius: 12px; background-color: #ffffff; color: #0B1457;">
      <div style="margin-bottom: 24px; border-bottom: 2px solid #0001FF; padding-bottom: 16px;">
        <span style="font-size: 24px; font-weight: 800; color: #0001FF; letter-spacing: -0.5px;">KELVORA</span>
        <div style="font-size: 12px; color: #64748B; margin-top: 4px;">Enterprise Procurement Operating System</div>
      </div>

      <h1 style="font-size: 22px; font-weight: 700; margin-bottom: 16px; color: #0B1457;">
        Welcome to Kelvora, ${params.recipientName}!
      </h1>

      <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
        Your enterprise procurement workspace <strong>${params.orgName}</strong> is provisioned and ready for operations.
      </p>

      <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 18px; margin-bottom: 24px;">
        <div style="font-size: 13px; font-weight: 600; color: #0B1457; margin-bottom: 8px;">What you can do next:</div>
        <ul style="font-size: 13px; color: #475569; margin: 0; padding-left: 20px; line-height: 1.8;">
          <li>Create spend requisitions and project cost centers</li>
          <li>Set up threshold approval rules and segregation-of-duties matrix</li>
          <li>Issue RFQs and compare supplier bids side-by-side</li>
          <li>Invite teammates with specific operational and financial roles</li>
        </ul>
      </div>

      <div style="margin-bottom: 28px;">
        <a href="${dashboardUrl}" style="background-color: #0001FF; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 600; display: inline-block;">
          Go to Workspace Dashboard
        </a>
      </div>

      <p style="font-size: 12px; color: #94A3B8; border-top: 1px solid #E2E8F0; padding-top: 16px; line-height: 1.5;">
        You received this email because your account was created on Kelvora. If you did not initiate this registration, please contact our security team immediately at support@kelvora.com.
      </p>
    </div>
  `;

  return sendTransactionalEmail({
    to: params.recipientEmail,
    subject: `Welcome to Kelvora — ${params.orgName} Workspace Ready`,
    html,
    text: `Welcome to Kelvora, ${params.recipientName}! Your procurement workspace "${params.orgName}" is ready. Access your dashboard: ${dashboardUrl}`,
  });
}
