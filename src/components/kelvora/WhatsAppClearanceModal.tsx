import React, { useState } from "react";
import { FaWhatsapp } from "react-icons/fa";
import {
  Smartphone,
  Copy,
  Sparkles,
  ExternalLink,
  Eye,
  Code2,
  Check,
  ArrowRight,
  Lock,
  X,
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
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl">
        {/* Header */}
        <div className="shrink-0 bg-white border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#25D366] text-white shadow-xs">
              <FaWhatsapp className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base font-semibold text-slate-900 tracking-tight">
                WhatsApp Clearance Channel
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5 leading-normal">
                Dispatch an instant, tokenized mobile approval link without password friction.
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {isGeneratingLinks ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
              <p className="text-xs text-slate-600 font-medium">
                Generating cryptographically secure single-use approval tokens…
              </p>
            </div>
          ) : generatedLinks ? (
            <>
              {/* Approver Target Banner */}
              <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-slate-50/70 px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100/80">
                    <Smartphone className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] font-medium text-slate-500 block truncate">
                      Approver Mobile
                    </span>
                    <span className="text-xs font-semibold text-slate-900 font-mono truncate block">
                      {generatedLinks.approverPhone || "+234 (Registered Approver)"}
                    </span>
                  </div>
                </div>

                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-200/70">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Delivery Ready
                </span>
              </div>

              {/* View Switcher Header Bar */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-semibold text-slate-800">
                    {viewMode === "preview" ? "Dispatch Preview" : "Raw Template Payload"}
                  </span>
                  <span className="hidden sm:inline-block text-[11px] text-slate-400">
                    {viewMode === "preview" ? "• Recipient WhatsApp chat view" : "• Direct API text"}
                  </span>
                </div>

                <div className="inline-flex shrink-0 rounded-lg border border-slate-200/70 bg-slate-100/80 p-0.5 text-xs">
                  <button
                    type="button"
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                      viewMode === "preview"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                    onClick={() => setViewMode("preview")}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Preview
                  </button>
                  <button
                    type="button"
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                      viewMode === "raw"
                        ? "bg-white text-slate-900 shadow-xs"
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
                <div className="rounded-2xl border border-slate-200/80 bg-[#EFEAE2] p-3.5 sm:p-5 shadow-inner">
                  {/* System Encryption Pill */}
                  <div className="flex items-center justify-center mb-3">
                    <span className="inline-flex items-center gap-1.5 text-[10px] text-slate-600 font-medium bg-white/85 backdrop-blur-xs border border-slate-200/60 px-3 py-1 rounded-full shadow-2xs">
                      <Lock className="h-2.5 w-2.5 text-slate-400" />
                      End-to-end encrypted dispatch • Single-use token
                    </span>
                  </div>

                  {/* WhatsApp Message Bubble */}
                  <div className="relative max-w-full sm:max-w-[92%] rounded-2xl rounded-tl-xs bg-white p-4 shadow-xs border border-slate-200/70 text-slate-800 space-y-3">
                    {/* Header */}
                    <div className="border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">
                          Kelvora Clearance
                        </span>
                        <span className="text-xs font-semibold text-slate-900">
                          Requisition Approval Required
                        </span>
                      </div>
                      {parsed?.reference && (
                        <span className="inline-block mt-1.5 font-mono text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200/60 px-2 py-0.5 rounded-md">
                          {parsed.reference}
                        </span>
                      )}
                    </div>

                    {/* Metadata fields */}
                    <div className="space-y-1.5 text-xs">
                      {parsed?.fields.map((f, i) => (
                        <div
                          key={i}
                          className="flex items-baseline justify-between gap-3 text-[11px] py-1 border-b border-slate-100/80 last:border-0"
                        >
                          <span className="text-slate-500 font-normal shrink-0">{f.label}</span>
                          <span
                            className={`text-right font-medium ${
                              f.label.toLowerCase().includes("amount")
                                ? "text-emerald-700 font-semibold font-mono text-xs"
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
                      <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                        Interactive Mobile Actions
                      </p>

                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-emerald-950 text-xs font-semibold shadow-2xs hover:bg-emerald-50 transition-colors">
                        <span className="truncate">Review &amp; 1-Click Approve</span>
                        <ExternalLink className="h-3.5 w-3.5 text-emerald-700 shrink-0 ml-2" />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold">
                        <div className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-emerald-600 text-white shadow-2xs">
                          <Check className="h-3.5 w-3.5" />
                          <span>Instant Approve</span>
                        </div>
                        <div className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-white text-rose-700 border border-rose-200/80 shadow-2xs">
                          <X className="h-3.5 w-3.5" />
                          <span>Instant Reject</span>
                        </div>
                      </div>
                    </div>

                    {/* Timestamp & double check */}
                    <div className="flex items-center justify-end gap-1 pt-1 text-[10px] text-slate-400 font-medium">
                      <span>Just now</span>
                      <span className="font-bold text-[#53bdeb] text-[11px]">✓✓</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Raw Monospace Text View */
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                      Plaintext WhatsApp Payload
                    </label>
                    <span className="text-[10px] text-slate-400">Markdown formatted for WhatsApp</span>
                  </div>
                  <div className="p-4 bg-slate-950 text-slate-100 rounded-xl font-mono text-[11px] whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto border border-slate-800 selection:bg-emerald-500/30">
                    {generatedLinks.whatsappMessage}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid sm:grid-cols-2 gap-2.5 pt-1">
                <Button
                  type="button"
                  className="h-10 bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1da850] text-white font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                  onClick={() => {
                    window.open(generatedLinks.whatsappDirectUrl, "_blank", "noopener,noreferrer");
                  }}
                >
                  <FaWhatsapp className="h-4 w-4 shrink-0" />
                  Launch WhatsApp
                  <ArrowRight className="h-3.5 w-3.5 ml-0.5" />
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="h-10 border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs rounded-xl shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-2"
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
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-md px-1.5 py-0.5 bg-slate-200/70 text-slate-600 text-[10px] font-bold tracking-wider uppercase">
                    Simulation
                  </span>
                  <span className="text-[11px] text-slate-600 font-medium">
                    Test carrier inbound webhook callback:
                  </span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs font-semibold bg-white text-slate-700 border-slate-200 hover:bg-slate-100 cursor-pointer shadow-2xs self-end sm:self-auto"
                  disabled={isSimulatingApproval}
                  onClick={() => onSimulateApproval(generatedLinks.stepId)}
                >
                  <Sparkles className="h-3 w-3 mr-1.5 text-amber-500" />
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
      let value = (match[2] || "").trim();

      if (label.toLowerCase() === "requisition") {
        reference = value;
        continue;
      }

      // Skip URLs in the details table
      if (value.startsWith("http://") || value.startsWith("https://")) {
        continue;
      }

      // Strip any leading emoji symbols from values for clean presentation
      value = value.replace(/^[✅⚠️❌👉📋\s]+/, "");

      if (value) {
        fields.push({ label, value });
      }
    }
  }

  return { reference, fields };
}
