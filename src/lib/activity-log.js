
import { prisma } from "@/lib/prisma";

// Fields that must never be stored in activity logs.
const SENSITIVE_KEYS = [
  "password",
  "passwordHash",
  "token",
  "accessToken",
  "refreshToken",
  "secret",
  "authorization",
  "cookie",
  "session",
];

function sanitizeValues(value) {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValues);
  }

  if (typeof value === "object") {
    const sanitized = {};

    for (const [key, item] of Object.entries(value)) {
      if (
        SENSITIVE_KEYS.some((sensitiveKey) =>
          key.toLowerCase().includes(sensitiveKey.toLowerCase())
        )
      ) {
        sanitized[key] = "[REDACTED]";
      } else {
        sanitized[key] = sanitizeValues(item);
      }
    }

    return sanitized;
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  return String(value);
}

export async function logActivity({
  userId = null,
  userName = null,
  userRole = null,

  action,
  module,
  description,

  entityId = null,
  entityName = null,

  oldValues = null,
  newValues = null,

  ipAddress = null,
  userAgent = null,

  source = "USER",

  // Optional Prisma transaction client.
  db = prisma,
}) {
  try {
    if (!action || !module || !description) {
      throw new Error(
        "Activity log requires action, module and description."
      );
    }

    return await db.activityLog.create({
      data: {
        userId,
        userName,
        userRole,

        action,
        module,
        description,

        entityId:
          entityId !== null ? String(entityId) : null,

        entityName,

        oldValues:
          oldValues !== null
            ? sanitizeValues(oldValues)
            : undefined,

        newValues:
          newValues !== null
            ? sanitizeValues(newValues)
            : undefined,

        ipAddress,
        userAgent,
        source,
      },
    });
  } catch (error) {
    console.error("Activity logging failed:", error);

    // Do not silently hide audit logging failures.
    throw error;
  }
}
