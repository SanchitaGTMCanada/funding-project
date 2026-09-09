import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.user.findMany();

    return Response.json({
      success: true,
      message: "Database connection successful",
      users,
    });
  } catch (error) {
    console.error("Database error:", error);

    return Response.json(
      {
        success: false,
        message: "Database connection failed",
        error: error.message,
      },
      { status: 500 }
    );
  }
}