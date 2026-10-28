
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { requireAuth } from "@/lib/auth/requireAuth.js";

// =========================================================
// FUNDING SERVICE [id] API
//
// PUT    → Edit funding program details
// PATCH  → Update active status and/or featured status
// DELETE → Delete funding service
//
// Employee and Super Admin → Full access
// =========================================================

async function authorizeFundingServiceEdit() {
  const { authorized, user, status, message } =
    await requireAuth();

  if (!authorized) {
    return {
      authorized: false,
      user,
      response: Response.json(
        {
          success: false,
          message: message || "Unauthorized",
        },
        { status: status || 401 }
      ),
    };
  }

  if (
    user?.role !== "EMPLOYEE" &&
    user?.role !== "SUPER_ADMIN"
  ) {
    return {
      authorized: false,
      user,
      response: Response.json(
        {
          success: false,
          message:
            "You do not have permission to edit funding programs.",
        },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    user,
    response: null,
  };
}

async function getFundingServiceId(params) {
  const { id } = await params;
  const fundingServiceId = Number(id);

  if (
    !id ||
    !Number.isInteger(fundingServiceId) ||
    fundingServiceId <= 0
  ) {
    return {
      valid: false,
      response: Response.json(
        {
          success: false,
          message: "Invalid funding service ID.",
        },
        { status: 400 }
      ),
    };
  }

  return {
    valid: true,
    id: fundingServiceId,
  };
}

// =========================================================
// HELPERS — NORMALIZE CLASSIFICATION VALUES
// =========================================================

function normalizeClassificationArray(value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (Array.isArray(value)) {
    const cleaned = value
      .map((item) => String(item).trim())
      .filter(Boolean);

    return cleaned.length ? cleaned : null;
  }

  if (typeof value === "string") {
    const cleaned = value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    return cleaned.length ? cleaned : null;
  }

  return null;
}

function normalizeTerritory(value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (Array.isArray(value)) {
    const cleaned = value
      .map((item) => String(item).trim())
      .filter(Boolean);

    return cleaned.length ? cleaned : null;
  }

  const cleaned = String(value).trim();

  return cleaned || null;
}

// =========================================================
// PUT — EDIT FUNDING SERVICE
// =========================================================

export async function PUT(request, { params }) {
  try {
    const auth = await authorizeFundingServiceEdit();

    if (!auth.authorized) {
      return auth.response;
    }

    const serviceId = await getFundingServiceId(params);

    if (!serviceId.valid) {
      return serviceId.response;
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
      isFeatured,
    } = body || {};

    if (typeof title !== "string" || !title.trim()) {
      return Response.json(
        {
          success: false,
          message: "Title is required.",
        },
        { status: 400 }
      );
    }

    if (
      !data ||
      typeof data !== "object" ||
      Array.isArray(data)
    ) {
      return Response.json(
        {
          success: false,
          message: "Invalid funding program data.",
        },
        { status: 400 }
      );
    }

    if (
      isFeatured !== undefined &&
      typeof isFeatured !== "boolean"
    ) {
      return Response.json(
        {
          success: false,
          message: "isFeatured must be a boolean value.",
        },
        { status: 400 }
      );
    }

    const existing = await prisma.fundingService.findUnique({
      where: {
        id: serviceId.id,
      },
    });

    if (!existing) {
      return Response.json(
        {
          success: false,
          message: "Funding program not found.",
        },
        { status: 404 }
      );
    }

    // Start with the standard fields.
    const updateData = {
      title: title.trim(),

      description:
        description === undefined
          ? existing.description
          : description === null
            ? null
            : String(description).trim() || null,

      data,
    };

    // Update Who You Are only when the request includes it.
    // An explicit null or empty array clears the column.
    if (whoYouAre !== undefined) {
      const normalizedWhoYouAre =
        normalizeClassificationArray(whoYouAre);

      updateData.whoYouAre =
        normalizedWhoYouAre === null
          ? Prisma.DbNull
          : normalizedWhoYouAre;
    }

    // Update Territory only when the request includes it.
    if (territory !== undefined) {
      const normalizedTerritory =
        normalizeTerritory(territory);

      updateData.territory =
        normalizedTerritory === null
          ? Prisma.DbNull
          : normalizedTerritory;
    }

    // Update Category only when the request includes it.
    if (category !== undefined) {
      const normalizedCategory =
        normalizeClassificationArray(category);

      updateData.category =
        normalizedCategory === null
          ? Prisma.DbNull
          : normalizedCategory;
    }

    // Preserve the existing featured status when not supplied.
    if (isFeatured !== undefined) {
      updateData.isFeatured = isFeatured;
    }

    const updated = await prisma.fundingService.update({
      where: {
        id: serviceId.id,
      },
      data: updateData,
    });

    console.log(
      `[FundingService] ${serviceId.id} UPDATED by ${
        auth.user?.email || "Unknown"
      } (${auth.user?.role || "Unknown"})`
    );

    return Response.json({
      success: true,
      message: "Funding program updated successfully.",
      fundingService: updated,
    });
  } catch (error) {
    console.error("PUT funding service error:", error);

    return Response.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unknown error while updating funding program.",
        code: error?.code || null,
      },
      { status: 500 }
    );
  }
}

