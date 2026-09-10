
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { requireAuth } from "@/lib/auth/requireAuth";

const resend = new Resend(process.env.RESEND_API_KEY);

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

    // Validate funding service
    if (!fundingServiceId) {
      return Response.json(
        {
          success: false,
          message: "Funding service is required",
        },
        { status: 400 }
      );
    }

    // Validate required applicant fields
    if (!name || !phone || !email) {
      return Response.json(
        {
          success: false,
          message:
            "Name, phone number and email are required",
        },
        { status: 400 }
      );
    }

    // Check that the funding service exists
    const fundingService =
      await prisma.fundingService.findUnique({
        where: {
          id: Number(fundingServiceId),
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

    // Save application
    const application =
      await prisma.application.create({
        data: {
          fundingServiceId: Number(fundingServiceId),
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim().toLowerCase(),
          company: company?.trim() || null,
          address: address?.trim() || null,
          city: city?.trim() || null,
          message: message?.trim() || null,
        },
      });

    // Get configured email recipients
    const recipients = [
      process.env.APPLICATION_EMAIL_1,
      process.env.APPLICATION_EMAIL_2,
    ].filter(Boolean);

    // Send application notification email
    if (recipients.length > 0) {
      await resend.emails.send({
        from: "Funding Management <onboarding@resend.dev>",
        to: recipients,
        subject: `New Funding Application - ${fundingService.title}`,
        html: `
          <div
            style="
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #222;
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
              ${fundingService.title}
            </p>

            <h3>Applicant Details</h3>

            <p>
              <strong>Name:</strong>
              ${name}
            </p>

            <p>
              <strong>Phone:</strong>
              ${phone}
            </p>

            <p>
              <strong>Email:</strong>
              ${email}
            </p>

            <p>
              <strong>Company:</strong>
              ${company || "Not provided"}
            </p>

            <p>
              <strong>City:</strong>
              ${city || "Not provided"}
            </p>

            <p>
              <strong>Address:</strong>
              ${address || "Not provided"}
            </p>

            <p>
              <strong>Message:</strong>
              ${message || "Not provided"}
            </p>

            <hr />

            <p>
              <strong>Application ID:</strong>
              ${application.id}
            </p>

            <p>
              <strong>Status:</strong>
              ${application.status}
            </p>

            <p>
              <strong>Submitted:</strong>
              ${application.createdAt}
            </p>
          </div>
        `,
      });
    }

    return Response.json(
      {
        success: true,
        message: "Application submitted successfully",
        application: {
          id: application.id,
          status: application.status,
          createdAt: application.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Application submission error:",
      error
    );

    return Response.json(
      {
        success: false,
        message:
          "Application was saved, but email notification could not be completed.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// GET - Fetch applications
// Protected because applications contain customer information.
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

    const applications =
      await prisma.application.findMany({
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
    console.error(
      "Fetch applications error:",
      error
    );

    return Response.json(
      {
        success: false,
        message: "Failed to fetch applications",
      },
      { status: 500 }
    );
  }
}
