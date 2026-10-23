
import { prisma } from "@/lib/prisma";
import { requireModifyPermission } from "@/lib/auth/requireAuth";
import * as XLSX from "xlsx";

export async function POST(request) {
  try {
    const { authorized, user, status, message } =
      await requireModifyPermission();

    if (!authorized) {
      return Response.json(
        { success: false, message },
        { status: status || 401 }
      );
    }

    console.log(`File upload by ${user.email} (${user.role})`);

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file.arrayBuffer !== "function") {
      return Response.json(
        {
          success: false,
          message: "Please upload an Excel or CSV file",
        },
        { status: 400 }
      );
    }

    const fileName = file.name.toLowerCase();
    const isExcel =
      fileName.endsWith(".xls") ||
      fileName.endsWith(".xlsx");
    const isCsv = fileName.endsWith(".csv");

    if (!isExcel && !isCsv) {
      return Response.json(
        {
          success: false,
          message:
            "Only .xls, .xlsx, and .csv files are allowed",
        },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const workbook = XLSX.read(buffer, { type: "buffer" });

    if (!workbook.SheetNames.length) {
      return Response.json(
        {
          success: false,
          message: "File does not contain any sheets",
        },
        { status: 400 }
      );
    }

    const worksheet =
      workbook.Sheets[workbook.SheetNames[0]];

    const rows = XLSX.utils.sheet_to_json(worksheet, {
      defval: null,
    });

    if (!rows.length) {
      return Response.json(
        {
          success: false,
          message: "File does not contain any data",
        },
        { status: 400 }
      );
    }

    const normalizeValue = (value) =>
      value == null ? "" : String(value).trim().toLowerCase();

    const getProgramId = (row) => {
      const identifierKeys = [
        "program id",
        "program_id",
        "programid",
        "funding program id",
        "funding_program_id",
        "funding id",
        "funding_id",
        "service id",
        "service_id",
        "id",
      ];

      for (const [key, value] of Object.entries(row)) {
        if (
          identifierKeys.includes(key.trim().toLowerCase()) &&
          value != null &&
          String(value).trim() !== ""
        ) {
          return normalizeValue(value);
        }
      }

      return "";
    };

    const getTitle = (row) =>
      row.title ||
      row.Title ||
      row["Funding Service"] ||
      row["Funding Service Name"] ||
      row["Service Name"] ||
      row["Program Name"] ||
      row["program name"] ||
      "Funding Opportunity";

    const getDescription = (row) =>
      row.description ||
      row.Description ||
      row["Funding Description"] ||
      null;

    // Fetch existing funding programs.
    const existingServices =
      await prisma.fundingService.findMany({
        select: {
          id: true,
          title: true,
          data: true,
        },
      });

    // Map each existing Program ID to its database record.
    // If older duplicate records exist, update the first matching record.
    const existingServicesByProgramId = new Map();

    for (const service of existingServices) {
      const existingData =
        service.data &&
        typeof service.data === "object" &&
        !Array.isArray(service.data)
          ? service.data
          : {};

      const existingProgramId = getProgramId(existingData);

      if (
        existingProgramId &&
        !existingServicesByProgramId.has(existingProgramId)
      ) {
        existingServicesByProgramId.set(
          existingProgramId,
          service
        );
      }
    }

    const processedIds = new Set();
    const createdServices = [];
    const updatedServices = [];

    let skippedInFile = 0;
    let skippedMissingId = 0;

    for (const row of rows) {
      const programId = getProgramId(row);

      // Skip rows without a Program ID.
      if (!programId) {
        skippedMissingId++;
        continue;
      }

      // Process each Program ID only once per uploaded file.
      if (processedIds.has(programId)) {
        skippedInFile++;
        continue;
      }

      processedIds.add(programId);

      const normalizedRow = { ...row };
      const title = String(getTitle(row)).trim();
      const description = getDescription(row);

      const existingService =
        existingServicesByProgramId.get(programId);

      if (existingService) {
        // Replace the existing record with the uploaded row.
        const updatedService =
          await prisma.fundingService.update({
            where: {
              id: existingService.id,
            },
            data: {
              title,
              description: description
                ? String(description)
                : null,
              data: normalizedRow,
            },
          });

        updatedServices.push({
          id: updatedService.id,
          title: updatedService.title,
          programId,
        });
      } else {
        // Insert a new record when the Program ID doesn't exist.
        const createdService =
          await prisma.fundingService.create({
            data: {
              title,
              description: description
                ? String(description)
                : null,
              data: normalizedRow,
            },
          });

        createdServices.push({
          id: createdService.id,
          title: createdService.title,
          programId,
        });

        // Prevent another insert for this ID during this upload.
        existingServicesByProgramId.set(programId, {
          id: createdService.id,
          title: createdService.title,
          data: normalizedRow,
        });
      }
    }

    const added = createdServices.length;
    const updated = updatedServices.length;
    const skipped = skippedInFile + skippedMissingId;

    return Response.json(
      {
        success: true,
        message:
          `Import completed: ${added} added, ` +
          `${updated} updated, ` +
          `${skippedInFile} duplicate rows skipped, ` +
          `${skippedMissingId} rows missing Program ID skipped.`,
        count: added,
        added,
        updated,
        skippedInFile,
        skippedMissingId,
        skipped,
        services: {
          created: createdServices,
          updated: updatedServices,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Excel/CSV upload error:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to import file",
        error: error.message,
      },
      { status: 500 }
    );
  }
}