import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const role = req.nextUrl.searchParams.get("role");
  const notifications = await prisma.notification.findMany({
    where: role ? { targetRole: role as never } : undefined,
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json(notifications);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const ids: number[] = body.ids ?? [];
  await prisma.notification.updateMany({ where: { id: { in: ids } }, data: { read: true } });
  return NextResponse.json({ ok: true });
}
