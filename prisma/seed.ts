import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database with demo data...");

  // 1. Create a User first (required for Project)
  const user = await prisma.user.upsert({
    where: { email: "demo@agentfactory.dev" },
    update: {},
    create: {
      email: "demo@agentfactory.dev",
      name: "Demo User",
    },
  });
  console.log("✅ Created User:", user.email);

  // 2. Create a Project
  const project = await prisma.project.create({
    data: {
      userId: user.id,
      repoName: "agent-factory-console",
      repoFullName: "lemneya/agent-factory-console",
      htmlUrl: "https://github.com/lemneya/agent-factory-console",
      lastUpdated: new Date(),
    },
  });
  console.log("✅ Created Project:", project.repoName);

  // 3. Create Workers (capabilities is String[])
  const worker1 = await prisma.worker.upsert({
    where: { id: "worker-db-001" },
    update: { lastHeartbeat: new Date(), status: "IDLE" },
    create: {
      id: "worker-db-001",
      name: "DB Agent",
      type: "BUILDER",
      status: "IDLE",
      lastHeartbeat: new Date(),
      capabilities: ["BACKEND", "DEVOPS"],
    },
  });

  const worker2 = await prisma.worker.upsert({
    where: { id: "worker-api-002" },
    update: { lastHeartbeat: new Date(), status: "BUSY" },
    create: {
      id: "worker-api-002",
      name: "API Agent",
      type: "BUILDER",
      status: "BUSY",
      lastHeartbeat: new Date(),
      capabilities: ["BACKEND", "INTEGRATION"],
    },
  });

  const worker3 = await prisma.worker.upsert({
    where: { id: "worker-ui-003" },
    update: { lastHeartbeat: new Date(), status: "IDLE" },
    create: {
      id: "worker-ui-003",
      name: "UI Agent",
      type: "BUILDER",
      status: "IDLE",
      lastHeartbeat: new Date(),
      capabilities: ["FRONTEND"],
    },
  });

  const worker4 = await prisma.worker.upsert({
    where: { id: "worker-qa-004" },
    update: { lastHeartbeat: new Date(), status: "IDLE" },
    create: {
      id: "worker-qa-004",
      name: "QA Agent",
      type: "REVIEWER",
      status: "IDLE",
      lastHeartbeat: new Date(),
      capabilities: ["QA"],
    },
  });
  console.log("✅ Created 4 Workers");

  // 4. Create Council Decisions
  await prisma.councilDecision.createMany({
    data: [
      {
        projectId: project.id,
        candidateName: "react-query",
        candidateUrl: "https://github.com/TanStack/query",
        decision: "ADOPT",
        confidence: 0.92,
        maintenanceRisk: "LOW",
        reasoning: "Well-maintained, excellent TypeScript support",
        sources: [
          "https://github.com/TanStack/query",
          "https://npmjs.com/package/@tanstack/react-query",
        ],
        createdBy: "council-bot",
      },
      {
        projectId: project.id,
        candidateName: "prisma",
        candidateUrl: "https://github.com/prisma/prisma",
        decision: "ADOPT",
        confidence: 0.95,
        maintenanceRisk: "LOW",
        reasoning: "Type-safe ORM, great DX",
        sources: ["https://github.com/prisma/prisma", "https://prisma.io/docs"],
        createdBy: "council-bot",
      },
      {
        projectId: project.id,
        candidateName: "custom-auth-lib",
        candidateUrl: "https://github.com/example/custom-auth",
        decision: "BUILD",
        confidence: 0.78,
        maintenanceRisk: "HIGH",
        reasoning: "No suitable library found, need custom implementation",
        sources: ["https://auth0.com/docs", "https://next-auth.js.org"],
        createdBy: "council-bot",
      },
      {
        projectId: project.id,
        candidateName: "lodash",
        candidateUrl: "https://github.com/lodash/lodash",
        decision: "ADAPT",
        confidence: 0.85,
        maintenanceRisk: "MEDIUM",
        reasoning: "Use only specific functions, tree-shake the rest",
        sources: [
          "https://github.com/lodash/lodash",
          "https://bundlephobia.com/package/lodash",
        ],
        createdBy: "council-bot",
      },
    ],
    skipDuplicates: true,
  });
  console.log("✅ Created 4 Council Decisions (2 ADOPT, 1 BUILD, 1 ADAPT)");

  // 5. Create a Blueprint with published version
  const blueprint = await prisma.blueprint.create({
    data: {
      name: "AFC Dashboard Enhancement",
      description: "Implement dashboard widgets with real-time data",
      projectId: project.id,
      status: "PUBLISHED",
    },
  });

  const blueprintVersion = await prisma.blueprintVersion.create({
    data: {
      blueprintId: blueprint.id,
      version: 1,
      specHash: "sha256:abc123def456",
      specJson: {
        modules: [
          {
            name: "FactoryStatus",
            domain: "FRONTEND",
            description: "Real-time factory status counters",
            dependencies: [],
          },
          {
            name: "ActiveWorkOrders",
            domain: "FRONTEND",
            description: "Active work orders panel",
            dependencies: ["FactoryStatus"],
          },
          {
            name: "DashboardAPI",
            domain: "BACKEND",
            description: "API routes for dashboard data",
            dependencies: [],
          },
        ],
      },
      publishedAt: new Date(),
    },
  });
  console.log("✅ Created Blueprint with published version");

  // 6. Create WorkOrders from the blueprint (matching actual schema)
  const wo1 = await prisma.workOrder.create({
    data: {
      key: "bp-dashboard-FRONTEND-1",
      title: "Implement FactoryStatus component",
      summary: "Create real-time factory status counters widget",
      domain: "FRONTEND",
      status: "DONE",
      projectId: project.id,
      blueprintVersionId: blueprintVersion.id,
      specIds: ["spec-factory-status"],
      ownedPaths: ["src/components/dashboard/FactoryStatus.tsx"],
      acceptanceChecks: ["Component renders", "Counters update"],
      assetsToUse: [],
      memoryHints: ["dashboard patterns"],
    },
  });

  const wo2 = await prisma.workOrder.create({
    data: {
      key: "bp-dashboard-FRONTEND-2",
      title: "Implement ActiveWorkOrders panel",
      summary: "Create active work orders display panel",
      domain: "FRONTEND",
      status: "IN_PROGRESS",
      projectId: project.id,
      blueprintVersionId: blueprintVersion.id,
      specIds: ["spec-active-workorders"],
      ownedPaths: ["src/components/dashboard/ActiveWorkOrders.tsx"],
      acceptanceChecks: ["Panel renders", "Shows top 6 workorders"],
      assetsToUse: [],
      memoryHints: ["workorder display"],
    },
  });

  const wo3 = await prisma.workOrder.create({
    data: {
      key: "bp-dashboard-BACKEND-1",
      title: "Implement Dashboard API routes",
      summary: "Create API endpoints for dashboard data",
      domain: "BACKEND",
      status: "DONE",
      projectId: project.id,
      blueprintVersionId: blueprintVersion.id,
      specIds: ["spec-dashboard-api"],
      ownedPaths: ["src/app/api/dashboard/"],
      acceptanceChecks: ["API returns JSON", "Queries work"],
      assetsToUse: [],
      memoryHints: ["api patterns"],
    },
  });

  const wo4 = await prisma.workOrder.create({
    data: {
      key: "bp-dashboard-QA-1",
      title: "E2E tests for dashboard",
      summary: "Write end-to-end tests for dashboard widgets",
      domain: "QA",
      status: "PLANNED",
      projectId: project.id,
      blueprintVersionId: blueprintVersion.id,
      specIds: ["spec-dashboard-tests"],
      ownedPaths: ["tests/dashboard.spec.ts"],
      acceptanceChecks: ["Tests pass", "Coverage > 80%"],
      assetsToUse: [],
      memoryHints: ["testing patterns"],
    },
  });

  const wo5 = await prisma.workOrder.create({
    data: {
      key: "bp-dashboard-FRONTEND-3",
      title: "Implement Memory Insights widget",
      summary: "Display memory usage insights on dashboard",
      domain: "FRONTEND",
      status: "READY",
      projectId: project.id,
      blueprintVersionId: blueprintVersion.id,
      specIds: ["spec-memory-insights"],
      ownedPaths: ["src/components/dashboard/MemoryInsights.tsx"],
      acceptanceChecks: ["Widget renders", "Shows top 3 keys"],
      assetsToUse: [],
      memoryHints: ["memory layer"],
    },
  });

  const wo6 = await prisma.workOrder.create({
    data: {
      key: "bp-dashboard-FRONTEND-4",
      title: "Implement Activity Log widget",
      summary: "Display recent activity and audit events",
      domain: "FRONTEND",
      status: "PLANNED",
      projectId: project.id,
      blueprintVersionId: blueprintVersion.id,
      specIds: ["spec-activity-log"],
      ownedPaths: ["src/components/dashboard/ActivityLog.tsx"],
      acceptanceChecks: ["Log renders", "Shows 10 events"],
      assetsToUse: [],
      memoryHints: ["audit events"],
    },
  });
  console.log("✅ Created 6 WorkOrders");

  // 7. Create WorkOrder audit events
  await prisma.workOrderAuditEvent.createMany({
    data: [
      {
        workOrderId: wo1.id,
        fromStatus: "PLANNED",
        toStatus: "READY",
        actor: "manus-agent",
      },
      {
        workOrderId: wo1.id,
        fromStatus: "READY",
        toStatus: "IN_PROGRESS",
        actor: "worker-ui-003",
      },
      {
        workOrderId: wo1.id,
        fromStatus: "IN_PROGRESS",
        toStatus: "DONE",
        actor: "worker-ui-003",
      },
      {
        workOrderId: wo2.id,
        fromStatus: "PLANNED",
        toStatus: "IN_PROGRESS",
        actor: "worker-ui-003",
      },
      {
        workOrderId: wo3.id,
        fromStatus: "PLANNED",
        toStatus: "DONE",
        actor: "worker-api-002",
      },
    ],
    skipDuplicates: true,
  });
  console.log("✅ Created WorkOrder audit events");

  // 8. Create a Run with tasks
  const run = await prisma.run.create({
    data: {
      name: "AFC-1.7 Implementation Run",
      projectId: project.id,
      status: "ACTIVE",
      ralphMode: false,
    },
  });

  // Create tasks for the run
  await prisma.task.createMany({
    data: [
      {
        runId: run.id,
        title: "Implement Prisma models",
        description: "Add Blueprint and WorkOrder models",
        status: "DONE",
        priority: 1,
      },
      {
        runId: run.id,
        title: "Implement Slicer algorithm",
        description: "Create deterministic slicer",
        status: "DONE",
        priority: 2,
      },
      {
        runId: run.id,
        title: "Create API routes",
        description: "Blueprint and WorkOrder endpoints",
        status: "DONE",
        priority: 3,
      },
      {
        runId: run.id,
        title: "Build UI pages",
        description: "Dashboard widgets and pages",
        status: "IN_PROGRESS",
        priority: 4,
      },
      {
        runId: run.id,
        title: "Write tests",
        description: "Unit and E2E tests",
        status: "TODO",
        priority: 5,
      },
      {
        runId: run.id,
        title: "Create evidence",
        description: "Screenshots and documentation",
        status: "TODO",
        priority: 6,
      },
    ],
    skipDuplicates: true,
  });
  console.log("✅ Created Run with 6 tasks");

  // 9. Create Run iterations
  await prisma.runIteration.createMany({
    data: [
      {
        runId: run.id,
        iteration: 1,
        status: "PASSED",
        startedAt: new Date(Date.now() - 3600000),
        endedAt: new Date(Date.now() - 3000000),
        verificationSummary: { lint: "pass", test: "pass", build: "pass" },
      },
      {
        runId: run.id,
        iteration: 2,
        status: "PASSED",
        startedAt: new Date(Date.now() - 2400000),
        endedAt: new Date(Date.now() - 1800000),
        verificationSummary: { lint: "pass", test: "pass", build: "pass" },
      },
      {
        runId: run.id,
        iteration: 3,
        status: "RUNNING",
        startedAt: new Date(Date.now() - 600000),
      },
    ],
    skipDuplicates: true,
  });
  console.log("✅ Created 3 Run iterations");

  // 10. Create Memory items
  await prisma.memoryItem.createMany({
    data: [
      {
        projectId: project.id,
        scope: "PROJECT",
        category: "CODE",
        summary: "Prisma schema patterns for AFC models",
        content: "Use cuid() for IDs, add proper indexes...",
        contentHash: "hash-prisma-patterns-001",
        accessCount: 15,
        lastAccessed: new Date(),
      },
      {
        projectId: project.id,
        scope: "PROJECT",
        category: "DECISION",
        summary: "Slicer determinism requirements",
        content: "Keys must be stable, order deterministic...",
        contentHash: "hash-slicer-determinism-002",
        accessCount: 12,
        lastAccessed: new Date(),
      },
      {
        projectId: project.id,
        scope: "PROJECT",
        category: "DOCUMENTATION",
        summary: "API route conventions",
        content: "Use Next.js App Router patterns...",
        contentHash: "hash-api-conventions-003",
        accessCount: 8,
        lastAccessed: new Date(),
      },
      {
        scope: "GLOBAL",
        category: "ERROR",
        summary: "Common TypeScript errors and fixes",
        content: "Module not found, type mismatches...",
        contentHash: "hash-ts-errors-004",
        accessCount: 25,
        lastAccessed: new Date(),
      },
    ],
    skipDuplicates: true,
  });
  console.log("✅ Created 4 Memory items");

  // 11. Create Worker logs
  await prisma.workerLog.createMany({
    data: [
      {
        workerId: worker1.id,
        action: "TASK_STARTED",
        details: { taskId: "task-001", description: "Prisma models" },
      },
      {
        workerId: worker2.id,
        action: "TASK_COMPLETED",
        details: { taskId: "task-002", duration: "15m" },
      },
      {
        workerId: worker3.id,
        action: "TASK_STARTED",
        details: { taskId: "task-003", description: "UI components" },
      },
      {
        workerId: worker4.id,
        action: "REVIEW_STARTED",
        details: { prNumber: 18 },
      },
    ],
    skipDuplicates: true,
  });
  console.log("✅ Created Worker logs");

  // 12. Create GitHub events (webhooks)
  await prisma.gitHubEvent.createMany({
    data: [
      {
        projectId: project.id,
        repositoryName: "agent-factory-console",
        eventType: "push",
        action: "push",
        senderUsername: "manus-agent",
        payload: { ref: "refs/heads/main", commits: 3 },
        receivedAt: new Date(Date.now() - 300000),
      },
      {
        projectId: project.id,
        repositoryName: "agent-factory-console",
        eventType: "pull_request",
        action: "opened",
        senderUsername: "manus-agent",
        payload: { number: 18, title: "AFC-1.7: Blueprints + Slicer" },
        receivedAt: new Date(),
      },
    ],
    skipDuplicates: true,
  });
  console.log("✅ Created GitHub events");

  // 13. Skip PullRequest creation (requires Repository model which is separate)
  console.log("⏭️  Skipped Pull Request (requires Repository model)");

  console.log("\n🎉 Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
