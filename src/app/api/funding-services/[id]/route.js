import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/requireAuth.js";

// =========================================================
// FUNDING SERVICE [id] API
//
// Employee    → Full access
// Super Admin → Full access
//
// Supported:
// PATCH → Activate / Deactivate
// DELETE → Delete funding service
// =========================================================


// =========================================================
// ACTIVATE / DEACTIVATE FUNDING SERVICE
// Employee    → Full access
// Super Admin → Full access
// =========================================================

export async function PATCH(request, { params }) {
  try {
    // =====================================================
    // AUTHENTICATION
    // =====================================================

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
          message: message || "Unauthorized",
        },
        {
          status: status || 401,
        }
      );
    }

    // =====================================================
    // ROLE VALIDATION
    // EMPLOYEE + SUPER_ADMIN = FULL ACCESS
    // =====================================================

    if (
      user?.role !== "EMPLOYEE" &&
      user?.role !== "SUPER_ADMIN"
    ) {
      return Response.json(
        {
          success: false,
          message:
            "You do not have permission to change funding program status.",
        },
        {
          status: 403,
        }
      );
    }

    // =====================================================
    // GET FUNDING SERVICE ID
    // =====================================================

    const { id } = await params;

    const fundingServiceId = Number(id);

    if (
      !id ||
      !Number.isInteger(fundingServiceId) ||
      fundingServiceId <= 0
    ) {
      return Response.json(
        {
          success: false,
          message: "Invalid funding service ID.",
        },
        {
          status: 400,
        }
      );
    }

    // =====================================================
    // CHECK FUNDING SERVICE EXISTS
    // =====================================================

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
          message: "Funding service not found.",
        },
        {
          status: 404,
        }
      );
    }

    // =====================================================
    // READ REQUEST BODY
    // =====================================================

    let body;

    try {
      body = await request.json();
    } catch (error) {
      console.error(
        "Funding service PATCH body parse error:",
        error
      );

      return Response.json(
        {
          success: false,
          message: "Invalid request body.",
        },
        {
          status: 400,
        }
      );
    }

    const { isActive } = body || {};

    // =====================================================
    // VALIDATE isActive
    // =====================================================

    if (typeof isActive !== "boolean") {
      return Response.json(
        {
          success: false,
          message:
            "isActive must be a boolean value.",
        },
        {
          status: 400,
        }
      );
    }

    // =====================================================
    // UPDATE FUNDING SERVICE STATUS
    // =====================================================

    const updatedService =
      await prisma.fundingService.update({
        where: {
          id: fundingServiceId,
        },
        data: {
          isActive,
        },
      });

    // =====================================================
    // LOG ACTION
    // =====================================================

    console.log(
      `[FundingService] ${fundingServiceId} ${
        isActive ? "ACTIVATED" : "DEACTIVATED"
      } by ${user?.email || "Unknown"} (${
        user?.role || "Unknown"
      })`
    );

    // =====================================================
    // SUCCESS RESPONSE
    // =====================================================

    return Response.json(
      {
        success: true,
        message: isActive
          ? "Funding program activated successfully."
          : "Funding program deactivated successfully.",
        fundingService: updatedService,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Activate/deactivate funding service error:",
      error
    );

    return Response.json(
      {
        success: false,
        message:
          error?.message ||
          "Failed to update funding program status.",
      },
      {
        status: 500,
      }
    );
  }
}


// =========================================================
// DELETE FUNDING SERVICE
// Employee    → Full access
// Super Admin → Full access
// =========================================================

export async function DELETE(request, { params }) {
  try {
    // =====================================================
    // AUTHENTICATION
    // =====================================================

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
          message: message || "Unauthorized",
        },
        {
          status: status || 401,
        }
      );
    }

    // =====================================================
    // ROLE VALIDATION
    // EMPLOYEE + SUPER_ADMIN = FULL ACCESS
    // =====================================================

    if (
      user?.role !== "EMPLOYEE" &&
      user?.role !== "SUPER_ADMIN"
    ) {
      return Response.json(
        {
          success: false,
          message:
            "You do not have permission to delete funding programs.",
        },
        {
          status: 403,
        }
      );
    }

    // =====================================================
    // GET FUNDING SERVICE ID
    // =====================================================

    const { id } = await params;

    const fundingServiceId = Number(id);

    if (
      !id ||
      !Number.isInteger(fundingServiceId) ||
      fundingServiceId <= 0
    ) {
      return Response.json(
        {
          success: false,
          message: "Invalid funding service ID.",
        },
        {
          status: 400,
        }
      );
    }

    // =====================================================
    // CHECK FUNDING SERVICE EXISTS
    // =====================================================

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
          message: "Funding service not found.",
        },
        {
          status: 404,
        }
      );
    }

    // =====================================================
    // DELETE FUNDING SERVICE
    // =====================================================

    await prisma.fundingService.delete({
      where: {
        id: fundingServiceId,
      },
    });

    // =====================================================
    // LOG ACTION
    // =====================================================

    console.log(
      `[FundingService] ${fundingServiceId} DELETED by ${
        user?.email || "Unknown"
      } (${user?.role || "Unknown"})`
    );

    // =====================================================
    // SUCCESS RESPONSE
    // =====================================================

    return Response.json(
      {
        success: true,
        message:
          "Funding service deleted successfully.",
        deletedId: fundingServiceId,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Delete funding service error:",
      error
    );

    return Response.json(
      {
        success: false,
        message:
          error?.message ||
          "Failed to delete funding service.",
      },
      {
        status: 500,
      }
    );
  }
}