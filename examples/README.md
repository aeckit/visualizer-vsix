# Visualization Examples & Schema

This directory provides the reference documentation and examples needed for AI agents to generate `.viz.json` files for the **aeckit Visualizer**.

## JSON Schema

The visualizer expects a JSON structure describing 3D wireframe geometry. It supports rendering multiple distinct objects in a single view.

### Root Object

| Field | Type | Description |
|---|---|---|
| `objects` | `Array` | A list of geometry objects. |

### Geometry Object

Each item in the `objects` array should follow this structure:

| Field | Type | Description |
|---|---|---|
| `color` | `String` | (Optional) Hex code (e.g., `"#58a6ff"`) or CSS color name. |
| `vertices` | `Array` | A list of `[x, y, z]` coordinate triples. |
| `edges` | `Array` | A list of `[startIndex, endIndex]` pairs referencing the indices of the `vertices` array. |

---

## Example: Multiple Objects

Agents can use this example as a "few-shot" prompt template. It defines a red square on the floor and a green triangle floating above it.

```json
{
  "objects": [
    {
      "color": "#ff5555",
      "vertices": [
        [0, 0, 0],
        [10, 0, 0],
        [10, 10, 0],
        [0, 10, 0]
      ],
      "edges": [
        [0, 1], [1, 2], [2, 3], [3, 0]
      ]
    },
    {
      "color": "#55ff55",
      "vertices": [
        [5, 5, 10],
        [8, 8, 10],
        [2, 8, 10]
      ],
      "edges": [
        [0, 1], [1, 2], [2, 0]
      ]
    }
  ]
}
```

## Tips for Agents

- **Zero-Indexing**: The `edges` array must use 0-based indices to point to the `vertices`.
- **Coordinate System**: The visualizer uses a standard 3D coordinate system. In 2D "XY" mode, the Z-axis is ignored (top-down).
- **Auto-Centering**: The visualizer automatically calculates the bounding box and centers the view on the geometry.
