import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const run = await prisma.run.findUnique({
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
        tasks: {
          orderBy: { createdAt: "asc" },
        },
        _count: {
          select: { tasks: true },
        },
      },
    });

    if (!run) {
      return NextResponse.json(
        { error: "Run not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(run);
  } catch (error) {
    console.error("Error fetching run:", error);
    return NextResponse.json(
      { error: "Failed to fetch run" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, status, completedAt } = body;

    const run = await prisma.run.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(status && { status }),
        ...(completedAt !== undefined && {
          completedAt: completedAt ? new Date(completedAt) : null,
        }),
      },
      include: {
        project: {
          select: {
            id: true,
            repoName: true,
            repoFullName: true,
          },
        },
        tasks: true,
      },
    });

    return NextResponse.json(run);
  } catch (error) {
    console.error("Error updating run:", error);
    return NextResponse.json(
      { error: "Failed to update run" },
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

    await prisma.run.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Run deleted successfully" });
  } catch (error) {
    console.error("Error deleting run:", error);
    return NextResponse.json(
      { error: "Failed to delete run" },
      { status: 500 }
    );
  }
}
