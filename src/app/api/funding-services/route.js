
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { requireModifyPermission } from "@/lib/auth/requireAuth";

// =========================================================
// GET FUNDING SERVICES
// =========================================================
// Public/customer page:
//   - Returns ACTIVE programs only
//
// Dashboard:
//   - Authenticated users can see ALL programs
//
// Public request:
//   /api/funding-services?public=true
//
// Dashboard request:
//   /api/funding-services
// =========================================================

export async function GET(request) {
  try {
    const user = await getCurrentUser();

    const { searchParams } = new URL(request.url);
    const isPublic = searchParams.get("public") === "true";

    const fundingServices = await prisma.fundingService.findMany({
      where:
        isPublic || !user
          ? {
              isActive: true,
            }
          : {},

      orderBy: {
        createdAt: "desc",
      },
    });

    return Response.json({
      success: true,
      fundingServices,
    });
  } catch (error) {
    console.error("Funding services error:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to fetch funding services",
      },
      {
        status: 500,
      }
    );
  }
}

// =========================================================
// POST / CREATE FUNDING SERVICE
// =========================================================
// Employee + Super Admin
//
// New services:
//   - Active by default
//   - Not featured by default
// =========================================================

export async function POST(request) {
  try {
    const {
      authorized,
      user,
      status,
      message,
    } = await requireModifyPermission();

    if (!authorized) {
      return Response.json(
        {
          success: false,
          message: message || "Authentication required",
        },
        {
          status: status || 401,
        }
      );
    }

    const body = await request.json();

    const {
      title,
      description,
      data,
      isFeatured = false,
    } = body;

    if (
      data === null ||
      typeof data !== "object" ||
      Array.isArray(data)
    ) {
      return Response.json(
        {
          success: false,
          message: "Funding data must be a valid object.",
        },
        {
          status: 400,
        }
      );
    }

    if (typeof isFeatured !== "boolean") {
      return Response.json(
        {
          success: false,
          message: "isFeatured must be a boolean.",
        },
        {
          status: 400,
        }
      );
    }

    const cleanedData = {};

    Object.entries(data).forEach(([key, value]) => {
      const cleanKey = String(key).trim();

      if (!cleanKey) {
        return;
      }

      if (value === null || value === undefined) {
        cleanedData[cleanKey] = "";
        return;
      }

      if (typeof value === "object") {
        cleanedData[cleanKey] = value;
        return;
      }

      cleanedData[cleanKey] = String(value).trim();
    });

    const hasData = Object.values(cleanedData).some(
      (value) => String(value ?? "").trim() !== ""
    );

    if (!hasData) {
      return Response.json(
        {
          success: false,
          message:
            "Please enter at least one funding detail before submitting.",
        },
        {
          status: 400,
        }
      );
    }

    const fundingTitle =
      String(cleanedData["Program Name"] || "").trim() ||
      (typeof title === "string" && title.trim()
        ? title.trim()
        : "Funding Opportunity");

    const fundingDescription =
      String(cleanedData["Purpose"] || "").trim() ||
      (typeof description === "string"
        ? description.trim()
        : "") ||
      null;

    const fundingService = await prisma.fundingService.create({
      data: {
        title: fundingTitle,
        description: fundingDescription,
        data: cleanedData,
        isActive: true,
        isFeatured,
      },
    });

    console.log(
      `Funding service created by ${user.email} (${user.role}): #${fundingService.id}`
    );

    return Response.json(
      {
        success: true,
        message: "Funding data added successfully.",
        fundingService,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("Create funding service error:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to add funding data.",
      },
      {
        status: 500,
      }
    );
  }
}
