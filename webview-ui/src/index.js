"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const client_1 = require("react-dom/client");
const GeometryViewer_1 = require("./GeometryViewer");
const App = () => {
    const [geoData, setGeoData] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        // Listen for messages directly from the VS Code Extension Host
        const handleMessage = (event) => {
            const message = event.data;
            if (message.type === 'update') {
                try {
                    const parsed = JSON.parse(message.text);
                    setGeoData(parsed);
                }
                catch (e) {
                    console.error("Failed to parse .geo.json data", e);
                }
            }
        };
        window.addEventListener('message', handleMessage);
        // Let the VS Code host know we are ready to receive the file data
        // @ts-ignore
        const vscode = acquireVsCodeApi();
        vscode.postMessage({ type: 'ready' });
        return () => window.removeEventListener('message', handleMessage);
    }, []);
    if (!geoData) {
        return <div style={{ color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif' }}>Loading 3D Geometry...</div>;
    }
    return <GeometryViewer_1.default data={geoData}/>;
};
const rootElement = document.getElementById('root');
if (rootElement) {
    const root = (0, client_1.createRoot)(rootElement);
    root.render(<App />);
}
//# sourceMappingURL=index.js.map