import { z } from "zod";

export const authRoleSchema = z.enum(["user", "moderator", "admin"]);
export type AuthRole = z.infer<typeof authRoleSchema>;

const rolePriority: Record<AuthRole, number> = {
  user: 1,
  moderator: 2,
  admin: 3,
};

export function hasMinimumRole(currentRole: AuthRole, requiredRole: AuthRole): boolean {
  return rolePriority[currentRole] >= rolePriority[requiredRole];
}

export function assertHasRole(currentRole: AuthRole, allowedRoles: readonly AuthRole[]): void {
  const parsedAllowedRoles = z.array(authRoleSchema).min(1).parse(allowedRoles);

  if (!parsedAllowedRoles.includes(currentRole)) {
    throw new Error("Forbidden: role is not allowed");
  }
}
