import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  Clock,
  FolderKanban,
  User,
  AlertTriangle,
  Building2,
  Lock,
} from "lucide-react";

import { getApprovalTokenDetailsFn, decideApprovalByTokenFn } from "@/lib/procurement.functions";
import { money, shortDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/approve/$token")({
  head: () => ({
    meta: [
      { title: "One-Click Requisition Approval — Kelvora" },
      {
        name: "description",
        content: "Secure, real-time 1-click requisition approval via Email and WhatsApp.",
      },
      { property: "og:title", content: "One-Click Requisition Approval — Kelvora" },
      {
        property: "og:description",
        content: "Instant procurement clearance without login hurdles.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TokenApprovalPage,
});

function TokenApprovalPage() {
  const { token } = Route.useParams();
  const search = useSearch({ strict: false }) as { decision?: string };
  const [comment, setComment] = useState("");
  const [isDecided, setIsDecided] = useState(false);
  const [decisionOutcome, setDecisionOutcome] = useState<"approved" | "rejected" | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["token-approval", token],
    queryFn: () => getApprovalTokenDetailsFn({ data: { token } }),
    retry: false,
  });

  const decide = useMutation({
    mutationFn: (decision: "approved" | "rejected") =>
      decideApprovalByTokenFn({
        data: {
          token,
          decision,
          comment: comment.trim() || undefined,
        },
      }),
    onSuccess: (_result, decision) => {
      setIsDecided(true);
      setDecisionOutcome(decision);
      toast.success(
        decision === "approved"
          ? "Requisition successfully approved! Next clearance step or PO generation dispatched."
          : "Requisition rejected. Requisition initiator notified.",
      );
      refetch();
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Failed to record approval decision."),
  });

  // Security (NFR-SEC): Do NOT auto-execute decisions on simple page load.
  // Enterprise email gateways (Microsoft SafeLinks, Google Workspace) and WhatsApp link
  // preview bots crawl incoming links automatically with GET requests.
  // Auto-approving in useEffect would cause unauthorized corporate spend approvals without human intent.
  const preselectedDecision =
    search.decision === "approved" || search.decision === "rejected" ? search.decision : null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0B1457] border-t-transparent" />
          <p className="text-xs font-semibold text-slate-600">
            Verifying secure authorization link…
          </p>
        </div>
      </div>
    );
  }

  if (!data || data.status !== "VALID") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xs border border-slate-200/80 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 border border-slate-200/80">
            <Clock className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              {data?.status === "ALREADY_USED"
                ? "Decision Already Recorded"
                : "Invalid or Expired Link"}
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              {data?.error || "This authorization link has already been consumed or has expired."}
            </p>
          </div>
          <p className="text-[11px] text-slate-400 border-t border-slate-100 pt-3">
            Single-use clearance links expire after 72 hours or immediately following a recorded
            decision for corporate governance compliance.
          </p>
        </div>
      </div>
    );
  }

  const { requisition, step } = data;

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 sm:py-12 px-4 sm:px-6">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Brand Header */}
        <header className="flex items-center justify-between pb-4 border-b border-slate-200/80">
          <div className="flex items-center gap-3">
            <img
              src="/logo-kelvora.png"
              alt="Kelvora"
              className="h-8 w-auto object-contain"
            />
            <div className="hidden sm:block border-l border-slate-200 pl-3">
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                Executive Clearance Portal
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Lock className="h-3.5 w-3.5 text-slate-400" />
            <span className="hidden sm:inline">Secure Clearance Session</span>
            <span className="sm:hidden">Secure</span>
          </div>
        </header>

        {isDecided || requisition.status !== "pending_approval" ? (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-8 sm:p-10 text-center space-y-4 shadow-xs">
            <div
              className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${
                decisionOutcome === "rejected"
                  ? "bg-rose-50 text-rose-600 border border-rose-200/80"
                  : "bg-emerald-50 text-emerald-600 border border-emerald-200/80"
              }`}
            >
              {decisionOutcome === "rejected" ? (
                <XCircle className="h-7 w-7" />
              ) : (
                <CheckCircle2 className="h-7 w-7" />
              )}
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                {decisionOutcome === "rejected"
                  ? "Requisition Decision: Rejected"
                  : "Requisition Cleared Successfully"}
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                Your decision for requisition{" "}
                <span className="font-semibold text-slate-900">{requisition.reference}</span> has
                been logged to the permanent forensic audit trail.
              </p>
            </div>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                <Lock className="h-3 w-3" /> Token neutralized • Session terminated
              </span>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-6">
            {/* Requisition Meta Strip */}
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 border border-slate-200/70 px-2.5 py-1 rounded-md">
                  {requisition.reference}
                </span>
                {requisition.isUnbudgeted ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 text-[11px] font-medium text-amber-800">
                    <AlertTriangle className="h-3 w-3 text-amber-600" />
                    Unbudgeted Capex
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 text-[11px] font-medium text-emerald-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Budgeted Milestone
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-400 font-normal">
                Created {shortDate(requisition.createdAt)}
              </span>
            </div>

            {/* Title & Total Requested Spend */}
            <div className="space-y-3 pt-1">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">
                {requisition.title}
              </h1>

              <div className="pt-1 pb-3 border-b border-slate-100">
                <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block mb-0.5">
                  Total Requested Spend
                </span>
                <span className="text-3xl font-extrabold tracking-tight tabular-nums text-[#0B1457]">
                  {money(requisition.totalAmount, requisition.currency)}
                </span>
              </div>
            </div>

            {/* Structured Specifications Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-slate-200/80 rounded-xl overflow-hidden border border-slate-200/80">
              <div className="bg-slate-50/60 p-3.5 sm:p-4">
                <span className="text-[11px] font-medium text-slate-500 block">
                  Project Site
                </span>
                <div className="flex items-center gap-1.5 mt-1 font-semibold text-slate-900 text-xs">
                  <FolderKanban className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{requisition.projectName}</span>
                </div>
              </div>

              <div className="bg-slate-50/60 p-3.5 sm:p-4">
                <span className="text-[11px] font-medium text-slate-500 block">
                  Initiating Engineer
                </span>
                <div className="flex items-center gap-1.5 mt-1 font-semibold text-slate-900 text-xs">
                  <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">
                    {requisition.requesterName}
                    {requisition.requesterDepartment ? ` (${requisition.requesterDepartment})` : ""}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50/60 p-3.5 sm:p-4">
                <span className="text-[11px] font-medium text-slate-500 block">
                  Target Date On Site
                </span>
                <div className="flex items-center gap-1.5 mt-1 font-semibold text-slate-900 text-xs">
                  <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>
                    {requisition.neededBy
                      ? shortDate(requisition.neededBy)
                      : "Immediate Delivery"}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50/60 p-3.5 sm:p-4">
                <span className="text-[11px] font-medium text-slate-500 block">
                  Clearance Stage
                </span>
                <div className="flex items-center gap-1.5 mt-1 font-semibold text-[#0B1457] text-xs">
                  <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">
                    {step?.reason || `${step?.requiredRole} Approval`}
                  </span>
                </div>
              </div>
            </div>

            {/* Requested Line Items Table */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-slate-800 tracking-tight">
                  Itemised Bill of Quantities
                </h2>
                <span className="text-[11px] font-medium text-slate-500 bg-slate-100 border border-slate-200/60 px-2 py-0.5 rounded-full">
                  {requisition.items.length}{" "}
                  {requisition.items.length === 1 ? "line item" : "line items"}
                </span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-200/80 overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200/80 text-left">
                    <tr>
                      <th className="py-2.5 px-3.5 font-semibold text-[11px] uppercase tracking-wider text-slate-500">
                        Description
                      </th>
                      <th className="py-2.5 px-3.5 font-semibold text-[11px] uppercase tracking-wider text-slate-500 text-right">
                        Qty
                      </th>
                      <th className="py-2.5 px-3.5 font-semibold text-[11px] uppercase tracking-wider text-slate-500 text-right">
                        Unit Price
                      </th>
                      <th className="py-2.5 px-3.5 font-semibold text-[11px] uppercase tracking-wider text-slate-500 text-right">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {requisition.items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-3.5 font-medium text-slate-900">
                          {item.description}
                        </td>
                        <td className="py-3 px-3.5 text-right tabular-nums text-slate-600">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="py-3 px-3.5 text-right tabular-nums text-slate-600">
                          {money(item.estimatedUnitPrice, requisition.currency)}
                        </td>
                        <td className="py-3 px-3.5 text-right tabular-nums font-semibold text-slate-900">
                          {money(item.totalPrice, requisition.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t border-slate-200/80 bg-slate-50/50">
                    <tr>
                      <td
                        colSpan={3}
                        className="py-2.5 px-3.5 text-right font-semibold text-slate-600 text-xs"
                      >
                        Total
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-bold text-slate-900 tabular-nums text-xs">
                        {money(requisition.totalAmount, requisition.currency)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Optional Comment Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Approval Notes or Rejection Reason
                </label>
                <span className="text-[11px] text-slate-400">Optional</span>
              </div>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add compliance condition, delivery instructions, or rejection justification…"
                rows={2}
                className="text-xs resize-none rounded-xl border-slate-200 bg-slate-50/40 focus:bg-white transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Pre-Selected 1-Click Action Callout */}
            {preselectedDecision && (
              <div
                className={`p-3.5 rounded-xl border flex items-start gap-3 transition-colors ${
                  preselectedDecision === "approved"
                    ? "bg-emerald-50/60 border-emerald-200 text-emerald-950"
                    : "bg-rose-50/60 border-rose-200 text-rose-950"
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    preselectedDecision === "approved"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {preselectedDecision === "approved" ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                </div>
                <div className="text-xs">
                  <p className="font-semibold text-slate-900">
                    Direct Action Link: {preselectedDecision === "approved" ? "Approve" : "Reject"}{" "}
                    Requisition
                  </p>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    You arrived via your secure one-click link. Please review the itemised bill
                    above and confirm your decision below.
                  </p>
                </div>
              </div>
            )}

            {/* Primary Action Buttons */}
            <div className="grid sm:grid-cols-2 gap-3 pt-2">
              <Button
                type="button"
                size="lg"
                className={`w-full h-11 text-white font-semibold text-xs rounded-xl cursor-pointer shadow-xs transition-all flex items-center justify-center gap-2 ${
                  preselectedDecision === "approved"
                    ? "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 ring-2 ring-emerald-500/30"
                    : "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800"
                }`}
                disabled={decide.isPending}
                onClick={() => decide.mutate("approved")}
              >
                <CheckCircle2 className="h-4 w-4" />
                {decide.isPending
                  ? "Recording Decision…"
                  : preselectedDecision === "approved"
                    ? "Confirm & Approve Requisition"
                    : "Approve Requisition"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className={`w-full h-11 border-slate-200 text-rose-700 hover:bg-rose-50/60 hover:border-rose-200 font-semibold text-xs rounded-xl cursor-pointer shadow-2xs transition-all flex items-center justify-center gap-2 ${
                  preselectedDecision === "rejected" ? "ring-2 ring-rose-500/30" : ""
                }`}
                disabled={decide.isPending}
                onClick={() => decide.mutate("rejected")}
              >
                <XCircle className="h-4 w-4" />
                {preselectedDecision === "rejected"
                  ? "Confirm & Reject Requisition"
                  : "Reject Requisition"}
              </Button>
            </div>

            {/* Audit compliance footer note */}
            <div className="text-center pt-2">
              <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
                <Lock className="h-3 w-3 text-slate-400" />
                <span>Single-use clearance token • Audit trail compliant with NDPA 2023</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
