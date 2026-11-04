import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  SlidersHorizontal,
  Users,
  UserCheck,
  CreditCard,
  History,
  BadgeCheck,
  User,
  Plus,
  X,
} from "lucide-react";
import { useMe, can } from "@/lib/useMe";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import { RulesSection } from "@/components/settings/RulesSection";
import { TeamSection } from "@/components/settings/TeamSection";
import { DelegationsSection } from "@/components/settings/DelegationsSection";
import { BillingSection } from "@/components/settings/BillingSection";
import { AuditLogSection } from "@/components/settings/AuditLogSection";
import { NdpaComplianceSection } from "@/components/settings/NdpaComplianceSection";
import { ProfileSection } from "@/components/settings/ProfileSection";
import { Stepper } from "@/components/stepper/Stepper";

const SETTINGS_TABS = [
  { id: "rules", label: "Approval Rules", icon: <SlidersHorizontal className="h-3.5 w-3.5" /> },
  { id: "team", label: "Team & Permissions", icon: <Users className="h-3.5 w-3.5" /> },
  { id: "delegations", label: "Delegations (FR-2.6)", icon: <UserCheck className="h-3.5 w-3.5" /> },
  { id: "billing", label: "Subscription & Billing", icon: <CreditCard className="h-3.5 w-3.5" /> },
  { id: "audit", label: "Audit Log", icon: <History className="h-3.5 w-3.5" /> },
  { id: "ndpa", label: "NDPA Compliance", icon: <BadgeCheck className="h-3.5 w-3.5" /> },
  { id: "profile", label: "My Profile", icon: <User className="h-3.5 w-3.5" /> },
] as const;

type SettingsTab = (typeof SETTINGS_TABS)[number]["id"];

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Organization Settings — Kelvora" },
      {
        name: "description",
        content:
          "Edit approval thresholds, manage teammate roles and read the permanent approval audit log.",
      },
      { property: "og:title", content: "Settings — Kelvora" },
      { property: "og:description", content: "Configure approval routing for your organization." },
    ],
  }),
  component: Settings,
});

function Settings() {
  const me = useMe();
  const isAdmin = can(me.data?.roles, ["admin"]);
  const [showBuilder, setShowBuilder] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>("rules");
  const currentStep = SETTINGS_TABS.findIndex((t) => t.id === activeTab) + 1;

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">
      {/* 1. Executive Master Header */}
      <header className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">
              Organization Settings
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-normal leading-normal">
              Manage financial spend approval thresholds, team member role assignments, and
              governance audit records.
            </p>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-2.5 shrink-0">
              <Button
                onClick={() => setShowBuilder((prev) => !prev)}
                className={cn(
                  "h-9 px-4 rounded-lg text-xs font-semibold transition-all shadow-xs gap-1.5 cursor-pointer",
                  showBuilder
                    ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                    : "bg-[#0B1457] hover:bg-[#0001FF] text-white",
                )}
              >
                {showBuilder ? (
                  <>
                    <X className="h-3.5 w-3.5" />
                    <span>Close Designer</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5" />
                    <span>Create Policy Tier</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* 2. Executive Chevron Stepper Navigation */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as SettingsTab)}
        className="space-y-6"
      >
        <Stepper
          steps={SETTINGS_TABS.map((tab) => ({
            label: tab.label,
            icon: tab.icon,
          }))}
          currentStep={currentStep > 0 ? currentStep : 1}
          allStepsClickable
          onStepChange={(stepNumber) => {
            const selected = SETTINGS_TABS[stepNumber - 1];
            if (selected) {
              setActiveTab(selected.id);
            }
          }}
        />

        {/* Tab 1: Approval Rules */}
        <TabsContent value="rules" className="mt-0 space-y-6">
          <RulesSection
            isAdmin={isAdmin}
            showBuilder={showBuilder}
            setShowBuilder={setShowBuilder}
          />
        </TabsContent>

        {/* Tab 2: Team & Permissions */}
        <TabsContent value="team" className="mt-0">
          <TeamSection isAdmin={isAdmin} />
        </TabsContent>

        {/* Tab 3: Approval Authority Delegation (FR-2.6) */}
        <TabsContent value="delegations" className="mt-0">
          <DelegationsSection isAdmin={isAdmin} />
        </TabsContent>

        {/* Tab 4: Subscription & Virtual Account Billing (NFR-LOC.2) */}
        <TabsContent value="billing" className="mt-0">
          <BillingSection isAdmin={isAdmin} />
        </TabsContent>

        {/* Tab 5: Cryptographic Audit Log */}
        <TabsContent value="audit" className="mt-0">
          <AuditLogSection />
        </TabsContent>

        {/* Tab 6: NDPA Compliance & Regulatory Trust */}
        <TabsContent value="ndpa" className="mt-0">
          <NdpaComplianceSection isAdmin={isAdmin} />
        </TabsContent>

        {/* Tab 7: My Profile & Avatar */}
        <TabsContent value="profile" className="mt-0">
          <ProfileSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
