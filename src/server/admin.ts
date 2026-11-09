// Server-side governance functions with Service Role & Audit Logging
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export interface AuthContextUser {
  id: string;
  email: string;
  roles: AppRole[];
  isAdmin: boolean;
}

export async function verifyAdminCaller(authHeader: string | null): Promise<AuthContextUser> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Unauthorized: Valid Bearer token required");
  }

  const token = authHeader.replace("Bearer ", "").trim();
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData?.user) {
    throw new Error("Unauthorized: Invalid session token");
  }

  const user = userData.user;
  const { data: rolesData, error: rolesError } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  if (rolesError) {
    throw new Error("Failed to verify caller authorization");
  }

  const roles = ((rolesData ?? []) as { role: AppRole }[]).map((r) => r.role);
  const isAdmin = roles.includes("admin") || roles.includes("cfo");

  if (!isAdmin) {
    throw new Error("Forbidden: Action requires CFO or Administrator privileges");
  }

  return {
    id: user.id,
    email: user.email ?? "",
    roles,
    isAdmin: true,
  };
}

export async function inviteUserServer(
  caller: AuthContextUser,
  params: {
    email: string;
    fullName: string;
    role: AppRole;
    companyIds?: string[];
    canEditCompanies?: boolean;
  },
) {
  const { email, fullName, role, companyIds = [], canEditCompanies = false } = params;

  // Invite user via Supabase Auth Admin API
  const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
    email.trim().toLowerCase(),
    {
      data: {
        full_name: fullName.trim(),
        role,
      },
    },
  );

  if (inviteError) {
    throw new Error(`Failed to invite user: ${inviteError.message}`);
  }

  const newUserId = inviteData.user.id;

  // Insert profile row
  await supabaseAdmin.from("profiles").upsert({
    id: newUserId,
    email: email.trim().toLowerCase(),
    full_name: fullName.trim(),
    designation:
      role === "cfo" ? "Virtual CFO" : role === "client_team" ? "Finance Team" : "Executive Client",
    is_active: true,
  });

  // Assign role
  await supabaseAdmin.from("user_roles").upsert({
    user_id: newUserId,
    role,
  });

  // Assign company access if provided
  if (companyIds.length > 0) {
    const accessRows = companyIds.map((cid) => ({
      user_id: newUserId,
      company_id: cid,
      can_edit: canEditCompanies,
    }));
    await supabaseAdmin.from("user_company_access").upsert(accessRows);
  }

  // Append to audit_log (append-only)
  await supabaseAdmin.from("audit_log").insert({
    actor_id: caller.id,
    actor_email: caller.email,
    action: "USER_INVITED",
    entity: "user",
    entity_id: newUserId,
    details: {
      email,
      fullName,
      role,
      companyIds,
      canEditCompanies,
    },
  });

  return { success: true, userId: newUserId };
}

export async function updateUserRoleServer(
  caller: AuthContextUser,
  params: {
    targetUserId: string;
    targetEmail?: string;
    newRole: AppRole;
  },
) {
  const { targetUserId, targetEmail = "", newRole } = params;

  // Replace existing roles with new role
  await supabaseAdmin.from("user_roles").delete().eq("user_id", targetUserId);
  const { error: insertRoleErr } = await supabaseAdmin.from("user_roles").insert({
    user_id: targetUserId,
    role: newRole,
  });

  if (insertRoleErr) {
    throw new Error(`Failed to update role: ${insertRoleErr.message}`);
  }

  // Update profile designation
  await supabaseAdmin
    .from("profiles")
    .update({
      designation:
        newRole === "cfo"
          ? "Virtual CFO"
          : newRole === "client_team"
            ? "Finance Team"
            : "Executive Client",
    })
    .eq("id", targetUserId);

  // Append to audit_log
  await supabaseAdmin.from("audit_log").insert({
    actor_id: caller.id,
    actor_email: caller.email,
    action: "USER_ROLE_CHANGED",
    entity: "user_roles",
    entity_id: targetUserId,
    details: {
      targetUserId,
      targetEmail,
      newRole,
    },
  });

  return { success: true };
}

export async function setUserCompanyAccessServer(
  caller: AuthContextUser,
  params: {
    targetUserId: string;
    companyId: string;
    canEdit: boolean;
    revoke?: boolean;
  },
) {
  const { targetUserId, companyId, canEdit, revoke = false } = params;

  if (revoke) {
    await supabaseAdmin
      .from("user_company_access")
      .delete()
      .eq("user_id", targetUserId)
      .eq("company_id", companyId);
  } else {
    await supabaseAdmin.from("user_company_access").upsert({
      user_id: targetUserId,
      company_id: companyId,
      can_edit: canEdit,
    });
  }

  // Append to audit_log
  await supabaseAdmin.from("audit_log").insert({
    actor_id: caller.id,
    actor_email: caller.email,
    action: revoke ? "COMPANY_ACCESS_REVOKED" : "COMPANY_ACCESS_GRANTED",
    entity: "user_company_access",
    entity_id: `${targetUserId}:${companyId}`,
    company_id: companyId,
    details: {
      targetUserId,
      companyId,
      canEdit,
      revoked: revoke,
    },
  });

  return { success: true };
}

export async function updateSecurityProtocolsServer(
  caller: AuthContextUser,
  protocols: {
    mfaRequired?: boolean;
    sessionTimeoutMinutes?: number;
    passwordMinLength?: number;
    requireSpecialChar?: boolean;
    requireNumber?: boolean;
    requireUppercase?: boolean;
    passwordRotationDays?: number;
    ipWhitelistingEnabled?: boolean;
    whitelistedIps?: string[];
  }
) {
  const { error } = await (supabaseAdmin as any).from("security_protocols").upsert({
    id: "default",
    mfa_required: protocols.mfaRequired ?? false,
    session_timeout_minutes: protocols.sessionTimeoutMinutes ?? 30,
    password_min_length: protocols.passwordMinLength ?? 8,
    require_special_char: protocols.requireSpecialChar ?? true,
    require_number: protocols.requireNumber ?? true,
    require_uppercase: protocols.requireUppercase ?? true,
    password_rotation_days: protocols.passwordRotationDays ?? 90,
    ip_whitelisting_enabled: protocols.ipWhitelistingEnabled ?? false,
    whitelisted_ips: protocols.whitelistedIps ?? [],
    updated_at: new Date().toISOString(),
    updated_by: caller.id,
  });

  if (error) {
    throw new Error(`Failed to update security protocols: ${error.message}`);
  }

  await supabaseAdmin.from("audit_log").insert({
    actor_id: caller.id,
    actor_email: caller.email,
    action: "SECURITY_PROTOCOLS_UPDATED",
    entity: "security_protocols",
    entity_id: "default",
    details: protocols,
  });

  return { success: true };
}
