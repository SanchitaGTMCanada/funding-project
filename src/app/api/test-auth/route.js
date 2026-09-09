import { requireAuth } from "@/lib/auth/requireAuth";

export async function GET() {
  const { authorized, user } = await requireAuth();

  if (!authorized) {
    return Response.json(
      {
        success: false,
        message: "Authentication required",
      },
      { status: 401 }
    );
  }

  return Response.json({
    success: true,
    message: "You are authenticated",
    user,
  });
}
