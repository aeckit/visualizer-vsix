import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('aeckit Visualizer extension is now active!');

    // Register the custom editor provider for '.viz.json' files
    context.subscriptions.push(VizJsonEditorProvider.register(context));
}

export function deactivate() { }

class VizJsonEditorProvider implements vscode.CustomTextEditorProvider {
    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        const provider = new VizJsonEditorProvider(context);
        const providerRegistration = vscode.window.registerCustomEditorProvider(
            VizJsonEditorProvider.viewType,
            provider,
            {
                webviewOptions: { retainContextWhenHidden: true }
            }
        );
        return providerRegistration;
    }

    private static readonly viewType = 'visualizer.vizJsonViewer';

    constructor(private readonly context: vscode.ExtensionContext) { }

    public async resolveCustomTextEditor(
        document: vscode.TextDocument,
        webviewPanel: vscode.WebviewPanel,
        _token: vscode.CancellationToken
    ): Promise<void> {
        webviewPanel.webview.options = {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'out')]
        };

        // Listen to changes in the file
        const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
            if (e.document.uri.toString() === document.uri.toString()) {
                webviewPanel.webview.postMessage({
                    type: 'update',
                    text: document.getText(),
                });
            }
        });

        webviewPanel.onDidDispose(() => {
            changeDocumentSubscription.dispose();
        });

        // Initialize the HTML view
        this.updateWebview(webviewPanel.webview);

        // Listen for messages from the React app
        webviewPanel.webview.onDidReceiveMessage(e => {
            if (e.type === 'ready') {
                // Now that React is loaded, send the initial file content
                webviewPanel.webview.postMessage({
                    type: 'update',
                    text: document.getText(),
                });
            } else if (e.type === 'openJson') {
                vscode.window.showTextDocument(document, vscode.ViewColumn.Beside);
            }
        });
    }

    private updateWebview(webview: vscode.Webview) {
        // Get the URI of the compiled React bundle
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'out', 'webview.js'));

        // Use a strict content security policy for safety
        const nonce = getNonce();

        webview.html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>aeckit Geometry Viewer</title>
                <style>
                    body { margin: 0; padding: 0; box-sizing: border-box; overflow: hidden; background-color: var(--vscode-editor-background); }
                    #root { width: 100vw; height: 100vh; }
                </style>
            </head>
            <body>
                <div id="root"></div>
                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>
        `;
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
