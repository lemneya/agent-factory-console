#!/usr/bin/env npx ts-node
/**
 * AFC-RUNNER-0: Proof-of-Life Demo Script
 *
 * This script demonstrates the complete execution flow:
 * 1. Creates a WorkOrder in the database
 * 2. Executes the WorkOrder against orange-cab repo
 * 3. Creates a real PR on GitHub
 *
 * Prerequisites:
 * - DATABASE_URL set and database migrated
 * - GitHub OAuth token available (via user session or env)
 *
 * Usage:
 *   npx ts-node scripts/demo-runner-poc.ts
 *
 * Or with environment variables:
 *   GITHUB_TOKEN=xxx npx ts-node scripts/demo-runner-poc.ts
 */

import { PrismaClient } from '@prisma/client';
import { Octokit } from 'octokit';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

// Configuration
const TARGET_REPO_OWNER = 'lemneya';
const TARGET_REPO_NAME = 'orange-cab';
const TARGET_BRANCH = 'main';
const WORK_DIR = '/tmp/afc-runner-demo';

interface DemoResult {
  success: boolean;
  workOrderId?: string;
  executionRunId?: string;
  prUrl?: string;
  prNumber?: number;
  error?: string;
  logs: string[];
}

async function log(result: DemoResult, message: string): Promise<void> {
  console.log(`[${new Date().toISOString()}] ${message}`);
  result.logs.push(message);
}

