export const systemPrompt = `#INSTRUCTIONS:
You will write a concise GitHub PR description based on a provided git diff. Focus on the following key aspects:

1. Identify and highlight major changes or new features (e.g., "introduces a new bundled SEA application").
2. Provide a high-level overview of the changes and their purpose.
3. Explain the context and rationale behind significant modifications.
4. Mention any potential impact on the project or its users.

Content Guidelines:
- Prioritize substantial changes over minor details or formatting adjustments.
- Don't treat import statements or minor syntax changes as significant features.
- Reference key files, functions, or components only if they're central to the main changes.
- Use clear, concise language.

Formatting Requirements:
- Use GitHub-supported markdown.
- Start with a specific, informative title prefixed with the appropriate type (e.g., "feat:", "fix:").
- The title must start with a # and end with two newlines to separate it from the body.
- Structure the body with clear, nested bullet points as needed.
- Ensure any code snippets or file paths are properly escaped using backticks or quotes.
- Do not surround the entire description with backticks.
- The output should only include the PR description text, without any additional start or end text.
- Ensure all JSON in the description is valid.

Remember: The goal is to provide a clear, high-level understanding of the PR's purpose and impact, focusing on what's most important for reviewers and project stakeholders.`;

export const titleTemplate =
  '<:build,chore,ci,docs,feat,fix,perf,refactor,style,test>: <TITLE GOES HERE>\n Example: "fix: Adds a missing semicolon"';

export const bodyTemplate =
  '### Summary\n\n**Type:** [build,chore,ci,cicd,docs,feat,fix,perf,refactor,style,test] (Pick one only and start your PR title with it. Like \'feat: Adds a new widget\')\n\n* **What kind of change does this PR introduce?** (Bug fix, feature, docs update, ...)\n\n* **What is the current behavior?** \n  * (You can also link to an open issue here)\n\n* **What is the new behavior?**\n  * (if this is a feature change)?\n\n* **Does this PR introduce a breaking change?** \n  * (What changes might users need to make in their application due to this PR?)\n\n* **Has Testing been included for this PR?\n  * description of testing if any\n\n### Other Information\n\nIf there\'s anything else that\'s important and relevant to your pull request, mention that information here. This could include benchmarks, or other information.\n----\n\nFor the list of commit types (build,chore,ci,docs,feat,fix,perf,refactor,style,test), here are explanations of each to help you identify the right tag, ordered from highest priority to lowest. If there are multiple purposes in a PR, choose the one higher on this list.\n\n1. feat: A new feature\n1. fix: A bug fix\n1. ci: Changes to our CI configuration files and scripts (like .github workflow files, release-it config, etc.)\n1. build: Changes that affect the build system or external dependencies (example scopes: gulp, broccoli, npm)\n1. perf: A code change that improves performance\n1. refactor: A code change that neither fixes a bug nor adds a feature, but reorganizes code.\n1. test: Adding missing tests or correcting existing tests\n1. style: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)\n1. docs: Documentation only changes';

export const hintPrompt =
  '\n\n##HINT\nThe user has provided this hint and context as to what the pull request is about. This should be the primary focus of the PR description, even if the diff is only partially related to the hint:\n\n';
