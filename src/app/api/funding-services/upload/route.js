import { prisma } from "@/lib/prisma";

import { requireModifyPermission } from "@/lib/auth/requireAuth";

import { Prisma } from "@prisma/client";

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

          message: "Please upload an Excel or CSV file.",

        },

        { status: 400 }

      );

    }



    const fileName = String(file.name || "").toLowerCase();

    const isExcel =

      fileName.endsWith(".xls") || fileName.endsWith(".xlsx");

    const isCsv = fileName.endsWith(".csv");



    if (!isExcel && !isCsv) {

      return Response.json(

        {

          success: false,

          message: "Only .xls, .xlsx, and .csv files are allowed.",

        },

        { status: 400 }

      );

    }



    const bytes = await file.arrayBuffer();

    const buffer = Buffer.from(bytes);



    // Read CSV as UTF-8 to preserve emojis and other Unicode.

    const workbook = isCsv

      ? XLSX.read(

          new TextDecoder("utf-8")

            .decode(bytes)

            .replace(/^\uFEFF/, ""),

          {

            type: "string",

            codepage: 65001,

          }

        )

      : XLSX.read(buffer, {

          type: "buffer",

        });



    if (!workbook.SheetNames.length) {

      return Response.json(

        {

          success: false,

          message: "File does not contain any sheets.",

        },

        { status: 400 }

      );

    }



    const worksheet = workbook.Sheets[workbook.SheetNames[0]];



    const rows = XLSX.utils.sheet_to_json(worksheet, {

      defval: null,

    });



    if (!rows.length) {

      return Response.json(

        {

          success: false,

          message: "File does not contain any data.",

        },

        { status: 400 }

      );

    }



    // Replace literal question marks in imported string values.

    const replaceQuestionMarks = (value) => {

      if (typeof value === "string") {

        return value.replace(/\?/g, "-");

      }



      if (Array.isArray(value)) {

        return value.map(replaceQuestionMarks);

      }



      if (

        value &&

        typeof value === "object" &&

        !(value instanceof Date)

      ) {

        return Object.fromEntries(

          Object.entries(value).map(([key, item]) => [

            key,

            replaceQuestionMarks(item),

          ])

        );

      }



      return value;

    };



    const normalizeKey = (key) =>

      String(key)

        .toLowerCase()

        .replace(/[^a-z0-9]/g, "");



    const normalizeValue = (value) =>

      value == null ? "" : String(value).trim().toLowerCase();



    const getColumnValue = (row, aliases) => {

      const acceptedKeys = new Set(aliases.map(normalizeKey));



      for (const [key, value] of Object.entries(row)) {

        if (acceptedKeys.has(normalizeKey(key))) {

          return value;

        }

      }



      return null;

    };



    // Convert CSV/Excel dates to UTC Date objects for Prisma.

    // Empty cells become null; invalid dates return undefined.

    const normalizeImportedDate = (value) => {

      if (value == null || String(value).trim() === "") {

        return null;

      }



      if (value instanceof Date) {

        if (Number.isNaN(value.getTime())) return undefined;



        return new Date(

          Date.UTC(

            value.getUTCFullYear(),

            value.getUTCMonth(),

            value.getUTCDate()

          )

        );

      }



      // Excel can represent dates as serial numbers.

      if (typeof value === "number" && Number.isFinite(value)) {

        const parts = XLSX.SSF.parse_date_code(value);



        if (!parts || !parts.y || !parts.m || !parts.d) {

          return undefined;

        }



        return new Date(

          Date.UTC(parts.y, parts.m - 1, parts.d)

        );

      }



      const text = String(value).trim();



      // YYYY-MM-DD or an ISO date/time.

      let match = text.match(

        /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s].*)?$/

      );



      if (match) {

        const year = Number(match[1]);

        const month = Number(match[2]);

        const day = Number(match[3]);



        const date = new Date(Date.UTC(year, month - 1, day));



        if (

          date.getUTCFullYear() !== year ||

          date.getUTCMonth() !== month - 1 ||

          date.getUTCDate() !== day

        ) {

          return undefined;

        }



        return date;

      }



      // Accept common day/month/year and month/day/year formats.

      match = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);



      if (match) {

        const first = Number(match[1]);

        const second = Number(match[2]);

        const year = Number(match[3]);



        // If the first number is greater than 12, treat it as the day.

        // Otherwise, interpret the format as month/day/year.

        const month = first > 12 ? second : first;

        const day = first > 12 ? first : second;



        const date = new Date(Date.UTC(year, month - 1, day));



        if (

          date.getUTCFullYear() !== year ||

          date.getUTCMonth() !== month - 1 ||

          date.getUTCDate() !== day

        ) {

          return undefined;

        }



        return date;

      }



      const parsed = new Date(text);



      if (Number.isNaN(parsed.getTime())) {

        return undefined;

      }



      return new Date(

        Date.UTC(

          parsed.getUTCFullYear(),

          parsed.getUTCMonth(),

          parsed.getUTCDate()

        )

      );

    };



    // Supports arrays, JSON-array strings, and delimited values.

    const getJsonFieldValue = (value) => {

      if (value == null) {

        return null;

      }



      if (Array.isArray(value)) {

        const cleaned = value

          .map((item) =>

            typeof item === "string" ? item.trim() : item

          )

          .filter((item) => item !== "");



        return cleaned.length ? cleaned : null;

      }



      if (typeof value === "object") {

        return value;

      }



      const stringValue = String(value).trim();



      if (!stringValue) {

        return null;

      }



      if (stringValue.startsWith("[")) {

        try {

          const parsed = JSON.parse(stringValue);



          if (Array.isArray(parsed)) {

            return parsed.length ? parsed : null;

          }

        } catch {

          // Invalid JSON is treated as an ordinary string.

        }

      }



      if (/[;|\n]/.test(stringValue)) {

        const values = stringValue

          .split(/[;|\n]/)

          .map((item) => item.trim())

          .filter(Boolean);



        return values.length ? values : null;

      }



      return stringValue;

    };



    const getProgramId = (row) => {

      const value = getColumnValue(row, [

        "Program ID",

        "program_id",

        "programid",

        "Funding Program ID",

        "Funding ID",

        "Service ID",

        "id",

      ]);



      return normalizeValue(value);

    };



    const getTitle = (row) =>

      row.title ??

      row.Title ??

      row["Funding Service"] ??

      row["Funding Service Name"] ??

      row["Service Name"] ??

      row["Program Name"] ??

      row["program name"] ??

      "Funding Opportunity";



    const getDescription = (row) =>

      row.description ??

      row.Description ??

      row["Funding Description"] ??

      null;



    // Dedicated classification fields are not stored inside data JSON.

    const dedicatedColumnKeys = new Set([
      "whoyouare",
      "territory",
      "category",
      // Start Date and End Date are stored in dedicated Prisma columns,
      // not in the dynamic JSON data object.
      "startdate",
      "enddate",
    ]);



    const removeDedicatedFieldsFromData = (row) =>

      Object.fromEntries(

        Object.entries(row).filter(

          ([key]) =>

            !dedicatedColumnKeys.has(normalizeKey(key))

        )

      );



    const preparedRows = [];

    const processedIds = new Set();



    let skippedInFile = 0;

    let skippedMissingId = 0;



    // Validate all rows before writing to the database.

    for (const originalRow of rows) {

      const row = replaceQuestionMarks(originalRow);

      const programId = getProgramId(row);



      if (!programId) {

        skippedMissingId++;

        continue;

      }



      if (processedIds.has(programId)) {

        skippedInFile++;

        continue;

      }



      processedIds.add(programId);



      const title = String(getTitle(row) ?? "").trim();



      if (!title) {

        return Response.json(

          {

            success: false,

            message: `A row with Program ID "${programId}" has an empty title. No records were imported.`,

          },

          { status: 400 }

        );

      }



      const description = getDescription(row);



      const whoYouAre = getJsonFieldValue(

        getColumnValue(row, [

          "Who You Are",

          "who_you_are",

          "whoYouAre",

        ])

      );



      const territory = getJsonFieldValue(

        getColumnValue(row, ["Territory"])

      );



      const category = getJsonFieldValue(

        getColumnValue(row, ["Category"])

      );



      // New dedicated Start Date and End Date columns.

      const startDateRaw = getColumnValue(row, [

        "Start Date",

        "startDate",

        "start_date",

        "Program Start Date",

        "Funding Start Date",

      ]);



      const endDateRaw = getColumnValue(row, [

        "End Date",

        "endDate",

        "end_date",

        "Program End Date",

        "Funding End Date",

      ]);



      const normalizedStartDate =

        normalizeImportedDate(startDateRaw);



      const normalizedEndDate =

        normalizeImportedDate(endDateRaw);



      if (

        normalizedStartDate === undefined ||

        normalizedEndDate === undefined

      ) {

        return Response.json(

          {

            success: false,

            message: `Invalid Start Date or End Date for Program ID "${programId}". Use a valid date such as YYYY-MM-DD. No records were imported.`,

          },

          { status: 400 }

        );

      }



      if (

        normalizedStartDate &&

        normalizedEndDate &&

        normalizedEndDate < normalizedStartDate

      ) {

        return Response.json(

          {

            success: false,

            message: `End Date cannot be earlier than Start Date for Program ID "${programId}". No records were imported.`,

          },

          { status: 400 }

        );

      }



      const data = removeDedicatedFieldsFromData(row);



      preparedRows.push({

        programId,

        title,

        description:

          description == null || String(description).trim() === ""

            ? null

            : String(description).trim(),

        data,

        whoYouAre,

        territory,

        category,

        startDate: normalizedStartDate,

        endDate: normalizedEndDate,

      });

    }



    if (!preparedRows.length) {

      return Response.json(

        {

          success: false,

          message:

            "No valid rows found. Each row must have a Program ID.",

          skippedInFile,

          skippedMissingId,

        },

        { status: 400 }

      );

    }



    const result = await prisma.$transaction(

      async (tx) => {

        // Find existing records inside the transaction.

        const existingServices = await tx.fundingService.findMany({

          select: {

            id: true,

            title: true,

            data: true,

          },

        });



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



        const createdServices = [];

        const updatedServices = [];



        for (const item of preparedRows) {

          const existingService =

            existingServicesByProgramId.get(item.programId);



          const recordData = {

            title: item.title,

            description: item.description,

            data: item.data,



            // Use DbNull for SQL NULL in nullable Prisma JSON fields.

            whoYouAre:

              item.whoYouAre === null

                ? Prisma.DbNull

                : item.whoYouAre,



            territory:

              item.territory === null

                ? Prisma.DbNull

                : item.territory,



            category:

              item.category === null

                ? Prisma.DbNull

                : item.category,



            // Save dates to dedicated database columns.

            startDate: item.startDate,

            endDate: item.endDate,

          };



          if (existingService) {

            const updatedService =

              await tx.fundingService.update({

                where: {

                  id: existingService.id,

                },

                data: recordData,

              });



            updatedServices.push({

              id: updatedService.id,

              title: updatedService.title,

              programId: item.programId,

            });

          } else {

            const createdService =

              await tx.fundingService.create({

                data: {

                  ...recordData,

                  isActive: true,

                  isFeatured: false,

                },

              });



            createdServices.push({

              id: createdService.id,

              title: createdService.title,

              programId: item.programId,

            });



            // Prevent another row with the same ID being inserted.

            existingServicesByProgramId.set(item.programId, {

              id: createdService.id,

              title: createdService.title,

              data: item.data,

            });

          }

        }



        return {

          createdServices,

          updatedServices,

        };

      },

      {

        // A transaction failure rolls back the entire import.

        isolationLevel: "Serializable",

        maxWait: 10000,

        timeout: 60000,

      }

    );



    const added = result.createdServices.length;

    const updated = result.updatedServices.length;

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

          created: result.createdServices,

          updated: result.updatedServices,

        },

      },

      { status: 200 }

    );

  } catch (error) {

    console.error("Excel/CSV upload error:", error);



    return Response.json(

      {

        success: false,

        message: "Failed to import file.",

        error:

          error instanceof Error

            ? error.message

            : "An unexpected error occurred.",

      },

      { status: 500 }

    );

  }

}