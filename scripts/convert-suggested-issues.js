#!/usr/bin/env node

/**
 * convert-suggested-issues.js
 *
 * Converts AI-suggested issue markdown files (from Jules or other agents)
 * into active GitHub Issues using GitHub CLI (`gh`).
 *
 * Usage:
 *   node scripts/convert-suggested-issues.js
 *   node scripts/convert-suggested-issues.js --dry-run
 *   node scripts/convert-suggested-issues.js --file path/to/suggestions.md
 *   node scripts/convert-suggested-issues.js --pr 123 --close-pr
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const deleteAfter = args.includes('--delete');
const closePr = args.includes('--close-pr');

function getArgValue(flag) {
  const index = args.indexOf(flag);
  if (index !== -1 && index + 1 < args.length) {
    return args[index + 1];
  }
  return null;
}

const customFile = getArgValue('--file');
const customDir = getArgValue('--dir');
const prNumber = getArgValue('--pr') || process.env.PR_NUMBER || process.env.GITHUB_PR_NUMBER;

const SUGGESTIONS_DIR = customDir || path.join(__dirname, '..', '.github', 'suggested-issues');

function parseFrontmatter(content) {
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { metadata: {}, body: content.trim() };
  }

  const rawYaml = match[1];
  const body = match[2].trim();
  const metadata = {};

  for (const line of rawYaml.split(/\r?\n/)) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;
    const key = line.slice(0, colonIndex).trim();
    let val = line.slice(colonIndex + 1).trim();

    // Parse simple arrays: ["a", "b"] or [a, b]
    if (val.startsWith('[') && val.endsWith(']')) {
      const inner = val.slice(1, -1);
      metadata[key] = inner
        .split(',')
        .map((s) => s.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
    } else {
      metadata[key] = val.replace(/^["']|["']$/g, '');
    }
  }

  return { metadata, body };
}

function extractTitleAndBody(content) {
  const { metadata, body } = parseFrontmatter(content);

  let title = metadata.title;
  let cleanBody = body;

  if (!title) {
    const headingMatch = cleanBody.match(/^#\s+(.+)$/m);
    if (headingMatch) {
      title = headingMatch[1].trim();
    } else {
      const firstLine = cleanBody.split(/\r?\n/)[0];
      title = firstLine.replace(/^#*\s*/, '').trim();
    }
  }

  // Remove top-level H1 heading matching title from body if duplicated
  cleanBody = cleanBody.replace(new RegExp(`^#\\s+${escapeRegex(title)}\\r?\\n*`, 'i'), '');

  // Default labels
  let labels = ['jules-suggested', 'triage'];
  if (Array.isArray(metadata.labels) && metadata.labels.length > 0) {
    labels = Array.from(new Set([...labels, ...metadata.labels]));
  }

  return {
    title,
    body: cleanBody,
    labels,
    metadata
  };
}

function escapeRegex(string) {
  return string.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
}

