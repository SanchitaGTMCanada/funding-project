
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { requireAuth } from "@/lib/auth/requireAuth";

const resend = new Resend(process.env.RESEND_API_KEY);

// =====================================================
// HTML ESCAPING
// Prevent applicant-provided text from injecting HTML
// into notification emails.
// =====================================================

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
}

// =====================================================
// POST - Submit funding application
// =====================================================

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      fundingServiceId,
      name,
      phone,
      email,
      company,
      address,
      city,
      message,
    } = body;

    // =====================================================
    // Validate funding service
    // =====================================================

    if (!fundingServiceId) {
      return Response.json(
        {
          success: false,
          message: "Funding service is required",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // Validate required applicant fields
    // =====================================================

    if (
      typeof name !== "string" ||
      typeof phone !== "string" ||
      typeof email !== "string" ||
      !name.trim() ||
      !phone.trim() ||
      !email.trim()
    ) {
      return Response.json(
        {
          success: false,
          message: "Name, phone number and email are required",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // Validate funding service ID
    // =====================================================

    const parsedFundingServiceId = Number(fundingServiceId);

    if (
      !Number.isInteger(parsedFundingServiceId) ||
      parsedFundingServiceId <= 0
    ) {
      return Response.json(
        {
          success: false,
          message: "Invalid funding service",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // Check that the funding service exists
    // =====================================================

    const fundingService = await prisma.fundingService.findUnique({
      where: {
        id: parsedFundingServiceId,
      },
    });

    if (!fundingService) {
      return Response.json(
        {
          success: false,
          message: "Funding service not found",
        },
        { status: 404 }
      );
    }

    // =====================================================
    // Prevent applications for inactive programs
    // =====================================================

    if (!fundingService.isActive) {
      return Response.json(
        {
          success: false,
          message:
            "This funding program is currently inactive and is not accepting applications.",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // Save application
    // =====================================================

    const application = await prisma.application.create({
      data: {
        fundingServiceId: parsedFundingServiceId,

        name: name.trim(),

        phone: phone.trim(),

        email: email.trim().toLowerCase(),

        company:
          typeof company === "string"
            ? company.trim() || null
            : null,

        address:
          typeof address === "string"
            ? address.trim() || null
            : null,

        city:
          typeof city === "string"
            ? city.trim() || null
            : null,

        message:
          typeof message === "string"
            ? message.trim() || null
            : null,
      },
    });

    // =====================================================
    // Get configured email recipients
    // =====================================================

    const recipients = [
      process.env.APPLICATION_EMAIL_1,
      process.env.APPLICATION_EMAIL_2,
      process.env.APPLICATION_EMAIL_3,
    ]
      .map((recipient) => recipient?.trim())
      .filter(Boolean);

    // =====================================================
    // Prepare email-safe values
    // =====================================================

    const safeFundingTitle = escapeHtml(fundingService.title);
    const safeName = escapeHtml(name.trim());
    const safePhone = escapeHtml(phone.trim());
    const safeEmail = escapeHtml(email.trim().toLowerCase());
    const safeCompany = escapeHtml(company || "Not provided");
    const safeCity = escapeHtml(city || "Not provided");
    const safeAddress = escapeHtml(address || "Not provided");
    const safeMessage = escapeHtml(message || "Not provided");
    const safeApplicationId = escapeHtml(application.id);
    const safeStatus = escapeHtml(application.status);
    const safeCreatedAt = escapeHtml(
      application.createdAt.toISOString()
    );

    // =====================================================
    // Send application notification email
    // =====================================================

    let emailNotificationSent = false;

    if (recipients.length > 0 && process.env.RESEND_API_KEY) {
      try {
        const { error } = await resend.emails.send({
          from: "Funding Management <onboarding@resend.dev>",

          to: recipients,

          subject: `New Funding Application - ${fundingService.title}`,

          html: `
            <div
              style="
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #222;
                max-width: 680px;
                margin: 0 auto;
              "
            >
              <h2>New Funding Application</h2>

              <p>
                A new customer has submitted a funding application.
              </p>

              <hr />

              <h3>Funding Details</h3>

              <p>
                <strong>Funding Service:</strong>
                ${safeFundingTitle}
              </p>

              <h3>Applicant Details</h3>

              <p>
                <strong>Name:</strong>
                ${safeName}
              </p>

              <p>
                <strong>Phone:</strong>
                ${safePhone}
              </p>

              <p>
                <strong>Email:</strong>
                ${safeEmail}
              </p>

              <p>
                <strong>Company:</strong>
                ${safeCompany}
              </p>

              <p>
                <strong>City:</strong>
                ${safeCity}
              </p>

              <p>
                <strong>Address:</strong>
                ${safeAddress}
              </p>

              <p>
                <strong>Message:</strong>
                ${safeMessage}
              </p>

              <hr />

              <p>
                <strong>Application ID:</strong>
                ${safeApplicationId}
              </p>

              <p>
                <strong>Status:</strong>
                ${safeStatus}
              </p>

              <p>
                <strong>Submitted:</strong>
                ${safeCreatedAt}
              </p>
            </div>
          `,
        });

        if (error) {
          console.error(
            "Application notification email failed:",
            error
          );
        } else {
          emailNotificationSent = true;
        }
      } catch (emailError) {
        console.error(
          "Application notification email failed:",
          emailError
        );
      }
    } else {
      console.warn(
        "Application saved, but email was not sent: " +
          "no recipients are configured or RESEND_API_KEY is missing."
      );
    }

    // =====================================================
    // Success response
    // The application is saved even if email delivery fails.
    // =====================================================

    return Response.json(
      {
        success: true,
        message: emailNotificationSent
          ? "Application submitted successfully."
          : "Application submitted successfully, but email notification could not be confirmed.",

        emailNotificationSent,

        application: {
          id: application.id,
          status: application.status,
          createdAt: application.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Application submission error:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to submit the application.",
      },
      { status: 500 }
    );
  }
}

// =========================================================
// GET - Fetch applications
// Protected because applications contain customer information.
// =========================================================

export async function GET() {
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

    const applications = await prisma.application.findMany({
      include: {
        fundingService: true,
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(
      `Applications viewed by ${user.email} (${user.role})`
    );

    return Response.json({
      success: true,
      applications,
    });
  } catch (error) {
    console.error("Fetch applications error:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to fetch applications",
      },
      { status: 500 }
    );
  }
}
