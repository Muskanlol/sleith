export const PERMISSIONS_BY_ROLE = {
  ADMIN: [
    "customers.read", "customers.create", "customers.update", "customers.deactivate",
    "services.read", "services.create", "services.update", "services.deactivate",
    "staff.read", "staff.create", "staff.update", "staff.deactivate",
    "staff.manage_services", "staff.manage_availability", "staff.manage_leave",
    "users.read", "users.create", "users.update_role",
    "packages.read", "packages.create", "packages.update", "packages.deactivate",
  ],
  MANAGER: [
    "customers.read", "customers.create", "customers.update", "customers.deactivate",
    "services.read", "services.create", "services.update", "services.deactivate",
    "staff.read", "staff.create", "staff.update", "staff.deactivate",
    "staff.manage_services", "staff.manage_availability", "staff.manage_leave",
    "packages.read", "packages.create", "packages.update", "packages.deactivate",
  ],
  STAFF: [
    // "customers.read", "customers.create", "customers.update",
    "services.read",
    "staff.read",
    "packages.read",
  ],
  TRAINER: [],
};

export function getPermissionsForRole(role) {
  return PERMISSIONS_BY_ROLE[role] || [];
}