# Ceres Assistant

**Focused AI assistance for the code in front of you.**

Ceres assistant is an AI sidebar for VS Code that helps with code, files, errors, terminal output, Git changes, and debugging work.

It is built for developers who want AI nearby, not AI taking over. Instead of turning every request into a full autonomous run, Ceres keeps the workflow explicit: ask questions, get context-aware suggestions, it is that simple.

![Ceres IDE screenshot](https://ceres-assistant.com/screenshots-new/2026-08-03_00-00-00.webp)

## Why Ceres?

Many AI coding tools are designed around large agent runs. That can be powerful, but it can also be expensive, noisy, and hard to control.

Ceres takes a smaller, more predictable path:

- Send files or selection, errors, terminal output, or Git context.
- Use OpenAI-compatible APIs, perfect for budget models and local model cases.
- Keep the assistant inside your normal editor workflow.
- Avoid spending tokens on context you did not ask for.
- Get instant suggestions without waiting for a long task to complete.

## What Ceres Is

Ceres is a practical AI assistant inside VS Code.

Use it when you want help with:

- Explaining selected code
- Refactoring a function or file
- Understanding an error
- Reviewing Git changes
- Inspecting terminal output
- Troubleshooting debugging issues
- Drafting commands
- Working with local or custom AI providers
- Getting controlled suggestions for the active editor

## What Ceres Is Not

Ceres is not designed to take over your whole repository.

It does not try to silently crawl every file, plan a large autonomous task, and rewrite your project on its own. If you want a full end-to-end coding agent that works independently for a long session, tools like Cursor, Copilot agents, Cline/Kilo, Claude Code, Codex, or other agent platforms may be a better fit.

Ceres is strongest when you already know the area you want to work on and want focused AI help without handing over the entire workflow.

## Features

- **AI sidebar inside VS Code**: Chat with AI without leaving the editor.
- **Add selected code or files to chat**: Send only the code selection or file you care about.
- **Custom prompts**: Use your own prompts for inline buttons or chat shortcuts.
- **Active file context**: Ask from the file currently open in the editor.
- **Workspace Problems**: Send diagnostics and errors from VS Code Problems.
- **Git worktree review**: Read current staged and unstaged changes.
- **Incoming Git overview**: Inspect incoming commits and diffs before pulling.
- **Git history context**: Review recent commits and repository history.
- **Terminal access**: Use shell-integrated terminal commands and output as context.
- **Debugging help**: Use Ceres to reason through errors, broken flows, and problem areas in your code.
- **Voice input**: Dictate prompts or speak code changes directly on selected code.
- **Use suggestions manually**: Review suggestions first, then choose whether to insert or replace text in the active editor.
- **Run terminal suggestions**: Send supported command suggestions to a VS Code terminal.
- **Custom providers and local models**: Use OpenAI-compatible endpoints, OpenRouter, DeepSeek, Ollama, LM Studio, and other compatible providers.

## Local And Custom Models

Ceres is provider-flexible by design. You can use hosted models when you need stronger reasoning, or local and budget models for everyday development work.

![Choose your AI models in Ceres](https://ceres-assistant.com/screenshots-new/2026-06-03_17-00-29.webp)

Typical setups include:

- Ollama
- LM Studio
- OpenAI-compatible APIs
- OpenRouter
- DeepSeek
- OpenAI
- Other compatible model providers

This makes Ceres useful for developers who care about cost, privacy boundaries, experimentation, or avoiding lock-in.

## Context Control

Ceres works best when the developer chooses the right context.

Instead of assuming the whole repository is relevant, Ceres lets you send focused material:

- A code selection
- A full file
- Current editor context
- Workspace diagnostics
- Git diffs
- Terminal output
- Debugging-related code and errors
- URLs, PDFs, images, audio, and other supported inputs

Better context usually means better answers, lower token usage, and fewer hallucinations.

## Optional Navigation Mode

Enable the Navigation mode an optional agent mode. When enabled, Ceres can find and read relevant workspace files, search the codebase, inspect Git information, and gather the context needed to answer your request or finish your task. You can turn it off at any time and continue using the regular focused chat workflow!

## Common Workflows

### Explain Or Improve A Selection

Select code, run **Add Selection to Ceres**, and ask for an explanation, refactor, review, or bug check.

Default shortcut:

```text
Ctrl+Alt+L
```

On macOS:

```text
Cmd+Alt+L
```

### Ask About A Problem

Use the Ceres action on an error or warning to send the diagnostic and nearby code context into chat.

### Review Before Pulling

Ask Ceres to inspect incoming Git changes before merging them into your working tree.

### Edit code with Voice

Select a code block and describe the change. Ceres rewrites the selected code as you speak.

also you can use speech recognition instead of typing every prompt. Speech recognition helps you describe code changes, debugging notes, and follow-up questions while staying in the flow.

![Speech recognition in vscode](https://ceres-assistant.com/screenshots-new/2026-05-26_17-17-19.webp)

## Commands

Ceres contributes these VS Code commands:

- **Add File to Ceres**
- **Add Selection to Ceres**
- **Add Problem to Ceres**

You can access them from editor context menus, explorer context menus, editor title actions, code actions, and the command palette.

## Requirements

- VS Code 1.80.0 or newer
- An AI provider or local model endpoint if you want to use external/custom models
- Git installed for Git review features
- VS Code terminal shell integration for terminal activity capture
- A project or code path you want help debugging

## Best For

Ceres is a good fit for:

- Developers who want control over AI context
- Teams working on legacy or sensitive codebases
- People using local or lower-cost models
- Developers who prefer assistant workflows over autopilot workflows
- Anyone tired of spending tokens on context that was never needed

## Known Limits

- Ceres is not a full autonomous coding agent.
- It does not automatically understand your whole repository unless you provide the relevant context.
- Terminal activity depends on VS Code shell integration and cannot read old terminal scrollback.
- AI suggestions should be reviewed before you use them.

## Usage

Ceres is designed for minimal resource consumption and works even with the most affordable models. You are responsible for the provider you connect, the model you select, and the data you include in prompts. If you use a hosted provider, your data is sent according to their terms. If you use a local setup with Ollama or LM Studio, your code and data never leave your machine.

## Bug Reports and Feedback
https://ceres-assistant.com/web/contact.php

## Privacy Policy Page
https://ceres-assistant.com/web/privacy-policy.php
