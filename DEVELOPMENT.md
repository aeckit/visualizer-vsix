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

### 1. Versioning

Before publishing, ensure the version number in `package.json` is updated according to [Semantic Versioning](https://semver.org/).

### 2. Packaging

To package the extension into a `.vsix` file:

```bash
# Ensure everything is compiled
npm run compile

# Create the package
npx vsce package
```

This will generate a file named `aeckit-visualizer-X.X.X.vsix`.

### 3. Publishing to Registries

The extension is published to both the Visual Studio Marketplace and the Open VSX Registry.

#### Visual Studio Marketplace
```bash
npx vsce publish
```

#### Open VSX Registry
```bash
npx ovsx publish
```

> [!IMPORTANT]
> You will need to have the appropriate access tokens (PAT for Azure DevOps / Open VSX Token) configured or passed via the command line to publish.
