import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const event = await prisma.gitHubEvent.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            repoName: true,
            repoFullName: true,
            htmlUrl: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "GitHub event not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error fetching GitHub event:", error);
    return NextResponse.json(
      { error: "Failed to fetch GitHub event" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.gitHubEvent.delete({
      where: { id },
    });

    return NextResponse.json({ message: "GitHub event deleted successfully" });
  } catch (error) {
    console.error("Error deleting GitHub event:", error);
    return NextResponse.json(
      { error: "Failed to delete GitHub event" },
      { status: 500 }
    );
  }
}