async function runDemo(): Promise<DemoResult> {
  const result: DemoResult = {
    success: false,
    logs: [],
  };

  const prisma = new PrismaClient();

  try {
    // Get GitHub token from environment
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      throw new Error('GITHUB_TOKEN environment variable is required');
    }

    await log(result, '=== AFC-RUNNER-0 Proof-of-Life Demo ===');
    await log(result, `Target: ${TARGET_REPO_OWNER}/${TARGET_REPO_NAME}`);

    // Step 1: Create a Blueprint
    await log(result, 'Step 1: Creating Blueprint...');
    const blueprint = await prisma.blueprint.create({
      data: {
        name: `AFC Runner Demo - ${Date.now()}`,
        description: 'Demo blueprint for AFC-RUNNER-0 proof-of-life',
      },
    });
    await log(result, `Blueprint created: ${blueprint.id}`);

    // Step 2: Create a BlueprintVersion
    await log(result, 'Step 2: Creating BlueprintVersion...');
    const blueprintVersion = await prisma.blueprintVersion.create({
      data: {
        blueprintId: blueprint.id,
        payloadJson: {
          modules: [
            {
              key: 'afc-demo-module',
              title: 'AFC Demo Module',
              domain: 'demo',
              spec: 'This is a demonstration of the AFC execution engine creating a real PR.',
            },
          ],
        },
        specHash: `demo-${Date.now()}`,
      },
    });
    await log(result, `BlueprintVersion created: ${blueprintVersion.id}`);

    // Step 3: Create a WorkOrder
    await log(result, 'Step 3: Creating WorkOrder...');
    const workOrder = await prisma.workOrder.create({
      data: {
        blueprintId: blueprint.id,
        blueprintVersionId: blueprintVersion.id,
        key: 'afc-demo-workorder',
        domain: 'demo',
        title: 'AFC Runner Demo WorkOrder',
        spec: 'Demonstration of AFC execution engine creating a PR against orange-cab repository.',
        status: 'PENDING',
      },
    });
    result.workOrderId = workOrder.id;
    await log(result, `WorkOrder created: ${workOrder.id}`);

    // Step 4: Execute the WorkOrder (manual execution since we're outside the app)
    await log(result, 'Step 4: Executing WorkOrder...');

    // Generate branch name
    const branchName = `afc/demo-${Date.now().toString(36)}`;
    await log(result, `Branch name: ${branchName}`);

    // Create execution run record
    const executionRun = await prisma.executionRun.create({
      data: {
        targetRepoOwner: TARGET_REPO_OWNER,
        targetRepoName: TARGET_REPO_NAME,
        targetBranch: TARGET_BRANCH,
        sourceBranch: branchName,
        status: 'PENDING',
        workOrderIds: [workOrder.id],
      },
    });
    result.executionRunId = executionRun.id;
    await log(result, `ExecutionRun created: ${executionRun.id}`);

    // Clone repository
    await log(result, 'Step 4a: Cloning repository...');
    await prisma.executionRun.update({
      where: { id: executionRun.id },
      data: { status: 'CLONING' },
    });

    await fs.mkdir(WORK_DIR, { recursive: true });
    const repoDir = path.join(WORK_DIR, `${TARGET_REPO_NAME}-${Date.now()}`);
    const cloneUrl = `https://x-access-token:${githubToken}@github.com/${TARGET_REPO_OWNER}/${TARGET_REPO_NAME}.git`;

    await execAsync(`git clone --branch ${TARGET_BRANCH} --single-branch ${cloneUrl} ${repoDir}`);
    await log(result, `Cloned to: ${repoDir}`);

    // Create branch
    await log(result, 'Step 4b: Creating branch...');
    await prisma.executionRun.update({
      where: { id: executionRun.id },
      data: { status: 'APPLYING' },
    });

    await execAsync(`git checkout -b ${branchName}`, { cwd: repoDir });

    // Apply changes
    await log(result, 'Step 4c: Applying changes...');
    const changesContent = `# AFC Work Order Changes

## AFC Runner Demo WorkOrder (afc-demo-workorder)
Domain: demo
Spec: Demonstration of AFC execution engine creating a PR against orange-cab repository.

---
Generated by AFC-RUNNER-0 at ${new Date().toISOString()}
Execution Run ID: ${executionRun.id}
WorkOrder ID: ${workOrder.id}
`;
    await fs.writeFile(path.join(repoDir, 'AFC_CHANGES.md'), changesContent);

    // Commit changes
    await execAsync('git add -A', { cwd: repoDir });
    await execAsync('git commit -m "[AFC] Demo: Apply WorkOrder afc-demo-workorder"', { cwd: repoDir });
    await log(result, 'Changes committed');

    // Push branch
    await log(result, 'Step 4d: Pushing branch...');
    await prisma.executionRun.update({
      where: { id: executionRun.id },
      data: { status: 'CREATING_PR' },
    });

    await execAsync(`git push origin ${branchName}`, { cwd: repoDir });
    await log(result, 'Branch pushed');

    // Create PR
    await log(result, 'Step 4e: Creating PR...');
    const octokit = new Octokit({ auth: githubToken });

    const prTitle = '[AFC-RUNNER-0] Proof-of-Life Demo PR';
    const prBody = `## AFC Execution Engine - Proof-of-Life Demo

This PR was automatically generated by the Agent Factory Console execution engine (AFC-RUNNER-0).

### WorkOrder Details
- **WorkOrder ID**: \`${workOrder.id}\`
- **Key**: afc-demo-workorder
- **Domain**: demo
- **Title**: AFC Runner Demo WorkOrder

### Execution Details
- **Execution Run ID**: \`${executionRun.id}\`
- **Generated At**: ${new Date().toISOString()}

### Safety Gates
- ✅ Execution triggered programmatically (demo mode)
- ✅ All actions logged to ExecutionRun record

---
*Generated by AFC-RUNNER-0 Proof-of-Life Demo*
`;

    const prResponse = await octokit.rest.pulls.create({
      owner: TARGET_REPO_OWNER,
      repo: TARGET_REPO_NAME,
      title: prTitle,
      body: prBody,
      head: branchName,
      base: TARGET_BRANCH,
    });

    result.prNumber = prResponse.data.number;
    result.prUrl = prResponse.data.html_url;
    await log(result, `PR created: ${result.prUrl}`);

    // Update execution run
    await prisma.executionRun.update({
      where: { id: executionRun.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        prNumber: result.prNumber,
        prUrl: result.prUrl,
        prTitle,
        prBody,
      },
    });

    // Update WorkOrder status
    await prisma.workOrder.update({
      where: { id: workOrder.id },
      data: { status: 'IN_PROGRESS' },
    });

    // Cleanup
    await fs.rm(repoDir, { recursive: true, force: true });

    result.success = true;
    await log(result, '=== Demo Complete ===');
    await log(result, `PR URL: ${result.prUrl}`);

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await log(result, `ERROR: ${errorMessage}`);
    result.error = errorMessage;

    // Update execution run if it exists
    if (result.executionRunId) {
      await prisma.executionRun.update({
        where: { id: result.executionRunId },
        data: {
          status: 'FAILED',
          errorMessage,
          completedAt: new Date(),
        },
      });
    }

    return result;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the demo
runDemo()
  .then(result => {
    console.log('\n=== Demo Result ===');
    console.log(JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('\n✅ Demo completed successfully!');
      console.log(`PR URL: ${result.prUrl}`);
      process.exit(0);
    } else {
      console.log('\n❌ Demo failed');
      console.log(`Error: ${result.error}`);
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
