/**
 * Template for Cursor rules file to integrate PullCraft into Cursor AI workflows
 */

export const cursorRuleTemplate = `---
description: PullCraft - AI-powered pull request generator
globs:
alwaysApply: true
---

# PullCraft Integration

## When to Use PullCraft

✅ **Use when:** Code is committed, pushed, and ready for PR
❌ **Don't use:** Before committing or on unpushed branches

## Prerequisites

- [ ] Changes committed and pushed
- [ ] \`OPENAI_API_KEY\` set
- [ ] GitHub CLI authenticated (\`gh auth login\`)

## Basic Usage

\`\`\`bash
# Create PR from current branch to default base (main/develop)
pullcraft

# Specify base branch
pullcraft main

# Specify both base and compare branches
pullcraft main feature-branch
\`\`\`

## Key Options

\`\`\`bash
# Add context for better results
pullcraft main --hint "Refactors authentication to use JWT tokens"

# Don't auto-open browser
pullcraft main --open-pr false

# Exclude files from analysis
pullcraft main --exclusions "*.md,package-lock.json,*.svg"
\`\`\`

## Configuration

Create \`.pullcraftrc\` in project root for custom settings:

\`\`\`json
{
  "baseDefault": "main",
  "openPr": true,
  "githubStrategy": "gh",
  "exclusions": ["*.md", "package-lock.json"],
  "diffThreshold": 400,
  "openai": {
    "model": "gpt-4o",
    "temperature": 0.2,
    "titleTemplate": "Custom title format: <TITLE>",
    "bodyTemplate": "Custom body format:\n\n<BODY>"
  }
}
\`\`\`

## Best Practices

1. **Commit first** - PullCraft analyzes committed changes
2. **Use \`--hint\`** - Provide context for better results
3. **Review output** - Always check generated title/description
4. **Descriptive branches** - Help AI understand context

## Example Workflows

### Feature PR
\`\`\`bash
git checkout -b feature/user-dashboard
# ... make changes ...
git add .
git commit -m "feat: implement user dashboard with analytics"
git push -u origin feature/user-dashboard
pullcraft main --hint "New dashboard with real-time analytics and charts"
\`\`\`

### Bug Fix PR
\`\`\`bash
git checkout -b fix/login-validation
# ... make changes ...
git commit -m "fix: resolve infinite loop in login validation"
git push -u origin fix/login-validation
pullcraft main --hint "Fixes infinite loop bug in login validation"
\`\`\`

### Documentation PR
\`\`\`bash
git checkout -b docs/api-endpoints
# ... make changes ...
git commit -m "docs: add REST API documentation"
git push -u origin docs/api-endpoints
pullcraft main --hint "Comprehensive API endpoint documentation"
\`\`\`

## Troubleshooting

| Error | Solution |
|-------|----------|
| "OPENAI_API_KEY is not set" | \`export OPENAI_API_KEY=your_key\` |
| "GITHUB_TOKEN is not set" | \`gh auth login\` or \`export GITHUB_TOKEN=token\` |
| "No changes found" | Ensure different branches, changes committed |

## AI Assistant Guidelines

- ⚠️ Only suggest AFTER code is committed and pushed
- 💡 Always include \`--hint\` with meaningful context
- 🔑 Uses \`gh\` strategy by default (requires \`gh auth login\`)
- 🌐 Opens PR in browser unless \`--open-pr false\`

## Common Options

| Flag | Purpose | Example |
|------|---------|---------|
| \`--hint\` | Add context for AI | \`--hint "Refactors auth system"\` |
| \`--exclusions\` | Skip files in diff | \`--exclusions "*.lock,dist/"\` |
| \`--open-pr false\` | Don't auto-open browser | |
| \`--model\` | Change AI model | \`--model gpt-4\` |
`;

