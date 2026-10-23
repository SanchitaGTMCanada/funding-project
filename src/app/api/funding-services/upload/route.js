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
        { status: status || 401 }
      );
    }

    console.log(
      `File upload by ${user.email} (${user.role})`
    );

    // Get uploaded file
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

    // Validate file type
    const fileName = file.name.toLowerCase();

    const isExcel =
      fileName.endsWith(".xls") ||
      fileName.endsWith(".xlsx");

    const isCsv = fileName.endsWith(".csv");

    if (!isExcel && !isCsv) {
      return Response.json(
        {
          success: false,
          message: "Only .xls, .xlsx, and .csv files are allowed",
        },
        { status: 400 }
      );
    }

    // Read uploaded file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const workbook = XLSX.read(buffer, {
      type: "buffer",
    });

    if (!workbook.SheetNames.length) {
      return Response.json(
        {
          success: false,
          message: "File does not contain any sheets",
        },
        { status: 400 }
      );
    }

    // Read first worksheet
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

    // Normalize identifiers consistently
    const normalizeValue = (value) =>
      value == null
        ? ""
        : String(value).trim().toLowerCase();

    // Detect common program identifier column names
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
          identifierKeys.includes(
            key.trim().toLowerCase()
          ) &&
          value != null &&
          String(value).trim() !== ""
        ) {
          return normalizeValue(value);
        }
      }

      return "";
    };

    // Detect funding service title
    const getTitle = (row) =>
      row.title ||
      row.Title ||
      row["Funding Service"] ||
      row["Funding Service Name"] ||
      row["Service Name"] ||
      row["Program Name"] ||
      row["program name"] ||
      "Funding Opportunity";

    // Fetch existing services from the database
    const existingServices =
      await prisma.fundingService.findMany({
        select: {
          id: true,
          title: true,
          data: true,
        },
      });

    // Build a set of existing Program IDs
    const existingIds = new Set();

    for (const service of existingServices) {
      const existingData =
        service.data &&
        typeof service.data === "object" &&
        !Array.isArray(service.data)
          ? service.data
          : {};

      const existingProgramId =
        getProgramId(existingData);

      if (existingProgramId) {
        existingIds.add(existingProgramId);
      }
    }

    // Track Program IDs in the current upload
    const uploadedIds = new Set();

    const createdServices = [];

    let skippedExisting = 0;
    let skippedInFile = 0;
    let skippedMissingId = 0;

    for (const row of rows) {
      // Preserve all uploaded columns
      const normalizedRow = { ...row };

      const programId = getProgramId(row);

      // Skip rows without a Program ID
      if (!programId) {
        skippedMissingId++;
        continue;
      }

      // Skip duplicate Program IDs within this file
      if (uploadedIds.has(programId)) {
        skippedInFile++;
        continue;
      }

      uploadedIds.add(programId);

      // If the Program ID already exists, do not insert it
      if (existingIds.has(programId)) {
        skippedExisting++;
        continue;
      }

      const title = String(getTitle(row)).trim();

      const description =
        row.description ||
        row.Description ||
        row["Funding Description"] ||
        null;

      // Insert only if the Program ID does not exist
      const fundingService =
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
        id: fundingService.id,
        title: fundingService.title,
        programId,
      });

      // Prevent duplicates later in the same upload
      existingIds.add(programId);
    }

    const added = createdServices.length;

    const skipped =
      skippedExisting +
      skippedInFile +
      skippedMissingId;

    return Response.json(
      {
        success: true,
        message:
          `Import completed: ${added} added, ` +
          `${skippedExisting} already existed, ` +
          `${skippedInFile} duplicate rows skipped, ` +
          `${skippedMissingId} rows missing Program ID skipped.`,
        count: added,
        skippedExisting,
        skippedInFile,
        skippedMissingId,
        skipped,
        services: createdServices,
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