
import { prisma } from "@/lib/prisma";
import { requireModifyPermission } from "@/lib/auth/requireAuth";
import * as XLSX from "xlsx";

export async function POST(request) {
  try {
    // Check authentication and modify permission
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

    console.log(
      `Excel upload by ${user.email} (${user.role})`
    );

    // Get uploaded file
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return Response.json(
        {
          success: false,
          message: "Please upload an Excel file",
        },
        { status: 400 }
      );
    }

    // Validate file type
    const fileName = file.name.toLowerCase();

    if (
      !fileName.endsWith(".xls") &&
      !fileName.endsWith(".xlsx")
    ) {
      return Response.json(
        {
          success: false,
          message:
            "Only .xls and .xlsx files are allowed",
        },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Read Excel workbook
    const workbook = XLSX.read(buffer, {
      type: "buffer",
    });

    if (!workbook.SheetNames.length) {
      return Response.json(
        {
          success: false,
          message:
            "Excel file does not contain any sheets",
        },
        { status: 400 }
      );
    }

    // Use the first worksheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert worksheet to JSON
    const rows = XLSX.utils.sheet_to_json(
      worksheet,
      {
        defval: null,
      }
    );

    if (!rows.length) {
      return Response.json(
        {
          success: false,
          message:
            "Excel file does not contain any data",
        },
        { status: 400 }
      );
    }

    const createdServices = [];

    // Create one funding service for each Excel row
    for (const row of rows) {
      const normalizedRow = {};

      // Preserve every Excel column dynamically
      for (const [key, value] of Object.entries(row)) {
        normalizedRow[key] = value;
      }

      // Detect funding service title
      const title =
        row.title ||
        row.Title ||
        row["Funding Service"] ||
        row["Funding Service Name"] ||
        row["Service Name"] ||
        "Funding Opportunity";

      // Detect description
      const description =
        row.description ||
        row.Description ||
        row["Funding Description"] ||
        null;

      // Save funding service
      const fundingService =
        await prisma.fundingService.create({
          data: {
            title: String(title),
            description: description
              ? String(description)
              : null,
            data: normalizedRow,
          },
        });

      createdServices.push(fundingService);
    }

    // Return successful response
    return Response.json(
      {
        success: true,
        message: `${createdServices.length} funding services imported successfully`,
        count: createdServices.length,
        services: createdServices.map(
          (service) => ({
            id: service.id,
            title: service.title,
          })
        ),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Excel upload error:",
      error
    );

    return Response.json(
      {
        success: false,
        message: "Failed to import Excel file",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
