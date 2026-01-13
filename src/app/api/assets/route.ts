import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const assets = await prisma.asset.findMany({
      include: {
        project: {
          select: {
            repoName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    return NextResponse.json({ assets });
  } catch (error) {
    console.error("Failed to fetch assets:", error);
    return NextResponse.json({ assets: [] });
  }
}
