# aeckit Visualizer

A VS Code extension that provides a custom 3D geometry viewer for `.viz.json` files.

## Features

- **3D Wireframe Viewer** — Opens `.viz.json` files in an interactive 3D viewer powered by Three.js instead of the default text editor.
- **2D / 3D Toggle** — Switch between a top-down 2D plan view and a full 3D perspective.
- **Plane Selection** — In 2D mode, snap the camera to the XY, XZ, or YZ plane.
- **Auto-Rotate** — Optional auto-rotation in 3D mode with a single click to toggle.
- **Live Updates** — Edit the raw JSON in a split editor and see changes reflected in the 3D viewer in real time.

## `.viz.json` Format

A `.viz.json` file is a standard JSON file that describes wireframe geometry using vertices and edges:

```json
{
  "type": "wireframe",
  "vertices": [
    [0, 0, 0],
    [5, 0, 0],
    [5, 5, 0],
    [0, 5, 0]
  ],
  "edges": [
    [0, 1], [1, 2], [2, 3], [3, 0]
  ]
}
```

| Field | Description |
|---|---|
| `type` | Currently supports `"wireframe"` |
| `vertices` | Array of `[x, y, z]` coordinate triples |
| `edges` | Array of `[startIndex, endIndex]` pairs referencing vertices |

## Usage

1. Install the extension.
2. Open any file with the `.viz.json` extension.
3. The 3D viewer opens automatically. To view the raw JSON alongside, split the editor (`Cmd+\`) and use **Reopen Editor With... → Text Editor** on the second pane.

> [!TIP]
> See the [examples/](./examples/) directory for sample files and instructions on how to **generate your own** visualization data.

## Requirements

- VS Code 1.80.0 or later (or any compatible fork such as the Antigravity IDE)

## Contributing

For instructions on how to set up the project locally, run tests, and publish new versions, see [DEVELOPMENT.md](./DEVELOPMENT.md).
