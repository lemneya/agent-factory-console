import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const items = await prisma.memoryItem.findMany({
      include: {
        project: {
          select: {
            repoName: true,
          },
        },
      },
      orderBy: [{ accessCount: "desc" }, { lastAccessed: "desc" }],
      take: 50,
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Failed to fetch memory items:", error);
    return NextResponse.json({ items: [] });
  }
}
