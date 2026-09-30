import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Trash2,
  Search,
  Mail,
  UserPlus,
  Check,
  Copy,
  Key,
  UserCheck,
  UserX,
  AlertCircle,
  ExternalLink,
  Eye,
  EyeOff,
  Sparkles,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/lib/useMe";
import { UserAvatar } from "@/components/kelvora/UserAvatar";
import {
  updateMemberRoles,
  inviteTeammateFn,
  cancelInvitationFn,
  createSubUserFn,
  removeSubUserFn,
} from "@/lib/procurement.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ALL_ROLES, ROLE_CONFIG } from "./roleConfig";

export function TeamSection({ isAdmin }: { isAdmin: boolean }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["team"],
    queryFn: async () => {
      const [profiles, roles] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, email, department, avatar_url")
          .order("full_name"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      return {
        members: profiles.data ?? [],
        roles: roles.data ?? [],
      };
    },
  });

  const save = useMutation({
    mutationFn: (input: { targetUserId: string; roles: AppRole[] }) =>
      updateMemberRoles({ data: input }),
    onSuccess: async () => {
      toast.success("Member role authorizations updated.");
      await queryClient.invalidateQueries({ queryKey: ["team"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't update roles."),
  });

  const removeUser = useMutation({
    mutationFn: (targetUserId: string) => removeSubUserFn({ data: { targetUserId } }),
    onSuccess: async () => {
      toast.success("Teammate removed from organization.");
      setRemovingUserId(null);
      await queryClient.invalidateQueries({ queryKey: ["team"] });
    },
    onError: (e) => {
      setRemovingUserId(null);
      toast.error(e instanceof Error ? e.message : "Failed removing teammate.");
    },
  });

  const filteredMembers = (data?.members ?? []).filter((m) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (m.full_name || "").toLowerCase().includes(q) ||
      (m.email || "").toLowerCase().includes(q) ||
      (m.department || "").toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (roleFilter === "all") return true;

    const userRoles = (data?.roles ?? [])
      .filter((r) => r.user_id === m.id)
      .map((r) => r.role as string);
    return userRoles.includes(roleFilter);
  });

  return (
    <div className="space-y-6">
      {isAdmin && <ManageSubUsersCard />}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base sm:text-lg font-semibold tracking-tight text-slate-900">
                Team Directory &amp; Role Permissions
              </h2>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 border border-slate-200/80">
                {data?.members.length ?? 0} Teammates
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500 font-normal">
              Manage teammate role capabilities. Click any role badge to grant or revoke
              authorization.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search teammates…"
                className="h-9 rounded-lg border-slate-200 bg-white pl-8 text-xs font-medium text-slate-900 shadow-2xs focus-visible:border-[#0B1457] focus-visible:ring-1 focus-visible:ring-[#0B1457]/20"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="h-9 rounded-lg border-slate-200 bg-white text-xs font-medium text-slate-800 shadow-2xs w-36 cursor-pointer">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs font-medium">
                  All Roles
                </SelectItem>
                {ALL_ROLES.map((r) => (
                  <SelectItem key={r} value={r} className="text-xs font-medium">
                    {ROLE_CONFIG[r].shortLabel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-400 animate-pulse">
            Loading directory…
          </div>
        ) : !filteredMembers.length ? (
          <div className="py-16 text-center text-xs text-slate-500">
            No teammates found matching your search.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filteredMembers.map((member) => {
              const currentRoles = (data?.roles ?? [])
                .filter((r) => r.user_id === member.id)
                .map((r) => r.role as AppRole);

              const isRemoving = removingUserId === member.id;

              return (
                <div
                  key={member.id}
                  className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 sm:p-4.5 space-y-3.5 hover:border-slate-300 hover:shadow-2xs transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <UserAvatar
                        name={member.full_name}
                        email={member.email}
                        avatarUrl={member.avatar_url}
                        size="md"
                        className="h-9 w-9 rounded-lg"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-xs font-semibold text-slate-900">
                            {member.full_name || member.email}
                          </p>
                          {member.department && (
                            <span className="truncate rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 border border-slate-200/60">
                              {member.department}
                            </span>
                          )}
                        </div>
                        <p className="truncate text-[11px] text-slate-500 mt-0.5">{member.email}</p>
                      </div>
                    </div>

                    {isAdmin && (
                      <div>
                        {isRemoving ? (
                          <div className="flex items-center gap-1.5 bg-rose-50 p-1 rounded-md border border-rose-200">
                            <span className="text-[10px] text-rose-700 font-semibold px-1">
                              Remove?
                            </span>
                            <button
                              type="button"
                              onClick={() => removeUser.mutate(member.id)}
                              disabled={removeUser.isPending}
                              className="px-2 py-0.5 text-[10px] font-bold bg-rose-600 text-white rounded hover:bg-rose-700 cursor-pointer"
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={() => setRemovingUserId(null)}
                              className="px-1.5 py-0.5 text-[10px] text-slate-600 hover:text-slate-900 cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setRemovingUserId(member.id)}
                            title="Remove teammate from organization"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          >
                            <UserX className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-100 pt-3">
                    <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 mb-2">
                      <span>Assigned Capabilities</span>
                      <span>{currentRoles.length} Active</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {ALL_ROLES.map((role) => {
                        const active = currentRoles.includes(role);
                        const meta = ROLE_CONFIG[role];

                        return (
                          <button
                            key={role}
                            type="button"
                            disabled={!isAdmin || save.isPending}
                            title={isAdmin ? `Toggle ${meta.label}` : undefined}
                            onClick={() =>
                              save.mutate({
                                targetUserId: member.id,
                                roles: active
                                  ? currentRoles.filter((r) => r !== role)
                                  : [...currentRoles, role],
                              })
                            }
                            className={cn(
                              "flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium transition-all border cursor-pointer",
                              active
                                ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900 disabled:opacity-40",
                            )}
                          >
                            {active ? <Check className="h-3 w-3 text-slate-300" /> : null}
                            <span>{meta.shortLabel}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ManageSubUsersCard() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"create" | "invite">("create");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [roles, setRoles] = useState<AppRole[]>(["requester"]);
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true);
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    temporaryPassword?: string;
    fullName: string;
    roles: AppRole[];
    department?: string;
  } | null>(null);

  const invites = useQuery({
    queryKey: ["invitations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("org_invitations")
        .select("id, email, roles, status, created_at")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createSubUserMutation = useMutation({
    mutationFn: () =>
      createSubUserFn({
        data: {
          email: email.trim(),
          fullName: fullName.trim(),
          department: department.trim() || undefined,
          password: password.trim() || undefined,
          roles,
          sendEmail: sendWelcomeEmail,
          baseUrl: window.location.origin,
        },
      }),
    onSuccess: async (res) => {
      toast.success(`Sub-user ${res.fullName} created successfully!`);
      setCreatedCredentials({
        email: res.email,
        temporaryPassword: res.temporaryPassword,
        fullName: res.fullName,
        roles: (res.roles as AppRole[]) || roles,
        department: department.trim() || undefined,
      });
      setEmail("");
      setFullName("");
      setDepartment("");
      setPassword("");
      setRoles(["requester"]);
      await queryClient.invalidateQueries({ queryKey: ["team"] });
      await queryClient.invalidateQueries({ queryKey: ["invitations"] });
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Failed to create sub-user account."),
  });

  const sendInviteMutation = useMutation({
    mutationFn: () =>
      inviteTeammateFn({
        data: { email: email.trim(), roles, baseUrl: window.location.origin },
      }),
    onSuccess: async (result) => {
      toast.success(
        result.mode === "roles_updated"
          ? "Teammate already in organization — roles updated."
          : "Invitation dispatched successfully.",
      );
      setEmail("");
      setRoles(["requester"]);
      await queryClient.invalidateQueries({ queryKey: ["invitations"] });
      await queryClient.invalidateQueries({ queryKey: ["team"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed sending invite."),
  });

  const cancel = useMutation({
    mutationFn: (invitationId: string) => cancelInvitationFn({ data: { invitationId } }),
    onSuccess: async () => {
      toast.success("Invitation revoked.");
      await queryClient.invalidateQueries({ queryKey: ["invitations"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed revoking invite."),
  });

  function copyText(text: string, label: string) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard!`);
    }
  }

  const generateRandomPassword = () => {
    const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lowercase = "abcdefghjkmnpqrstuvwxyz";
    const numbers = "23456789";
    const symbols = "!@#$%";
    let pwd = "";
    pwd += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    pwd += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    pwd += numbers.charAt(Math.floor(Math.random() * numbers.length));
    pwd += symbols.charAt(Math.floor(Math.random() * symbols.length));
    const all = uppercase + lowercase + numbers + symbols;
    for (let i = 0; i < 8; i++) {
      pwd += all.charAt(Math.floor(Math.random() * all.length));
    }
    pwd = pwd.split("").sort(() => 0.5 - Math.random()).join("");
    setPassword(pwd);
    setShowPassword(true);
    toast.info("Secure password generated");
  };

  const copyAllCredentials = () => {
    if (!createdCredentials) return;
    const lines = [
      `Kelvora Workspace — Direct Sub-User Access`,
      `Login URL: ${window.location.origin}/auth`,
      `Full Name: ${createdCredentials.fullName}`,
      `Corporate Email: ${createdCredentials.email}`,
      createdCredentials.temporaryPassword ? `Temporary Password: ${createdCredentials.temporaryPassword}` : null,
      createdCredentials.roles?.length ? `Assigned Roles: ${createdCredentials.roles.map((r) => ROLE_CONFIG[r]?.shortLabel || r).join(", ")}` : null,
      createdCredentials.department ? `Department: ${createdCredentials.department}` : null,
    ].filter(Boolean);
    copyText(lines.join("\n"), "All login credentials");
  };

  const toggleRole = (role: AppRole) => {
    setRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  };

  const selectAllRoles = () => setRoles([...ALL_ROLES]);
  const resetDefaultRoles = () => setRoles(["requester"]);

  const isFormValid =
    fullName.trim().length >= 2 &&
    email.trim().length > 3 &&
    roles.length > 0 &&
    (!password || password.length >= 6);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0B1457] text-white">
            <UserPlus className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 tracking-tight">
              Add Sub-Users &amp; Teammate Management
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 font-normal">
              Directly provision sub-user accounts for immediate testing, or dispatch invitation links.
            </p>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center rounded-lg bg-slate-100 p-1 border border-slate-200/80">
          <button
            type="button"
            onClick={() => setTab("create")}
            className={cn(
              "px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer",
              tab === "create"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900",
            )}
          >
            Direct Provisioning
          </button>
          <button
            type="button"
            onClick={() => setTab("invite")}
            className={cn(
              "px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer",
              tab === "invite"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900",
            )}
          >
            Invite via Email
          </button>
        </div>
      </div>

      {createdCredentials && (
        <div className="p-5 rounded-xl bg-emerald-50/90 border border-emerald-300/80 shadow-xs space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-950">
                  Sub-User Account Active for {createdCredentials.fullName}
                </h3>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Account is immediately active and ready for immediate testing or corporate workflow access.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs bg-white text-emerald-900 border-emerald-300 hover:bg-emerald-100/60 font-semibold cursor-pointer"
                onClick={copyAllCredentials}
              >
                <Copy className="h-3.5 w-3.5 mr-1 text-emerald-700" /> Copy All Credentials
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-emerald-800 hover:text-emerald-950 hover:bg-emerald-100/50 cursor-pointer"
                onClick={() => setCreatedCredentials(null)}
              >
                Dismiss
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 pt-1 border-t border-emerald-200/60">
            <div className="rounded-lg bg-white/90 border border-emerald-200 p-2.5 space-y-1">
              <span className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wider">
                Teammate Identity
              </span>
              <p className="text-xs font-bold text-slate-900 truncate">
                {createdCredentials.fullName}
              </p>
              <p className="text-[11px] text-slate-600 truncate font-mono">
                {createdCredentials.email}
              </p>
            </div>

            <div className="rounded-lg bg-white/90 border border-emerald-200 p-2.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wider">
                  Initial Password
                </span>
                {createdCredentials.temporaryPassword && (
                  <button
                    type="button"
                    onClick={() =>
                      copyText(createdCredentials.temporaryPassword || "", "Password")
                    }
                    className="text-[11px] text-emerald-700 hover:text-emerald-900 font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="h-3 w-3" /> Copy
                  </button>
                )}
              </div>
              <p className="text-xs font-mono font-bold text-slate-900 break-all bg-emerald-100/50 px-2 py-1 rounded border border-emerald-200/70">
                {createdCredentials.temporaryPassword || "(unchanged)"}
              </p>
            </div>

            <div className="rounded-lg bg-white/90 border border-emerald-200 p-2.5 space-y-1 sm:col-span-2 lg:col-span-1">
              <span className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wider">
                Assigned Operational Roles
              </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {(createdCredentials.roles ?? []).map((role) => (
                  <span
                    key={role}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-100 text-emerald-900 border border-emerald-200"
                  >
                    <Check className="h-2.5 w-2.5 text-emerald-700" />
                    {ROLE_CONFIG[role]?.shortLabel ?? role}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "create" ? (
        /* Direct Provisioning Form */
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!isFormValid) return;
            createSubUserMutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="sub-name" className="text-xs font-medium text-slate-700">
                Full Name <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="sub-name"
                type="text"
                required
                className="h-10 rounded-lg text-xs"
                placeholder="e.g. Finance Approver"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sub-email" className="text-xs font-medium text-slate-700">
                Corporate Email Address <span className="text-rose-500">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  id="sub-email"
                  type="email"
                  required
                  className="h-10 rounded-lg pl-9 text-xs"
                  placeholder="finance@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sub-dept" className="text-xs font-medium text-slate-700">
                Department (Optional)
              </Label>
              <Input
                id="sub-dept"
                type="text"
                className="h-10 rounded-lg text-xs"
                placeholder="e.g. Treasury, Projects, Quality"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="sub-password" className="text-xs font-medium text-slate-700">
                  Initial Password (Optional — Auto-generated if blank)
                </Label>
                <button
                  type="button"
                  onClick={generateRandomPassword}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="h-3 w-3" /> Auto-Generate
                </button>
              </div>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  id="sub-password"
                  type={showPassword ? "text" : "password"}
                  minLength={6}
                  className="h-10 rounded-lg pl-9 pr-10 text-xs font-mono"
                  placeholder="Auto-generated if left blank (min 6 chars)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              {password && password.length < 6 && (
                <p className="text-[11px] text-rose-600 font-medium">
                  Password must be at least 6 characters long.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-slate-700">
                  Pre-assigned Operational Roles <span className="text-rose-500">*</span>
                </Label>
                <div className="flex items-center gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={selectAllRoles}
                    className="text-slate-500 hover:text-slate-900 hover:underline cursor-pointer font-medium"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={resetDefaultRoles}
                    className="text-slate-500 hover:text-slate-900 hover:underline cursor-pointer font-medium"
                  >
                    Default (Requester)
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {ALL_ROLES.map((role) => {
                  const active = roles.includes(role);
                  return (
                    <button
                      type="button"
                      key={role}
                      onClick={() => toggleRole(role)}
                      className={cn(
                        "flex items-center gap-1.5 h-8 rounded-lg px-2.5 text-xs font-medium transition-all border cursor-pointer",
                        active
                          ? "bg-[#0B1457] text-white border-[#0B1457] shadow-2xs"
                          : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900",
                      )}
                    >
                      {active && <Check className="h-3 w-3" />}
                      <span>{ROLE_CONFIG[role].shortLabel}</span>
                    </button>
                  );
                })}
              </div>
              {roles.length === 0 && (
                <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" /> Please select at least one role for this sub-user.
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={sendWelcomeEmail}
                onChange={(e) => setSendWelcomeEmail(e.target.checked)}
                className="rounded border-slate-300 text-[#0B1457] focus:ring-[#0B1457]"
              />
              <span>Send welcome email with credentials to sub-user</span>
            </label>

            <Button
              type="submit"
              disabled={createSubUserMutation.isPending || !isFormValid}
              className="h-10 px-5 rounded-lg bg-[#0B1457] hover:bg-[#0001FF] text-xs font-semibold text-white transition-colors shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {createSubUserMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Provisioning Account…</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Create &amp; Provision Sub-User</span>
                </>
              )}
            </Button>
          </div>
        </form>
      ) : (
        /* Invitation Form */
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendInviteMutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="invite-email" className="text-xs font-medium text-slate-700">
                Work Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  id="invite-email"
                  type="email"
                  required
                  className="h-10 rounded-lg border-slate-200 bg-white pl-9 text-xs font-medium text-slate-900 shadow-2xs focus-visible:border-[#0B1457] focus-visible:ring-1 focus-visible:ring-[#0B1457]/20"
                  placeholder="colleague@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Teammate will receive an organizational invitation with sign-in link.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">Pre-assigned Roles</Label>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {ALL_ROLES.map((role) => {
                  const active = roles.includes(role);
                  return (
                    <button
                      type="button"
                      key={role}
                      onClick={() =>
                        setRoles(active ? roles.filter((r) => r !== role) : [...roles, role])
                      }
                      className={cn(
                        "flex items-center gap-1.5 h-8 rounded-lg px-2.5 text-xs font-medium transition-all border cursor-pointer",
                        active
                          ? "bg-[#0B1457] text-white border-[#0B1457] shadow-2xs"
                          : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900",
                      )}
                    >
                      {active && <Check className="h-3 w-3" />}
                      <span>{ROLE_CONFIG[role].shortLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              disabled={sendInviteMutation.isPending || !email.trim()}
              className="h-9 px-5 rounded-lg bg-[#0B1457] hover:bg-[#0001FF] text-xs font-semibold text-white transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              {sendInviteMutation.isPending ? "Sending…" : "Dispatch Invitation"}
            </Button>
          </div>
        </form>
      )}

      {/* Pending Invites List */}
      {invites.data?.length ? (
        <div className="border-t border-slate-100 pt-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-600">
            <span>Pending Invitations ({invites.data.length})</span>
          </div>
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden bg-white">
            {invites.data.map((invite) => (
              <div
                key={invite.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-white"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold uppercase border border-slate-200/60">
                    {invite.email.slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900">{invite.email}</p>
                    <div className="mt-0.5 flex flex-wrap gap-1">
                      {(invite.roles ?? []).map((r: AppRole) => (
                        <span
                          key={r}
                          className="rounded-md bg-slate-100 border border-slate-200/60 px-1.5 py-0.5 text-[10px] font-medium text-slate-700"
                        >
                          {ROLE_CONFIG[r]?.shortLabel ?? r}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      copyText(
                        `${window.location.origin}/auth`,
                        "Workspace onboarding URL",
                      )
                    }
                    className="inline-flex h-7 items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-colors cursor-pointer"
                  >
                    <Copy className="h-3 w-3" /> Copy Join Link
                  </button>
                  <button
                    type="button"
                    onClick={() => cancel.mutate(invite.id)}
                    disabled={cancel.isPending}
                    className="inline-flex h-7 items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3" /> Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
