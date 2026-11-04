
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (sessionToken) {
      await prisma.session.deleteMany({
        where: {
          id: sessionToken,
        },
      });
    }

    // Clear the browser cookie.
    cookieStore.delete("session_token");

    return Response.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to logout",
      },
      { status: 500 }
    );
  }
}