function splitMultiIssueFile(content) {
  // Check if a single markdown file contains multiple suggested issues (split by '---' or '# [')
  const sections = [];
  const parts = content.split(/\n(?=(?:#\s|---\s*\n#))/g);

  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.length > 20) {
      sections.push(trimmed);
    }
  }

  return sections;
}

function createGitHubIssue(issueData, filePath) {
  const { title, body, labels } = issueData;

  console.log(`\n========================================`);
  console.log(`Title : ${title}`);
  console.log(`Labels: ${labels.join(', ')}`);
  console.log(`Source: ${filePath || 'Inline'}`);
  console.log(`========================================`);

  if (isDryRun) {
    console.log(`[DRY-RUN] Would execute: gh issue create --title "${title}" --label "${labels.join(',')}"`);
    return `https://github.com/example/issues/dry-run`;
  }

  // Create temporary body file to prevent shell quoting issues
  const tempBodyFile = path.join(__dirname, `temp_issue_body_${Date.now()}_${Math.random().toString(36).slice(2)}.txt`);
  try {
    fs.writeFileSync(tempBodyFile, body, 'utf8');

    const ghArgs = [
      'issue',
      'create',
      '--title',
      title,
      '--body-file',
      tempBodyFile,
      '--label',
      labels.join(',')
    ];

    const result = execFileSync('gh', ghArgs, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
    const issueUrl = result.trim();
    console.log(`Created: ${issueUrl}`);
    return issueUrl;
  } finally {
    if (fs.existsSync(tempBodyFile)) {
      fs.unlinkSync(tempBodyFile);
    }
  }
}

async function main() {
  const createdIssues = [];

  if (customFile) {
    if (!fs.existsSync(customFile)) {
      console.error(`Error: Specified file does not exist: ${customFile}`);
      process.exit(1);
    }

    const content = fs.readFileSync(customFile, 'utf8');
    const sections = splitMultiIssueFile(content);

    if (sections.length > 1) {
      console.log(`Detected multi-issue file with ${sections.length} suggestions.`);
      for (const section of sections) {
        const issueData = extractTitleAndBody(section);
        if (issueData.title) {
          const url = createGitHubIssue(issueData, customFile);
          createdIssues.push({ title: issueData.title, url });
        }
      }
    } else {
      const issueData = extractTitleAndBody(content);
      const url = createGitHubIssue(issueData, customFile);
      createdIssues.push({ title: issueData.title, url });
    }

    if (deleteAfter && !isDryRun) {
      fs.unlinkSync(customFile);
      console.log(`Removed: ${customFile}`);
    }
  } else {
    if (!fs.existsSync(SUGGESTIONS_DIR)) {
      console.log(`Suggestions directory not found: ${SUGGESTIONS_DIR}`);
      process.exit(0);
    }

    const files = fs.readdirSync(SUGGESTIONS_DIR)
      .filter((file) => file.endsWith('.md') && !['TEMPLATE.md', 'README.md'].includes(file));

    if (files.length === 0) {
      console.log(`No suggestion files found in ${SUGGESTIONS_DIR}`);
      process.exit(0);
    }

    console.log(`Found ${files.length} suggestion file(s) to process.`);

    for (const file of files) {
      const filePath = path.join(SUGGESTIONS_DIR, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const issueData = extractTitleAndBody(content);

      if (!issueData.title) {
        console.warn(`Skipping ${file}: Could not determine issue title.`);
        continue;
      }

      const url = createGitHubIssue(issueData, filePath);
      createdIssues.push({ title: issueData.title, url, file: filePath });

      if (deleteAfter && !isDryRun) {
        fs.unlinkSync(filePath);
        console.log(`Removed: ${filePath}`);
      }
    }
  }

  // PR comment and closure if applicable
  if (prNumber && createdIssues.length > 0 && !isDryRun) {
    const commentBody = [
      '### 🤖 Jules Suggestions Converted to GitHub Issues',
      '',
      ...createdIssues.map((item) => `- [${item.title}](${item.url})`),
      '',
      '_Created automatically by `convert-suggested-issues` workflow._'
    ].join('\n');

    console.log(`Commenting on PR #${prNumber}...`);
    try {
      execFileSync('gh', ['pr', 'comment', prNumber, '--body', commentBody], { stdio: 'inherit' });
    } catch (e) {
      console.error(`Failed to comment on PR #${prNumber}:`, e.message);
    }

    if (closePr) {
      console.log(`Closing PR #${prNumber}...`);
      try {
        execFileSync('gh', ['pr', 'close', prNumber, '--comment', 'Closing PR: all suggested issues have been converted to active GitHub backlog issues.'], { stdio: 'inherit' });
      } catch (e) {
        console.error(`Failed to close PR #${prNumber}:`, e.message);
      }
    }
  }

  console.log(`\nSuccessfully processed ${createdIssues.length} issue(s).`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
