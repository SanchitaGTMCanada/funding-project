import { getCurrentUser } from "@/lib/auth/session";


// =========================================================
// REQUIRE AUTHENTICATION
// =========================================================

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    return {
      authorized: false,
      user: null,
      status: 401,
      message: "Authentication required",
    };
  }

  return {
    authorized: true,
    user,
    status: 200,
    message: null,
  };
}


// =========================================================
// REQUIRE MODIFY PERMISSION
// =========================================================
// Employee + Super Admin
//
// Used for:
// - Creating funding services
// - Editing funding services
// - Uploading funding services
// =========================================================

export async function requireModifyPermission() {
  const {
    authorized,
    user,
  } = await requireAuth();

  if (!authorized) {
    return {
      authorized: false,
      user: null,
      status: 401,
      message: "Authentication required",
    };
  }

  // Employee and Super Admin can modify
  if (
    user.role !== "EMPLOYEE" &&
    user.role !== "SUPER_ADMIN"
  ) {
    return {
      authorized: false,
      user,
      status: 403,
      message: "You do not have permission to modify",
    };
  }

  return {
    authorized: true,
    user,
    status: 200,
    message: null,
  };
}


// =========================================================
// REQUIRE DELETE PERMISSION
// =========================================================
// Employee + Super Admin
//
// Both Employee and Super Admin can delete
// funding services.
// =========================================================

export async function requireDeletePermission() {
  const {
    authorized,
    user,
  } = await requireAuth();

  if (!authorized) {
    return {
      authorized: false,
      user: null,
      status: 401,
      message: "Authentication required",
    };
  }

  // Employee and Super Admin can delete
  if (
    user.role !== "EMPLOYEE" &&
    user.role !== "SUPER_ADMIN"
  ) {
    return {
      authorized: false,
      user,
      status: 403,
      message: "You do not have permission to delete",
    };
  }

  return {
    authorized: true,
    user,
    status: 200,
    message: null,
  };
}