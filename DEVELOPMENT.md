# Development Guide

This guide describes how to set up the development environment, test the extension locally, and publish new versions.

## Local Development

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Visual Studio Code](https://code.visualstudio.com/) or [Antigravity](https://antigravity.dev/)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/aeckit/visualizer-vsix.git
   cd visualizer-vsix
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Building the Extension

The project uses `esbuild` to bundle the React webview and `tsc` for the extension logic.

- **One-time build:**
  ```bash
  npm run compile
  ```

- **Watch mode (recommended for development):**
  ```bash
  npm run watch
  ```
  This will automatically rebuild the webview and extension when you save changes.

### Running & Testing Locally

1. Open the project in VS Code / Antigravity.
2. Go to the **Run and Debug** view (`Ctrl+Shift+D`).
3. Select **Run Visualizer Extension** from the dropdown.
4. Press `F5` to start a new **Extension Development Host** window.
5. In the new window, open any `.viz.json` file (you can find examples in the `examples/` directory).
6. The 3D viewer should automatically open.

> [!TIP]
> If you are modifying the Webview (React) code, you can simply reload the Extension Development Host window (`Developer: Reload Window` command) to see your changes after the watch task has finished rebuilding.

## Project Structure

- `src/`: Extension backend logic (VS Code integration).
- `webview-ui/`: React-based frontend for the 3D viewer.
- `out/`: Compiled output (ignored by git).
- `esbuild.js`: Bundling configuration for the webview.

## Publishing

This section describes how to release a new version of the extension to the Visual Studio Marketplace and the Open VSX Registry.

### 1. Preparation

Before publishing, ensure the following are updated and verified:

- [ ] **Version**: Bump the `"version"` in `package.json` (e.g., `0.0.2`) according to [SemVer](https://semver.org/).
- [ ] **Changelog**: (Optional) Update the `README.md` or a `CHANGELOG.md` with new features.
- [ ] **Metadata**: Ensure `LICENSE`, `icon.png`, and `README.md` are present in the root.
- [ ] **Ignore List**: Check `.vscodeignore` to ensure development files are excluded.

### 2. Build & Package

To create the `.vsix` bundle:

```bash
# 1. Clean and install dependencies
npm install

# 2. Build the extension and webview
npm run compile

# 3. Create the package
npx @vscode/vsce package
```

#### Verification
Before uploading, verify that the package only contains necessary files:
```bash
npx @vscode/vsce ls --tree
```
> [!IMPORTANT]
> Ensure that `node_modules/`, `src/`, and `webview-ui/` are **excluded** from the output. If they appear, update `.vscodeignore`.

### 3. Publishing to Registries

#### Visual Studio Marketplace
To publish to the official VS Code marketplace, you need a Personal Access Token (PAT) from Azure DevOps.

```bash
# Login (one-time)
npx @vscode/vsce login aeckit

# Publish
npx @vscode/vsce publish
```
*Alternatively, pass the token directly:* `npx @vscode/vsce publish -p $VSCE_PAT`

#### Open VSX Registry
To publish to the Open VSX registry (used by Antigravity, VSCodium, etc.), you need an [Open VSX PAT](https://open-vsx.org/settings/tokens).

```bash
# Publish using your token
npx ovsx publish --pat $OVSX_PAT
```

### Quick Reference: Publishing a New Version

If you have your environment variables (`VSCE_PAT`, `OVSX_PAT`) configured, the process is:

1. Update version in `package.json`.
2. `npm run compile`
3. `npx @vscode/vsce publish -p $VSCE_PAT`
4. `npx ovsx publish --pat $OVSX_PAT`
