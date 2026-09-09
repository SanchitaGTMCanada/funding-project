export function isEmployee(user) {
  return user?.role === "EMPLOYEE";
}

export function isSuperAdmin(user) {
  return user?.role === "SUPER_ADMIN";
}

export function canModify(user) {
  return (
    user?.role === "EMPLOYEE" ||
    user?.role === "SUPER_ADMIN"
  );
}

export function canDelete(user) {
  return user?.role === "SUPER_ADMIN";
}
