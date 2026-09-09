import { getCurrentUser } from "@/lib/auth/session";

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    return {
      authorized: false,
      user: null,
    };
  }

  return {
    authorized: true,
    user,
  };
}

export async function requireModifyPermission() {
  const { authorized, user } = await requireAuth();

  if (!authorized) {
    return {
      authorized: false,
      user: null,
      status: 401,
      message: "Authentication required",
    };
  }

  if (user.role !== "EMPLOYEE" && user.role !== "SUPER_ADMIN") {
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
  };
}

export async function requireDeletePermission() {
  const { authorized, user } = await requireAuth();

  if (!authorized) {
    return {
      authorized: false,
      user: null,
      status: 401,
      message: "Authentication required",
    };
  }

  if (user.role !== "SUPER_ADMIN") {
    return {
      authorized: false,
      user,
      status: 403,
      message: "Only Super Admin can delete",
    };
  }

  return {
    authorized: true,
    user,
  };
}