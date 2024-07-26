import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = cookies().get("session")?.value;

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(JSON.parse(session), { status: 200 });
}

export async function POST(req: NextRequest) {
  const session = await req.json();
  cookies().set("session", JSON.stringify(session), { maxAge: 3600 });

  return NextResponse.json({ message: "Set cookie successfully" });
}

export async function DELETE() {
  cookies().delete("session");

  return NextResponse.json({ message: "Delete cookie successfully" });
}
