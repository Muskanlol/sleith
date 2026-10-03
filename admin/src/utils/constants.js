export function isFutureCalendarDate(isoDate) {
  if (!isoDate) return false;
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return String(isoDate).slice(0, 10) > today;
}

export const ROLES = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  STAFF: "STAFF",
  TRAINER: "TRAINER",
  CUSTOMER: "CUSTOMER",
};

export const NAV_ITEMS = [
  { path: "/admin/dashboard", label: "Dashboard", roles: [ROLES.ADMIN, ROLES.MANAGER] },
  { path: "/admin/users", label: "Users", roles: [ROLES.ADMIN] },

  { path: "/admin/customers", label: "Customers", roles: [ROLES.ADMIN, ROLES.MANAGER], group: "salon" },
  { path: "/admin/services", label: "Services", roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF], group: "salon" },
  { path: "/admin/staff", label: "Staff", roles: [ROLES.ADMIN, ROLES.MANAGER], group: "salon" },
  { path: "/admin/packages", label: "Packages", roles: [ROLES.ADMIN, ROLES.MANAGER], group: "salon" },
  { path: "/admin/appointments", label: "Appointments", roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF], group: "salon" },
  { path: "/admin/reviews", label: "Reviews", roles: [ROLES.ADMIN, ROLES.MANAGER], group: "salon" },
  { path: "/admin/payments", label: "Payments", roles: [ROLES.ADMIN], group: "salon" },
  { path: "/admin/salary", label: "Salary", roles: [ROLES.ADMIN], group: "salon" },

  { path: "/admin/reports/revenue", label: "Revenue", roles: [ROLES.ADMIN], group: "reports" },

  { path: "/admin/gallery", label: "Gallery", roles: [ROLES.ADMIN, ROLES.MANAGER] },
  { path: "/admin/contact-inquiries", label: "Contact Inquiries", roles: [ROLES.ADMIN, ROLES.MANAGER] },
];

export const ACADEMY_NAV_ITEMS = [
  { path: "/admin/academy/applications", label: "Applications", roles: [ROLES.ADMIN, ROLES.MANAGER] },
  { path: "/admin/academy/students", label: "Students", roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.TRAINER] },
  { path: "/admin/academy/trainers", label: "Trainers", roles: [ROLES.ADMIN, ROLES.MANAGER] },
  { path: "/admin/academy/batches", label: "Batches", roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.TRAINER] },
  { path: "/admin/academy/courses", label: "Courses", roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.TRAINER] },
  { path: "/admin/academy/attendance", label: "Attendance", roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.TRAINER] },
  { path: "/admin/academy/assessments", label: "Assessments", roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.TRAINER] },
  { path: "/admin/academy/practical", label: "Practical", roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.TRAINER] },
  { path: "/admin/academy/certificates", label: "Certificates", roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.TRAINER] },
  { path: "/admin/academy/payments", label: "Payments", roles: [ROLES.ADMIN] },
  { path: "/admin/academy/salary", label: "Salary", roles: [ROLES.ADMIN] },
];

export const ALL_NAV_ITEMS = [...NAV_ITEMS, ...ACADEMY_NAV_ITEMS];