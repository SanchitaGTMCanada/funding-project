import { prisma } from "@/lib/prisma";
import {
  requireAuth,
  requireModifyPermission,
  requireDeletePermission,
} from "@/lib/auth/requireAuth";

// =========================================================
// UPDATE - Employee + Super Admin
// =========================================================

export async function PUT(request, { params }) {
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
          message,
        },
        {
          status: status || 401,
        }
      );
    }

    const { id } = await params;

    const fundingServiceId = Number(id);

    if (!Number.isInteger(fundingServiceId)) {
      return Response.json(
        {
          success: false,
          message: "Invalid funding service ID",
        },
        { status: 400 }
      );
    }

    const existingService =
      await prisma.fundingService.findUnique({
        where: {
          id: fundingServiceId,
        },
      });

    if (!existingService) {
      return Response.json(
        {
          success: false,
          message: "Funding service not found",
        },
        { status: 404 }
      );
    }

    const body = await request.json();

    const {
      title,
      description,
      data,
    } = body;

    if (!title || !String(title).trim()) {
      return Response.json(
        {
          success: false,
          message: "Funding service title is required",
        },
        { status: 400 }
      );
    }

    if (
      data !== undefined &&
      (typeof data !== "object" ||
        data === null ||
        Array.isArray(data))
    ) {
      return Response.json(
        {
          success: false,
          message:
            "Funding service data must be an object",
        },
        { status: 400 }
      );
    }

    const updatedService =
      await prisma.fundingService.update({
        where: {
          id: fundingServiceId,
        },
        data: {
          title: String(title).trim(),

          description:
            description !== undefined &&
            description !== null &&
            String(description).trim()
              ? String(description).trim()
              : null,

          ...(data !== undefined && {
            data,
          }),
        },
      });

    console.log(
      `Funding service ${fundingServiceId} updated by ${user.email} (${user.role})`
    );

    return Response.json({
      success: true,
      message:
        "Funding service updated successfully",
      fundingService: updatedService,
    });
  } catch (error) {
    console.error(
      "Update funding service error:",
      error
    );

    return Response.json(
      {
        success: false,
        message:
          "Failed to update funding service",
        error: error.message,
      },
      { status: 500 }
    );
  }
}


// =========================================================
// ACTIVATE / DEACTIVATE - Super Admin ONLY
// =========================================================

export async function PATCH(request, { params }) {
  try {
    const {
      authorized,
      user,
      status,
      message,
    } = await requireAuth();

    if (!authorized) {
      return Response.json(
        {
          success: false,
          message,
        },
        {
          status: status || 401,
        }
      );
    }

    // Only Super Admin can activate/deactivate
    if (user.role !== "SUPER_ADMIN") {
      return Response.json(
        {
          success: false,
          message:
            "Only Super Admin can activate or deactivate funding programs",
        },
        {
          status: 403,
        }
      );
    }

    const { id } = await params;

    const fundingServiceId = Number(id);

    if (!Number.isInteger(fundingServiceId)) {
      return Response.json(
        {
          success: false,
          message: "Invalid funding service ID",
        },
        { status: 400 }
      );
    }

    const existingService =
      await prisma.fundingService.findUnique({
        where: {
          id: fundingServiceId,
        },
      });

    if (!existingService) {
      return Response.json(
        {
          success: false,
          message: "Funding service not found",
        },
        { status: 404 }
      );
    }

    const body = await request.json();

    const { isActive } = body;

    if (typeof isActive !== "boolean") {
      return Response.json(
        {
          success: false,
          message: "isActive must be a boolean",
        },
        { status: 400 }
      );
    }

    const updatedService =
      await prisma.fundingService.update({
        where: {
          id: fundingServiceId,
        },
        data: {
          isActive,
        },
      });

    console.log(
      `Funding service ${fundingServiceId} ${
        isActive ? "activated" : "deactivated"
      } by ${user.email} (${user.role})`
    );

    return Response.json({
      success: true,
      message: isActive
        ? "Funding program activated successfully."
        : "Funding program deactivated successfully.",
      fundingService: updatedService,
    });
  } catch (error) {
    console.error(
      "Activate/deactivate funding service error:",
      error
    );

    return Response.json(
      {
        success: false,
        message:
          "Failed to update funding program status",
        error: error.message,
      },
      { status: 500 }
    );
  }
}


// =========================================================
// DELETE - Super Admin ONLY
// =========================================================

export async function DELETE(request, { params }) {
  try {
    const {
      authorized,
      user,
      status,
      message,
    } = await requireDeletePermission();

    if (!authorized) {
      return Response.json(
        {
          success: false,
          message,
        },
        {
          status: status || 401,
        }
      );
    }

    const { id } = await params;

    const fundingServiceId = Number(id);

    if (!Number.isInteger(fundingServiceId)) {
      return Response.json(
        {
          success: false,
          message: "Invalid funding service ID",
        },
        { status: 400 }
      );
    }

    const existingService =
      await prisma.fundingService.findUnique({
        where: {
          id: fundingServiceId,
        },
      });

    if (!existingService) {
      return Response.json(
        {
          success: false,
          message: "Funding service not found",
        },
        { status: 404 }
      );
    }

    await prisma.fundingService.delete({
      where: {
        id: fundingServiceId,
      },
    });

    console.log(
      `Funding service ${fundingServiceId} deleted by ${user.email} (${user.role})`
    );

    return Response.json({
      success: true,
      message:
        "Funding service deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete funding service error:",
      error
    );

    return Response.json(
      {
        success: false,
        message:
          "Failed to delete funding service",
        error: error.message,
      },
      { status: 500 }
    );
  }
}