import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/requireAuth";

export async function GET(request) {
  try {
    const { authorized, user, status, message } = await requireAuth();

    if (!authorized) {
      return Response.json(
        {
          success: false,
          message: message || "Authentication required.",
        },
        { status: status || 401 }
      );
    }

    // Activity logs are restricted to Super Admins.
    if (user?.role !== "SUPER_ADMIN") {
      return Response.json(
        {
          success: false,
          message: "You do not have permission to view activity logs.",
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);

    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number(searchParams.get("limit")) || 25)
    );

    const module = searchParams.get("module")?.trim();
    const action = searchParams.get("action")?.trim();
    const search = searchParams.get("search")?.trim();

    const where = {};

    if (module) {
      where.module = module;
    }

    if (action) {
      where.action = action;
    }

    if (search) {
      where.OR = [
        { userName: { contains: search } },
        { userRole: { contains: search } },
        { description: { contains: search } },
        { entityName: { contains: search } },
        { entityId: { contains: search } },
      ];
    }

    const [activityLogs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.activityLog.count({ where }),
    ]);

    return Response.json({
      success: true,
      activityLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Fetch activity logs error:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to fetch activity logs.",
      },
      { status: 500 }
    );
  }
}
