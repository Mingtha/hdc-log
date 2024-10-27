// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { LogViewerPanel } from './LogViewerPanel';
import { startLogViewer } from './logger';

export function activate(context: vscode.ExtensionContext) {
	console.log('日志查看器插件已激活');

	// 创建 LogViewerPanel 实例
	const provider = new LogViewerPanel(context.extensionUri, context);

	// 注册 WebView 提供者
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider('logViewer', provider)
	);

	// 注册启动命令
	let startDisposable = vscode.commands.registerCommand('logviewer.start', () => {
		// 显示日志查看器面板
		vscode.commands.executeCommand('workbench.view.extension.logViewerContainer');
		// 开始生成日志
		startLogViewer(provider);
	});

	context.subscriptions.push(startDisposable);

	// 自动启动日志查看器
	console.log('Auto-starting log viewer');
	startLogViewer(provider);
}

export function deactivate() {
	// 清理工作可以在这里进行
}