// =========================================================
// PATCH — UPDATE ACTIVE AND/OR FEATURED STATUS
//
// Activate:
// { "isActive": true }
//
// Deactivate:
// { "isActive": false }
//
// Feature a program:
// { "isFeatured": true }
//
// Remove featured status:
// { "isFeatured": false }
//
// Update both:
// { "isActive": true, "isFeatured": true }
// =========================================================

export async function PATCH(request, { params }) {
  try {
    const auth = await authorizeFundingServiceEdit();

    if (!auth.authorized) {
      return auth.response;
    }

    const serviceId = await getFundingServiceId(params);

    if (!serviceId.valid) {
      return serviceId.response;
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return Response.json(
        {
          success: false,
          message: "Invalid request body.",
        },
        { status: 400 }
      );
    }

    const { isActive, isFeatured } = body || {};

    const hasIsActive = Object.prototype.hasOwnProperty.call(
      body || {},
      "isActive"
    );

    const hasIsFeatured = Object.prototype.hasOwnProperty.call(
      body || {},
      "isFeatured"
    );

    if (!hasIsActive && !hasIsFeatured) {
      return Response.json(
        {
          success: false,
          message:
            "Provide isActive, isFeatured, or both.",
        },
        { status: 400 }
      );
    }

    if (
      hasIsActive &&
      typeof isActive !== "boolean"
    ) {
      return Response.json(
        {
          success: false,
          message: "isActive must be a boolean value.",
        },
        { status: 400 }
      );
    }

    if (
      hasIsFeatured &&
      typeof isFeatured !== "boolean"
    ) {
      return Response.json(
        {
          success: false,
          message: "isFeatured must be a boolean value.",
        },
        { status: 400 }
      );
    }

    const existingService =
      await prisma.fundingService.findUnique({
        where: {
          id: serviceId.id,
        },
      });

    if (!existingService) {
      return Response.json(
        {
          success: false,
          message: "Funding service not found.",
        },
        { status: 404 }
      );
    }

    const updateData = {};

    if (hasIsActive) {
      updateData.isActive = isActive;
    }

    if (hasIsFeatured) {
      updateData.isFeatured = isFeatured;
    }

    const updatedService =
      await prisma.fundingService.update({
        where: {
          id: serviceId.id,
        },
        data: updateData,
      });

    console.log(
      `[FundingService] ${serviceId.id} ${
        hasIsFeatured
          ? isFeatured
            ? "FEATURED"
            : "UNFEATURED"
          : isActive
            ? "ACTIVATED"
            : "DEACTIVATED"
      } by ${auth.user?.email || "Unknown"} (${
        auth.user?.role || "Unknown"
      })`
    );

    let responseMessage =
      "Funding program updated successfully.";

    if (hasIsFeatured && !hasIsActive) {
      responseMessage = isFeatured
        ? "Funding program marked as featured."
        : "Funding program removed from featured programs.";
    } else if (hasIsActive && !hasIsFeatured) {
      responseMessage = isActive
        ? "Funding program activated successfully."
        : "Funding program deactivated successfully.";
    }

    return Response.json({
      success: true,
      message: responseMessage,
      fundingService: updatedService,
    });
  } catch (error) {
    console.error(
      "Update funding service status error:",
      error
    );

    return Response.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to update funding program.",
        code: error?.code || null,
      },
      { status: 500 }
    );
  }
}

// =========================================================
// DELETE — DELETE FUNDING SERVICE
// =========================================================

export async function DELETE(request, { params }) {
  try {
    const auth = await authorizeFundingServiceEdit();

    if (!auth.authorized) {
      return auth.response;
    }

    const serviceId = await getFundingServiceId(params);

    if (!serviceId.valid) {
      return serviceId.response;
    }

    const existingService =
      await prisma.fundingService.findUnique({
        where: {
          id: serviceId.id,
        },
      });

    if (!existingService) {
      return Response.json(
        {
          success: false,
          message: "Funding service not found.",
        },
        { status: 404 }
      );
    }

    await prisma.fundingService.delete({
      where: {
        id: serviceId.id,
      },
    });

    console.log(
      `[FundingService] ${serviceId.id} DELETED by ${
        auth.user?.email || "Unknown"
      } (${auth.user?.role || "Unknown"})`
    );

    return Response.json({
      success: true,
      message: "Funding service deleted successfully.",
      deletedId: serviceId.id,
    });
  } catch (error) {
    console.error("Delete funding service error:", error);

    return Response.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to delete funding service.",
        code: error?.code || null,
      },
      { status: 500 }
    );
  }
}
