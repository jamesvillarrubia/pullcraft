/**
 * Cursor integration functionality
 * Creates a Cursor rules file to integrate PullCraft into Cursor AI workflows
 */

import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { cursorRuleTemplate } from './cursorRuleTemplate.js';

export interface CursorCommandOptions {
  force?: boolean;
}

/**
 * Creates a Cursor rules file in .cursor/rules/pullcraft.mdc
 * This integrates PullCraft into Cursor's AI assistant workflows
 */
export function createCursorRule (options: CursorCommandOptions = {}): void {
  const cursorDir = join(process.cwd(), '.cursor');
  const rulesDir = join(cursorDir, 'rules');
  const ruleFile = join(rulesDir, 'pullcraft.mdc');

  // Check if file already exists
  if (existsSync(ruleFile) && !options.force) {
    console.error(
      'Error: .cursor/rules/pullcraft.mdc already exists. Use --force to overwrite.'
    );
    process.exit(1);
  }

  try {
    // Create .cursor directory if it doesn't exist
    if (!existsSync(cursorDir)) {
      mkdirSync(cursorDir, { recursive: true });
      console.log('Created .cursor directory');
    }

    // Create rules directory if it doesn't exist
    if (!existsSync(rulesDir)) {
      mkdirSync(rulesDir, { recursive: true });
      console.log('Created .cursor/rules directory');
    }

    // Write the rule file
    writeFileSync(ruleFile, cursorRuleTemplate, 'utf8');
    console.log('✅ Successfully created .cursor/rules/pullcraft.mdc');
    console.log('');
    console.log('This file provides Cursor AI with context about how to use PullCraft.');
    console.log('The AI assistant will now understand when and how to use pullcraft commands.');
  } catch (error: any) {
    console.error('Error creating Cursor rule file:', error.message);
    process.exit(1);
  }
}
