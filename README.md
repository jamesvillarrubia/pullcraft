# PullCraft

[![NPM](https://img.shields.io/npm/l/pullcraft)](https://github.com/yourusername/pullcraft/blob/main/LICENSE)
[![npm](https://img.shields.io/npm/v/pullcraft?label=latest)](https://www.npmjs.com/package/pullcraft)
![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/yourusername/pullcraft/npm-publish.yml?branch=main)
[![Libraries.io dependency status for latest release](https://img.shields.io/librariesio/release/NPM/pullcraft)]()

PullCraft is a powerful CLI tool and library for automating the creation and management of GitHub pull requests. It uses AI to generate meaningful PR titles and descriptions based on your code changes.

## Table of Contents
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)

## Features

- Automatic PR creation and updating
- AI-powered generation of PR titles and descriptions
- Customizable templates for PR content
- Support for different GitHub authentication strategies
- Configurable file exclusions and diff thresholds
- Option to dump diffs to a file for manual review

## Prerequisites
- Node.js v14 or higher
- Git
- A GitHub account
- An OpenAI API key

## Quick Start

1. Install PullCraft:
   ```bash
   npm install -g pullcraft
   ```

2. Set up your OpenAI API key:
   - Option 1: Create a `.env` file in your project root:
     ```bash
     OPENAI_API_KEY=your_api_key_here
     ```
   - Option 2: Set it as an environment variable in your shell:
     ```bash
     export OPENAI_API_KEY=your_api_key_here
     ```
   - Option 3: Use the `--api-key` option when running PullCraft:
     ```bash
     pullcraft main feature-branch --api-key your_api_key_here
     ```

3. Create a PR:
   ```bash
   pullcraft main feature-branch
   ```

## Installation

```bash
npm install -g pullcraft
```

## Usage

### CLI Examples

PullCraft is primarily used as a command-line tool. Here are some common usage scenarios:

1. Basic usage (create a PR from current branch to main):
   ```bash
   pullcraft main
   ```

2. Specify both base and compare branches:
   ```bash
   pullcraft main feature-branch
   ```

3. Use custom file exclusions:
   ```bash
   pullcraft main --exclusions "*.md,package-lock.json"
   ```

4. Open the PR in the browser after creation:
   ```bash
   pullcraft main --open-pr
   ```

5. Use a specific GitHub strategy:
   ```bash
   pullcraft main --github-strategy octokit
   ```

6. Provide a hint for the AI:
   ```bash
   pullcraft main --hint "This PR updates the user authentication system"
   ```

7. Use custom templates:
   ```bash
   pullcraft main --title-template "feat: {{title}}" --description-template "## Changes\n\n{{description}}"
   ```

8. Set a custom diff threshold:
   ```bash
   pullcraft main --diff-threshold 600
   ```

9. Use a different OpenAI model:
   ```bash
   pullcraft main --model gpt-4
   ```

10. Dump the diff to a file for review:
    ```bash
    pullcraft main --dumpTo diff.txt
    ```

11. Combine multiple options:
    ```bash
    pullcraft main feature-branch --open-pr --exclusions "*.md" --hint "Bug fix for login system" --diff-threshold 500
    ```

Remember, you can always use the `--help` option to see all available commands and options:

```bash
pullcraft --help
```

These examples showcase the flexibility of PullCraft's CLI. You can mix and match options to suit your specific needs and workflow.

### Library

```javascript
import PullCraft from 'pullcraft';

const options = {
  // ... your configuration options
};

const pullCraft = new PullCraft(options);
pullCraft.createPr('main', 'feature-branch');
```

## Configuration

PullCraft can be configured using a `.pullcraftrc` file, environment variables, or command-line options. The configuration is resolved in the following order:

1. Command-line options
2. Configuration file
3. Default values

Example `.pullcraftrc` file:

```json
{
"baseDefault": "main",
"openPr": true,
"exclusions": [".md", "package-lock.json"],
"githubStrategy": "gh"
}
```

PullCraft will look for the OpenAI API key in the following order:
1. Command-line option (`--api-key`)
2. Environment variable (`OPENAI_API_KEY`)
3. `.env` file in the project root
4. Configuration file (`.pullcraftrc`)

Always ensure your API key is kept secure and not exposed in public repositories.

## API Reference

### `PullCraft(options)`

Creates a new PullCraft instance.

#### Options:

- `openPr`: Boolean to automatically open PR in browser
- `exclusions`: Array of file patterns to exclude
- `baseDefault`: Default base branch
- `openaiConfig`: OpenAI API configuration
- `githubStrategy`: GitHub authentication strategy ('gh' or 'octokit')
- `githubToken`: GitHub token (required for 'octokit' strategy)
- `placeholderPattern`: Pattern for placeholders in templates
- `diffThreshold`: Maximum number of lines for diff display

### `createPr(baseBranch, compareBranch)`

Creates or updates a pull request.

### `differ(baseBranch, compareBranch)`

Generates a diff between two branches and returns AI-generated PR content.

## Troubleshooting

If you encounter any issues, please check the following:

1. Ensure your OpenAI API key is correctly set.
2. Verify that you have the necessary permissions for the GitHub repository.
3. Check that your local Git repository is up to date.

For more detailed troubleshooting, please refer to our [FAQ](https://github.com/yourusername/pullcraft/wiki/FAQ).

## Support

If you need help or want to report an issue, please [open an issue](https://github.com/yourusername/pullcraft/issues/new) on our GitHub repository.

## Contributing

Please see [CONTRIBUTING.md](https://github.com/yourusername/pullcraft/blob/main/CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## Changelog

For a detailed changelog, please see the [CHANGELOG.md](https://github.com/yourusername/pullcraft/blob/main/CHANGELOG.md) file.


## License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/yourusername/pullcraft/blob/main/LICENSE) file for details.

## Acknowledgments

- OpenAI for providing the AI capabilities
- The GitHub CLI and Octokit teams for their excellent APIs