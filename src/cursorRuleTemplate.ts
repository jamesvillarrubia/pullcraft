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

✅ **Use pullcraft when:**
- Code changes are committed and pushed to a feature branch
- Ready to create a pull request
- Want AI-generated PR titles and descriptions based on code changes

❌ **Do NOT use pullcraft:**
- Before committing changes
- On branches with no commits
- When branch hasn't been pushed to remote yet

## Prerequisites

Before running pullcraft:
1. ✓ All changes committed to current branch
2. ✓ Branch pushed to remote repository
3. ✓ \`OPENAI_API_KEY\` environment variable is set
4. ✓ Authenticated with GitHub CLI (\`gh auth login\`) OR \`GITHUB_TOKEN\` set

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

### Provide context hint for better PR descriptions
\`\`\`bash
pullcraft main --hint "Refactors authentication to use JWT tokens"
\`\`\`

### Control PR opening behavior
\`\`\`bash
pullcraft main --open-pr false
\`\`\`

### Exclude files from diff analysis
\`\`\`bash
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

1. **Always commit first** - PullCraft analyzes committed changes
2. **Use \`--hint\`** - Provide context for complex PRs
3. **Review AI output** - Always review generated title and description
4. **Conventional commits format** - By default, PullCraft generates titles following conventional commit format (feat:, fix:, docs:, etc.), but this is customizable via templates
5. **Descriptive branches** - Branch names help AI understand context

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

**"OPENAI_API_KEY is not set"**
\`\`\`bash
export OPENAI_API_KEY=your_key_here
\`\`\`

**"GITHUB_TOKEN is not set"** (octokit strategy)
\`\`\`bash
gh auth login
# OR
export GITHUB_TOKEN=your_github_token
\`\`\`

**"No changes found"**
- Ensure comparing different branches
- Verify changes are committed
- Check you're not comparing branch to itself

## Important Notes for AI Assistants

- ⚠️ Only suggest pullcraft AFTER code is committed and pushed
- 💡 Always provide meaningful \`--hint\` to improve PR quality
- 🔑 Default to \`gh\` strategy (requires \`gh auth login\`)
- 🌐 PullCraft opens PR in browser by default unless \`--open-pr false\`
- 📝 Generated PRs use conventional commit format by default, but this is customizable
- 🎨 Users can customize PR title and body templates via CLI options or config file

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

