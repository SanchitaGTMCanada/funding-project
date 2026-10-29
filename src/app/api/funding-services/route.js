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

// Start Date and End Date are dedicated Prisma columns.
// Never keep them inside the dynamic JSON `data` object.
function normalizeData(data) {
  const cleanedData = {};

  Object.entries(data).forEach(([key, value]) => {
    const cleanKey = String(key).trim();

    if (!cleanKey) return;

    // Match names such as "Start Date", " start_date ",
    // "START-DATE", and "End   Date".
    const normalizedKey = cleanKey
      .toLowerCase()
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (
      normalizedKey === "start date" ||
      normalizedKey === "end date"
    ) {
      return;
    }

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
// GET FUNDING SERVICES + DATABASE COLUMN COUNT
// =========================================================

export async function GET(request) {
  try {
    const user = await getCurrentUser();

    const { searchParams } = new URL(request.url);
    const isPublic = searchParams.get("public") === "true";

    const [fundingServices, columnResult] = await Promise.all([
      prisma.fundingService.findMany({
        where: isPublic || !user ? { isActive: true } : {},
        orderBy: {
          id: "desc",
        },
      }),

      prisma.$queryRaw`
        SELECT COUNT(*) AS columnCount
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'funding_services'
      `,
    ]);

    // Count all physical database columns.
    const databaseColumnCount = Number(
      columnResult[0]?.columnCount ?? 0
    );

    // Count unique dynamic fields, excluding the dedicated date columns.
    const dynamicColumnSet = new Set([
      "Applicant Types",
      "Locations",
      "Category",
    ]);

    fundingServices.forEach((service) => {
      const data =
        service.data &&
        typeof service.data === "object" &&
        !Array.isArray(service.data)
          ? service.data
          : {};

      Object.keys(data).forEach((key) => {
        const cleanKey = String(key).trim();

        if (!cleanKey) return;

        const normalizedKey = cleanKey
          .toLowerCase()
          .replace(/[_-]+/g, " ")
          .replace(/\s+/g, " ")
          .trim();

        if (
          normalizedKey === "start date" ||
          normalizedKey === "end date"
        ) {
          return;
        }

        dynamicColumnSet.add(cleanKey);
      });
    });

    return Response.json({
      success: true,
      fundingServices,
      databaseColumnCount,
      dynamicColumnCount: dynamicColumnSet.size,
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
      startDate,
      endDate,
      isFeatured = false,
    } = body || {};

    // Validate funding data.
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

    // Validate dates as YYYY-MM-DD and store them in UTC.
    const normalizeDate = (value, fieldName) => {
      if (
        value === undefined ||
        value === null ||
        value === ""
      ) {
        return null;
      }

      if (typeof value !== "string") {
        throw new Error(
          `${fieldName} must be a valid date.`
        );
      }

      const dateValue = value.trim();
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(
        dateValue
      );

      if (!match) {
        throw new Error(
          `${fieldName} must use YYYY-MM-DD format.`
        );
      }

      const year = Number(match[1]);
      const month = Number(match[2]);
      const day = Number(match[3]);

      const parsed = new Date(
        Date.UTC(year, month - 1, day)
      );

      if (
        parsed.getUTCFullYear() !== year ||
        parsed.getUTCMonth() !== month - 1 ||
        parsed.getUTCDate() !== day
      ) {
        throw new Error(
          `${fieldName} is not a valid calendar date.`
        );
      }

      return parsed;
    };

    let normalizedStartDate;
    let normalizedEndDate;

    try {
      normalizedStartDate = normalizeDate(
        startDate,
        "Start Date"
      );

      normalizedEndDate = normalizeDate(
        endDate,
        "End Date"
      );
    } catch (dateError) {
      return Response.json(
        {
          success: false,
          message: dateError.message,
        },
        { status: 400 }
      );
    }

    if (
      normalizedStartDate &&
      normalizedEndDate &&
      normalizedEndDate < normalizedStartDate
    ) {
      return Response.json(
        {
          success: false,
          message:
            "End Date cannot be earlier than Start Date.",
        },
        { status: 400 }
      );
    }

    // This removes Start Date and End Date from JSON data,
    // even if the client accidentally sends them.
    const cleanedData = normalizeData(data);

    const hasData = Object.values(cleanedData).some(
      (value) => {
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
      }
    );

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
      (
        typeof title === "string" && title.trim()
          ? title.trim()
          : "Funding Opportunity"
      );

    const fundingDescription =
      String(cleanedData["Purpose"] || "").trim() ||
      (
        typeof description === "string"
          ? description.trim()
          : ""
      ) ||
      null;

    // Preserve existing classification behavior.
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

    // Create the funding service with dedicated date columns.
    const fundingService = await prisma.fundingService.create({
      data: {
        title: fundingTitle,
        description: fundingDescription,
        data: cleanedData,

        whoYouAre: resolvedWhoYouAre,
        territory: resolvedTerritory,
        category: resolvedCategory,

        startDate: normalizedStartDate,
        endDate: normalizedEndDate,

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
    console.error(
      "Create funding service error:",
      error
    );

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