import { prisma } from "@/lib/prisma";
import { requireModifyPermission } from "@/lib/auth/requireAuth";

export async function GET() {
  try {
    const fundingServices = await prisma.fundingService.findMany({
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

export async function POST(request) {
  try {
    // Only logged-in employees and Super Admins
    // can manually add funding data.
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
          message:
            message || "Authentication required",
        },
        { status }
      );
    }

    const body = await request.json();

    const {
      title,
      description,
      data,
    } = body;

    // Validate title
    if (
      !title ||
      typeof title !== "string" ||
      !title.trim()
    ) {
      return Response.json(
        {
          success: false,
          message:
            "Funding service title is required.",
        },
        { status: 400 }
      );
    }

    // Validate data
    if (
      data === null ||
      typeof data !== "object" ||
      Array.isArray(data)
    ) {
      return Response.json(
        {
          success: false,
          message:
            "Funding data must be a valid object.",
        },
        { status: 400 }
      );
    }

    // Clean the submitted fields
    const cleanedData = {};

    Object.entries(data).forEach(
      ([key, value]) => {
        const cleanKey = String(key).trim();

        if (!cleanKey) {
          return;
        }

        if (
          value === null ||
          value === undefined
        ) {
          cleanedData[cleanKey] = "";
          return;
        }

        if (
          typeof value === "object"
        ) {
          cleanedData[cleanKey] =
            value;
          return;
        }

        cleanedData[cleanKey] =
          String(value);
      }
    );

    // Create funding service
    const fundingService =
      await prisma.fundingService.create({
        data: {
          title: title.trim(),

          description:
            description &&
            typeof description ===
              "string"
              ? description.trim() || null
              : null,

          data: cleanedData,
        },
      });

    console.log(
      `Funding service created by ${user.email}: #${fundingService.id}`
    );

    return Response.json(
      {
        success: true,
        message:
          "Funding data added successfully.",
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
        message:
          "Failed to add funding data.",
      },
      { status: 500 }
    );
  }
}