import { expect } from 'chai';
import { describe, it } from 'mocha';
import { cursorRuleTemplate } from '../src/cursorRuleTemplate.js';

describe('cursorRuleTemplate', () => {
  it('should be a string', () => {
    expect(cursorRuleTemplate).to.be.a('string');
    expect(cursorRuleTemplate.length).to.be.greaterThan(0);
  });

  it('should start with YAML frontmatter', () => {
    expect(cursorRuleTemplate).to.match(/^---\n/);
    expect(cursorRuleTemplate).to.include('description: PullCraft - AI-powered pull request generator');
    expect(cursorRuleTemplate).to.include('globs:');
    expect(cursorRuleTemplate).to.include('alwaysApply: true');
    expect(cursorRuleTemplate).to.include('\n---\n');
  });

  it('should contain main sections', () => {
    expect(cursorRuleTemplate).to.include('# PullCraft Integration');
    expect(cursorRuleTemplate).to.include('## What is PullCraft?');
    expect(cursorRuleTemplate).to.include('## When to Use PullCraft');
    expect(cursorRuleTemplate).to.include('## Prerequisites');
    expect(cursorRuleTemplate).to.include('## Basic Usage');
    expect(cursorRuleTemplate).to.include('## Key Options');
    expect(cursorRuleTemplate).to.include('## Configuration');
    expect(cursorRuleTemplate).to.include('## Best Practices');
    expect(cursorRuleTemplate).to.include('## Example Workflows');
    expect(cursorRuleTemplate).to.include('## Troubleshooting');
    expect(cursorRuleTemplate).to.include('## AI Assistant Guidelines');
    expect(cursorRuleTemplate).to.include('## All Available Options');
  });

  it('should contain usage examples', () => {
    expect(cursorRuleTemplate).to.include('```bash');
    expect(cursorRuleTemplate).to.include('pullcraft');
    expect(cursorRuleTemplate).to.include('pullcraft main');
    expect(cursorRuleTemplate).to.include('pullcraft main feature-branch');
  });

  it('should contain configuration examples', () => {
    expect(cursorRuleTemplate).to.include('.pullcraftrc');
    expect(cursorRuleTemplate).to.include('"baseDefault": "main"');
    expect(cursorRuleTemplate).to.include('"openPr": true');
    expect(cursorRuleTemplate).to.include('"githubStrategy": "gh"');
  });

  it('should contain workflow examples', () => {
    expect(cursorRuleTemplate).to.include('### Feature PR');
    expect(cursorRuleTemplate).to.include('### Bug Fix PR');
    expect(cursorRuleTemplate).to.include('### Documentation PR');
    expect(cursorRuleTemplate).to.include('git checkout -b feature/user-dashboard');
    expect(cursorRuleTemplate).to.include('git checkout -b fix/login-validation');
    expect(cursorRuleTemplate).to.include('git checkout -b docs/api-endpoints');
  });

  it('should contain troubleshooting information', () => {
    expect(cursorRuleTemplate).to.include('OPENAI_API_KEY is not set');
    expect(cursorRuleTemplate).to.include('GITHUB_TOKEN is not set');
    expect(cursorRuleTemplate).to.include('No changes found');
    expect(cursorRuleTemplate).to.include('export OPENAI_API_KEY=your_key');
    expect(cursorRuleTemplate).to.include('gh auth login');
  });

  it('should contain AI assistant guidelines', () => {
    expect(cursorRuleTemplate).to.include('Only suggest AFTER code is committed and pushed');
    expect(cursorRuleTemplate).to.include('Always include `--hint` with meaningful context');
    expect(cursorRuleTemplate).to.include('Uses `gh` strategy by default');
    expect(cursorRuleTemplate).to.include('Opens PR in browser unless `--open-pr false`');
  });

  it('should contain CLI options reference', () => {
    expect(cursorRuleTemplate).to.include('pullcraft [baseBranch] [compareBranch] [options]');
    expect(cursorRuleTemplate).to.include('--base-branch <branch>');
    expect(cursorRuleTemplate).to.include('--compare-branch <branch>');
    expect(cursorRuleTemplate).to.include('--exclusions <patterns>');
    expect(cursorRuleTemplate).to.include('--open-pr');
    expect(cursorRuleTemplate).to.include('--github-strategy <strategy>');
    expect(cursorRuleTemplate).to.include('--hint <text>');
    expect(cursorRuleTemplate).to.include('--title-template <template>');
    expect(cursorRuleTemplate).to.include('--description-template <body>');
    expect(cursorRuleTemplate).to.include('--diff-threshold <number>');
    expect(cursorRuleTemplate).to.include('--api-key <key>');
    expect(cursorRuleTemplate).to.include('--model <model>');
    expect(cursorRuleTemplate).to.include('--temp <temperature>');
    expect(cursorRuleTemplate).to.include('--dumpTo <filename>');
    expect(cursorRuleTemplate).to.include('--version');
  });

  it('should be under 500 lines (Cursor best practice)', () => {
    const lines = cursorRuleTemplate.split('\n').length;
    expect(lines).to.be.lessThan(500);
  });

  it('should contain conventional commit information', () => {
    expect(cursorRuleTemplate).to.include('conventional commit format');
    expect(cursorRuleTemplate).to.include('feat:, fix:, docs:');
    expect(cursorRuleTemplate).to.include('customizable');
  });

  it('should contain proper markdown formatting', () => {
    // Check for proper code blocks
    const codeBlocks = (cursorRuleTemplate.match(/```/g) || []).length;
    expect(codeBlocks).to.be.greaterThan(0);
    expect(codeBlocks % 2).to.equal(0); // Should be even (opening and closing)

    // Check for proper headers
    expect(cursorRuleTemplate).to.match(/# PullCraft Integration/);
    expect(cursorRuleTemplate).to.match(/## \w+/);
    expect(cursorRuleTemplate).to.match(/### \w+/);

    // Check for lists
    expect(cursorRuleTemplate).to.include('- ');
    expect(cursorRuleTemplate).to.include('✅');
    expect(cursorRuleTemplate).to.include('❌');
  });

  it('should end properly', () => {
    expect(cursorRuleTemplate).to.match(/```\n`;$/);
  });
});
