
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { requireModifyPermission } from "@/lib/auth/requireAuth";

// =========================================================
// HELPERS
// =========================================================

function normalizeJsonField(value) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  if (Array.isArray(value)) {
    const cleaned = value
      .map((item) => String(item).trim())
      .filter(Boolean);

    return cleaned.length ? cleaned : null;
  }

  if (typeof value === "string") {
    const cleaned = value.trim();

    return cleaned || null;
  }

  return value;
}

function normalizeData(data) {
  const cleanedData = {};

  Object.entries(data).forEach(([key, value]) => {
    const cleanKey = String(key).trim();

    if (!cleanKey) return;

    if (value === null || value === undefined) {
      cleanedData[cleanKey] = "";
    } else if (typeof value === "string") {
      cleanedData[cleanKey] = value.trim();
    } else {
      cleanedData[cleanKey] = value;
    }
  });

  return cleanedData;
}

// =========================================================
// GET FUNDING SERVICES
// =========================================================

export async function GET(request) {
  try {
    const user = await getCurrentUser();

    const { searchParams } = new URL(request.url);
    const isPublic = searchParams.get("public") === "true";

    const fundingServices = await prisma.fundingService.findMany({
      where: isPublic || !user ? { isActive: true } : {},
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
      { status: 500 }
    );
  }
}

// =========================================================
// POST / CREATE FUNDING SERVICE
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
        { status: status || 401 }
      );
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return Response.json(
        {
          success: false,
          message: "Invalid JSON request body.",
        },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      data,
      whoYouAre,
      territory,
      category,
      isFeatured = false,
    } = body || {};

    if (
      !data ||
      typeof data !== "object" ||
      Array.isArray(data)
    ) {
      return Response.json(
        {
          success: false,
          message: "Funding data must be a valid object.",
        },
        { status: 400 }
      );
    }

    if (typeof isFeatured !== "boolean") {
      return Response.json(
        {
          success: false,
          message: "isFeatured must be a boolean.",
        },
        { status: 400 }
      );
    }

    const cleanedData = normalizeData(data);

    const hasData = Object.values(cleanedData).some((value) => {
      if (value == null) return false;

      if (typeof value === "string") {
        return value.trim() !== "";
      }

      if (Array.isArray(value)) {
        return value.length > 0;
      }

      if (typeof value === "object") {
        return Object.keys(value).length > 0;
      }

      return true;
    });

    if (!hasData) {
      return Response.json(
        {
          success: false,
          message:
            "Please enter at least one funding detail before submitting.",
        },
        { status: 400 }
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

    // Support both dedicated request fields and legacy data fields.
    const resolvedWhoYouAre = normalizeJsonField(
      whoYouAre !== undefined
        ? whoYouAre
        : cleanedData["Applicant Types"]
    );

    const resolvedTerritory = normalizeJsonField(
      territory !== undefined
        ? territory
        : cleanedData.Locations
    );

    const resolvedCategory = normalizeJsonField(
      category !== undefined
        ? category
        : cleanedData.Category
    );

    const fundingService = await prisma.fundingService.create({
      data: {
        title: fundingTitle,
        description: fundingDescription,
        data: cleanedData,

        whoYouAre: resolvedWhoYouAre,
        territory: resolvedTerritory,
        category: resolvedCategory,

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
      { status: 201 }
    );
  } catch (error) {
    console.error("Create funding service error:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to add funding data.",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : undefined,
        code:
          process.env.NODE_ENV === "development"
            ? error.code || null
            : undefined,
      },
      { status: 500 }
    );
  }
}
