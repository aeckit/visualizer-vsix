import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import GeometryViewer from './GeometryViewer';

const App = () => {
  const [geoData, setGeoData] = useState<any>(null);
  const [rawText, setRawText] = useState<string>('');

  useEffect(() => {
    // Listen for messages directly from the VS Code Extension Host
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message.type === 'update') {
        try {
          setRawText(message.text);
          const parsed = JSON.parse(message.text);
          setGeoData(parsed);
        } catch (e) {
          console.error("Failed to parse .viz.json data", e);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Let the VS Code host know we are ready to receive the file data
    // @ts-ignore
    const vscode = acquireVsCodeApi();
    (window as any).vscode = vscode;
    vscode.postMessage({ type: 'ready' });

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  if (!geoData) {
    return <div style={{ color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif' }}>Loading 3D Geometry...</div>;
  }

  return <GeometryViewer data={geoData} rawText={rawText} />;
};

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
}
