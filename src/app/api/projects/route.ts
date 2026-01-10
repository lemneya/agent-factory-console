import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    const projects = await prisma.project.findMany({
      where: userId ? { userId } : undefined,
      include: {
        user: true,
        runs: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        _count: {
          select: { runs: true, events: true },
        },
      },
      orderBy: { lastUpdated: "desc" },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, repoName, repoFullName, description, htmlUrl, lastUpdated } = body;

    if (!userId || !repoName || !repoFullName || !htmlUrl) {
      return NextResponse.json(
        { error: "Missing required fields: userId, repoName, repoFullName, htmlUrl" },
        { status: 400 }
      );
    }

    const project = await prisma.project.create({
      data: {
        userId,
        repoName,
        repoFullName,
        description,
        htmlUrl,
        lastUpdated: lastUpdated ? new Date(lastUpdated) : new Date(),
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
