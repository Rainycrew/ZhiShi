# Contributing to ZhiSh

Thank you for considering contributing to ZhiSh. Whether you are reporting a problem, suggesting an improvement, or submitting code, your participation matters.

Before you get started, please read this guide. It explains how to report issues, how to submit code, and what we expect in terms of code style and commit messages.

## Code of Conduct

This project follows the [Contributor Covenant](https://www.contributor-covenant.org/) Code of Conduct. By participating, you agree to abide by it. Please be kind and respectful.

The full text is available in [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).

## How to Contribute

### Reporting Issues

If you find a bug or want to report a barrier, please first check the [Issues](https://github.com/Rainycrew/ZhiSh/issues) to see whether the same problem has already been reported.

When opening a new issue, please include as much of the following as possible:

- A clear and descriptive title
- A brief description of the problem or barrier
- Steps to reproduce
- Expected behavior vs. actual behavior
- Your environment information (operating system, browser/runtime, ZhiSh version)
- Screenshots or logs, if applicable (optional)

If you are reporting an accessibility-related barrier, you may also refer to the reporting process described in the [Accessibility document](./Accessibility.md).

### Suggesting Features or Improvements

Please start a discussion in Issues first. Describe the problem you want to solve, your proposed approach, and possible alternatives. Confirming the direction and scope before writing code helps avoid unnecessary work.

### Submitting Code

We use the standard Fork + Pull Request workflow:

1. **Fork** this repository to your GitHub account.
2. **Clone** your fork to your local machine.
3. **Create a branch** with a name that reflects the change, for example:
   - `fix/xxx`
   - `feat/xxx`
   - `docs/xxx`
4. **Write your code** and make sure it follows the code style and testing requirements below.
5. **Commit your changes** using the commit message conventions below.
6. **Push** to your remote repository.
7. Open a **Pull Request** against the main branch on GitHub. In the description, explain what you changed, link any related issues, and describe how you verified the change.

## Development Environment and Running the Project

ZhiSh is built with **Vue**. The current official releases support **Android** and **Windows x64**.

If you want to run or develop from source, you will need a suitable environment. Please refer to the project documentation in the repository for installation and startup instructions. If you are only working on documentation, translation, or accessibility-related improvements, a full build environment is usually not required.

## Code Style

- Follow the existing code style and directory structure of the project.
- For Vue components, prefer the **Composition API** and `<script setup>`, consistent with the existing codebase.
- Keep components small and focused, and use clear naming.
- Add necessary comments for public APIs, complex logic, or code that is easy to misunderstand.
- If the project has ESLint / Prettier configured, run the corresponding checks before submitting.

## Testing and Verification

Before submitting a PR, please try to do the following:

- If the project has tests, make sure existing tests pass.
- If you fixed a bug, add tests or explain how the fix can be verified.
- If your change affects the interface, interaction, or accessibility behavior, describe in the PR what checks you performed (for example, keyboard operation, screen reader testing, zoom/contrast checks, or note that it was not tested).

**Note**: The project does not currently have mandatory CI accessibility checks. A tool reporting no errors does not mean there are no accessibility issues. Please take responsibility for your changes and verify manually when necessary.

## Commit Message Conventions

We recommend using the **Conventional Commits** style. The basic format is:

```text
<type>(<optional scope>): <description>
