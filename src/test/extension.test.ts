import * as assert from 'assert';
import * as vscode from 'vscode';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
// import * as myExtension from '../../extension';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('开始测试。');

	test('扩展激活测试', async () => {
		const ext = vscode.extensions.getExtension('your-publisher.logviewer');
		assert.ok(ext);
		await ext?.activate();
		assert.strictEqual(ext?.isActive, true);
	});

	test('命令注册测试', () => {
		return vscode.commands.getCommands(true).then((commands) => {
			assert.ok(commands.includes('logviewer.start'));
		});
	});

	// 更多测试用例...
});
