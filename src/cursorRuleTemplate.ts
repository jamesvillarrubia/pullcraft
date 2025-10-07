/**
 * Template for Cursor rules file to integrate PullCraft into Cursor AI workflows
 */

export const cursorRuleTemplate = `---
description: PullCraft - AI-powered pull request generator
globs:
alwaysApply: true
---

# PullCraft Integration

## What is PullCraft?

PullCraft is an AI-powered CLI tool that automatically generates pull request titles and descriptions by analyzing git diffs. It uses OpenAI to create meaningful, well-structured PRs. By default, it uses conventional commit format (feat:, fix:, etc.), but templates are fully customizable.

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

**Note:** PullCraft uses conventional commit format by default (feat:, fix:, docs:), but you can customize templates to use any format you prefer via \`titleTemplate\` and \`bodyTemplate\` options.

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

## All Available Options

\`\`\`bash
pullcraft [baseBranch] [compareBranch] [options]

Options:
  -n, --base-branch <branch>           Base branch
  -c, --compare-branch <branch>        Compare branch
  -e, --exclusions <patterns>          File exclusion patterns (comma-separated)
  -o, --open-pr                        Open PR in browser automatically
  -g, --github-strategy <strategy>     'gh' or 'octokit' (default: 'gh')
  -h, --hint <text>                    Hint for AI about the changes
  -t, --title-template <template>      Custom title template
  -d, --description-template <body>    Custom description template
  -f, --diff-threshold <number>        Max lines per file in diff (default: 400)
  --api-key <key>                      OpenAI API Key
  --model <model>                      OpenAI model (default: 'gpt-4o')
  --temp <temperature>                 Temperature for AI (default: 0.2)
  --dumpTo <filename>                  Dump diff to file instead of creating PR
  -v, --version                        Display version
\`\`\`
`;
