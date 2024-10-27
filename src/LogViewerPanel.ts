import * as vscode from 'vscode';
import { getWebviewContent } from './webviewContent';

export class LogViewerPanel implements vscode.WebviewViewProvider {
    public static currentPanel: LogViewerPanel | undefined;

    private _view?: vscode.WebviewView;
    private _context: vscode.ExtensionContext;
    private _ready: boolean = false;

    constructor(private readonly _extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
        this._context = context;
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        // 设置 WebView 选项
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        // 设置 WebView 内容
        webviewView.webview.html = getWebviewContent(webviewView.webview);

        // 处理来自 WebView 的消息
        webviewView.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'updateState':
                        this._saveState(message.state);
                        return;
                    case 'getState':
                        this._restoreState();
                        return;
                    case 'ready':
                        this.setReady();
                        return;
                }
            }
        );

        LogViewerPanel.currentPanel = this;
    }

    // 添加日志到 WebView
    public addLog(text: string) {
        if (this._ready && this._view) {
            this._view.webview.postMessage({ command: 'addLog', text: text });
        } else {
            console.log('WebView not ready or initialized yet. Log:', text);
        }
    }

    // 设置 WebView 为就绪状态
    public setReady() {
        this._ready = true;
        console.log('WebView is ready');
    }

    // 保存状态
    private _saveState(state: any) {
        this._context.globalState.update('logViewerState', state);
    }

    // 恢复状态
    private _restoreState() {
        const state = this._context.globalState.get('logViewerState', {
            searchText: '',
            caseSensitive: false,
            wholeWord: false,
            useRegex: false
        });
        if (this._view) {
            this._view.webview.postMessage({ command: 'restoreState', state: state });
        }
    }
}
