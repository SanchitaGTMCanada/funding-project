// =========================================================
// ACTIVATE / DEACTIVATE
// Employee  → Deactivate ONLY
// Super Admin → Activate + Deactivate
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

    // =====================================================
    // EMPLOYEE PERMISSION
    // Employees can ONLY deactivate
    // =====================================================

    if (
      user.role === "EMPLOYEE" &&
      isActive === true
    ) {
      return Response.json(
        {
          success: false,
          message:
            "Employees are not allowed to activate funding programs",
        },
        { status: 403 }
      );
    }

    // =====================================================
    // ROLE VALIDATION
    // =====================================================

    if (
      user.role !== "EMPLOYEE" &&
      user.role !== "SUPER_ADMIN"
    ) {
      return Response.json(
        {
          success: false,
          message:
            "You do not have permission to change funding program status",
        },
        { status: 403 }
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