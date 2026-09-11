import { prisma } from "@/lib/prisma";
import { requireModifyPermission } from "@/lib/auth/requireAuth";

export async function GET() {
  try {
    const fundingServices =
      await prisma.fundingService.findMany({
        orderBy: {
          createdAt: "desc",
        },
      });

    return Response.json({
      success: true,
      fundingServices,
    });
  } catch (error) {
    console.error(
      "Funding services error:",
      error
    );

    return Response.json(
      {
        success: false,
        message:
          "Failed to fetch funding services",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request) {
  try {
    // -----------------------------------------
    // Authentication & Permission
    // -----------------------------------------
    // Only logged-in Employees and Super Admins
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
            message ||
            "Authentication required",
        },
        {
          status: status || 401,
        }
      );
    }

    // -----------------------------------------
    // Read request body
    // -----------------------------------------
    const body = await request.json();

    const {
      title,
      description,
      data,
    } = body;

    // -----------------------------------------
    // Validate funding data
    // -----------------------------------------
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
        {
          status: 400,
        }
      );
    }

    // -----------------------------------------
    // Clean submitted fields
    // -----------------------------------------
    const cleanedData = {};

    Object.entries(data).forEach(
      ([key, value]) => {
        const cleanKey =
          String(key).trim();

        if (!cleanKey) {
          return;
        }

        // Empty/null values
        if (
          value === null ||
          value === undefined
        ) {
          cleanedData[cleanKey] = "";
          return;
        }

        // Keep objects as they are
        if (
          typeof value === "object"
        ) {
          cleanedData[cleanKey] =
            value;
          return;
        }

        // Convert everything else to string
        cleanedData[cleanKey] =
          String(value).trim();
      }
    );

    // -----------------------------------------
    // Make sure at least one field is filled
    // -----------------------------------------
    const hasData =
      Object.values(cleanedData).some(
        (value) =>
          String(value ?? "").trim() !== ""
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

    // -----------------------------------------
    // Generate database title
    // -----------------------------------------
    // Program Name is NOT mandatory.
    //
    // If Program Name exists, use it.
    // Otherwise use "Funding Opportunity"
    // as the internal database title.
    const fundingTitle =
      String(
        cleanedData["Program Name"] || ""
      ).trim() ||
      (typeof title === "string" &&
      title.trim()
        ? title.trim()
        : "Funding Opportunity");

    // -----------------------------------------
    // Generate description
    // -----------------------------------------
    // If Purpose exists in the manual form,
    // use it as the description.
    //
    // Otherwise use the description supplied
    // by the request body.
    const fundingDescription =
      String(
        cleanedData["Purpose"] || ""
      ).trim() ||
      (typeof description === "string"
        ? description.trim()
        : "") ||
      null;

    // -----------------------------------------
    // Create funding service
    // -----------------------------------------
    const fundingService =
      await prisma.fundingService.create({
        data: {
          title: fundingTitle,

          description:
            fundingDescription,

          data: cleanedData,
        },
      });

    // -----------------------------------------
    // Log creation
    // -----------------------------------------
    console.log(
      `Funding service created by ${user.email} (${user.role}): #${fundingService.id}`
    );

    // -----------------------------------------
    // Success response
    // -----------------------------------------
    return Response.json(
      {
        success: true,
        message:
          "Funding data added successfully.",
        fundingService,
      },
      {
        status: 201,
      }
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
      {
        status: 500,
      }
    );
  }
}