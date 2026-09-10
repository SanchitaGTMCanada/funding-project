
import { prisma } from "@/lib/prisma";

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
