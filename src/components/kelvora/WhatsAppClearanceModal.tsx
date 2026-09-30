import React, { useState } from "react";
import { FaWhatsapp } from "react-icons/fa";
import {
  Smartphone,
  Copy,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Eye,
  Code2,
  Check,
  ArrowRight,
  Clock,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface GeneratedApprovalLinks {
  stepId: string;
  requisitionReference: string;
  approveToken?: string | undefined;
  webReviewUrl: string;
  webApproveUrl: string;
  webRejectUrl: string;
  whatsappMessage: string;
  whatsappDirectUrl: string;
  approverPhone?: string | null | undefined;
  approverEmail?: string | null | undefined;
}

interface WhatsAppClearanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isGeneratingLinks: boolean;
  generatedLinks: GeneratedApprovalLinks | null;
  onSimulateApproval: (stepId: string) => void;
  isSimulatingApproval?: boolean;
}

export function WhatsAppClearanceModal({
  open,
  onOpenChange,
  isGeneratingLinks,
  generatedLinks,
  onSimulateApproval,
  isSimulatingApproval = false,
}: WhatsAppClearanceModalProps) {
  const [viewMode, setViewMode] = useState<"preview" | "raw">("preview");
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!generatedLinks?.whatsappMessage) return;
    try {
      await navigator.clipboard.writeText(generatedLinks.whatsappMessage);
      setCopied(true);
      toast.success("WhatsApp approval message copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy WhatsApp message:", generatedLinks.whatsappMessage);
    }
  };

  const parsed = generatedLinks ? parseMessage(generatedLinks.whatsappMessage) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header with WhatsApp branding */}
        <div className="shrink-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-slate-50 border-b border-slate-200/80 px-4 py-3.5 sm:px-6 sm:py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-2xl bg-[#25D366] text-white shadow-sm shadow-emerald-500/20">
              <FaWhatsapp className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                  WhatsApp Clearance Channel
                </DialogTitle>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                  <ShieldCheck className="h-3 w-3" />
                  1-Click Secure
                </span>
              </div>
              <DialogDescription className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                Dispatch an instant, tokenized mobile approval prompt without password friction.
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5">
          {isGeneratingLinks ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-emerald-600 border-t-transparent" />
              <p className="text-xs text-slate-600 font-medium">
                Generating cryptographically secure single-use approval tokens…
              </p>
            </div>
          ) : generatedLinks ? (
            <>
              {/* Approver Target Banner */}
              <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-slate-50/90 px-3.5 py-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <Smartphone className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block truncate">
                      Target Approver Mobile
                    </span>
                    <span className="text-xs font-bold text-slate-800 font-mono truncate block">
                      {generatedLinks.approverPhone || "+234 (Registered Approver)"}
                    </span>
                  </div>
                </div>

                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-200/60">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Delivery Ready
                </span>
              </div>

              {/* View Switcher Header Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-bold text-slate-700 truncate">
                    {viewMode === "preview" ? "WhatsApp Message Preview" : "Raw Template Payload"}
                  </span>
                  <span className="hidden sm:inline-block text-[10px] text-slate-400">
                    {viewMode === "preview" ? "• Recipient chat view" : "• Direct API text"}
                  </span>
                </div>

                <div className="inline-flex shrink-0 rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs">
                  <button
                    type="button"
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                      viewMode === "preview"
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                    onClick={() => setViewMode("preview")}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Preview
                  </button>
                  <button
                    type="button"
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                      viewMode === "raw"
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                    onClick={() => setViewMode("raw")}
                  >
                    <Code2 className="h-3.5 w-3.5" />
                    Raw Text
                  </button>
                </div>
              </div>

              {/* View Content */}
              {viewMode === "preview" ? (
                /* Authentic WhatsApp Chat Preview */
                <div className="rounded-2xl border border-slate-200 bg-[#ECE5DD] p-3 sm:p-4 shadow-inner">
                  <div className="flex items-center justify-between mb-2 px-1 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1 font-semibold text-emerald-800">
                      <ShieldCheck className="h-3 w-3" />
                      Encrypted WhatsApp Dispatch
                    </span>
                    <span>Single-use token</span>
                  </div>

                  {/* WhatsApp Message Bubble */}
                  <div className="relative max-w-full sm:max-w-[94%] rounded-2xl rounded-tl-xs bg-white p-4 shadow-sm border border-slate-200/60 text-slate-800 space-y-3">
                    {/* Header */}
                    <div className="border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base">📋</span>
                        <span className="text-xs font-bold text-emerald-900 uppercase tracking-tight">
                          Kelvora — Requisition Approval Required
                        </span>
                      </div>
                      {parsed?.reference && (
                        <span className="inline-block mt-1 font-mono text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {parsed.reference}
                        </span>
                      )}
                    </div>

                    {/* Metadata fields */}
                    <div className="space-y-1.5 text-xs">
                      {parsed?.fields.map((f, i) => (
                        <div
                          key={i}
                          className="flex items-baseline justify-between gap-3 text-[11px] py-0.5 border-b border-slate-50 last:border-0"
                        >
                          <span className="text-slate-500 font-medium shrink-0">{f.label}:</span>
                          <span
                            className={`text-right font-semibold ${
                              f.label.toLowerCase().includes("amount")
                                ? "text-emerald-700 font-mono text-xs"
                                : "text-slate-900"
                            }`}
                          >
                            {f.value}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* 1-Click Interactive Buttons */}
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                        1-Click Mobile Actions
                      </p>

                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold shadow-2xs">
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-sm">👉</span>
                          <span className="truncate">Tap to Review &amp; 1-Click Approve</span>
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 text-emerald-700 shrink-0 ml-2" />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold">
                        <div className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-emerald-600 text-white shadow-2xs">
                          <Check className="h-3.5 w-3.5" />
                          <span>Instant Approve</span>
                        </div>
                        <div className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-slate-100 text-rose-700 border border-rose-200/60">
                          <span>❌ Instant Reject</span>
                        </div>
                      </div>
                    </div>

                    {/* Timestamp & double check */}
                    <div className="flex items-center justify-end gap-1 pt-1 text-[10px] text-slate-400">
                      <span>Just now</span>
                      <span className="font-bold text-sky-500 text-xs">✓✓</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Raw Monospace Text View */
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Plaintext WhatsApp Payload
                    </label>
                    <span className="text-[10px] text-slate-400">Markdown formatted for WhatsApp</span>
                  </div>
                  <div className="p-3.5 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto border border-slate-800 selection:bg-emerald-600">
                    {generatedLinks.whatsappMessage}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid sm:grid-cols-2 gap-2.5 pt-1">
                <Button
                  type="button"
                  className="h-11 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  onClick={() => {
                    window.open(generatedLinks.whatsappDirectUrl, "_blank", "noopener,noreferrer");
                  }}
                >
                  <FaWhatsapp className="h-4 w-4 shrink-0" />
                  Launch WhatsApp
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="h-11 border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs rounded-xl shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-2"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-600" />
                      Copied to Clipboard!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy Message Text
                    </>
                  )}
                </Button>
              </div>

              {/* Developer Webhook Simulation Box */}
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-5 items-center justify-center rounded px-1.5 bg-amber-100 text-amber-800 text-[10px] font-bold">
                    SIMULATION
                  </span>
                  <span className="text-[11px] text-slate-600 font-medium">
                    Test carrier inbound webhook callback:
                  </span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs font-semibold bg-white text-slate-800 border-slate-200 hover:bg-slate-100 hover:text-slate-900 cursor-pointer shadow-2xs self-end sm:self-auto"
                  disabled={isSimulatingApproval}
                  onClick={() => onSimulateApproval(generatedLinks.stepId)}
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                  {isSimulatingApproval ? "Simulating Webhook…" : "Simulate WhatsApp Approval"}
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Parses raw WhatsApp markdown message into structured fields for preview
 */
function parseMessage(raw: string) {
  const lines = raw.split("\n");
  let reference = "";
  const fields: { label: string; value: string }[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Check for *Label:* Value
    const match = line.match(/^\*([^*]+):\*\s*(.*)$/);
    if (match && match[1]) {
      const label = match[1].trim();
      const value = (match[2] || "").trim();

      if (label.toLowerCase() === "requisition") {
        reference = value;
        continue;
      }

      // Skip URLs in the details table
      if (value.startsWith("http://") || value.startsWith("https://")) {
        continue;
      }

      if (value) {
        fields.push({ label, value });
      }
    }
  }

  return { reference, fields };
}
