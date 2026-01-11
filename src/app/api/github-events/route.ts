import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const eventType = searchParams.get("eventType");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const events = await prisma.gitHubEvent.findMany({
      where: {
        ...(projectId && { projectId }),
        ...(eventType && { eventType }),
      },
      include: {
        project: {
          select: {
            id: true,
            repoName: true,
            repoFullName: true,
          },
        },
      },
      orderBy: { receivedAt: "desc" },
      take: limit,
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching GitHub events:", error);
    return NextResponse.json(
      { error: "Failed to fetch GitHub events" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, eventType, action, payload, repositoryName, senderUsername } = body;

    if (!eventType || !payload || !repositoryName || !senderUsername) {
      return NextResponse.json(
        { error: "Missing required fields: eventType, payload, repositoryName, senderUsername" },
        { status: 400 }
      );
    }

    const event = await prisma.gitHubEvent.create({
      data: {
        projectId: projectId || null,
        eventType,
        action: action || null,
        repositoryName,
        senderUsername,
        payload,
      },
      include: {
        project: {
          select: {
            id: true,
            repoName: true,
            repoFullName: true,
          },
        },
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("Error creating GitHub event:", error);
    return NextResponse.json(
      { error: "Failed to create GitHub event" },
      { status: 500 }
    );
  }
}
