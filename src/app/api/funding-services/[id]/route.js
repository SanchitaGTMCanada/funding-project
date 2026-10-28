
import { prisma } from "@/lib/prisma";
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

    const updated = await prisma.fundingService.update({
      where: {
        id: serviceId.id,
      },
      data: {
        title: title.trim(),

        description:
          description === undefined
            ? existing.description
            : description === null
              ? null
              : String(description).trim() || null,

        data,

        // Update featured status only when supplied.
        // Otherwise, preserve the existing value.
        ...(isFeatured !== undefined
          ? { isFeatured }
          : {}),
      },
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
    // Log the complete error in the server terminal.
    console.error("PUT funding service error:", error);

    // Return the actual error message to help diagnose
    // Prisma schema, database, or update failures.
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
// =========================================================
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

    const hasIsActive =
      Object.prototype.hasOwnProperty.call(
        body || {},
        "isActive"
      );

    const hasIsFeatured =
      Object.prototype.hasOwnProperty.call(
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

    let message = "Funding program updated successfully.";

    if (hasIsFeatured && !hasIsActive) {
      message = isFeatured
        ? "Funding program marked as featured."
        : "Funding program removed from featured programs.";
    } else if (hasIsActive && !hasIsFeatured) {
      message = isActive
        ? "Funding program activated successfully."
        : "Funding program deactivated successfully.";
    }

    return Response.json({
      success: true,
      message,
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
