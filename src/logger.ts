import { LogViewerPanel } from './LogViewerPanel';

let logWatcher: NodeJS.Timeout | undefined;

export function startLogViewer(provider: LogViewerPanel) {
    console.log('Starting log viewer');
    if (logWatcher) {
        clearInterval(logWatcher);
    }

    let i = 1;
    const startLogging = () => {
        logWatcher = setInterval(() => {
            const now = new Date().toLocaleString();
            const logLine = `${now} - 测试日志 ${i}`;
            console.log('Generating log:', logLine);
            provider.addLog(logLine);
            i++;
        }, 1000);
    };

    // 等待 WebView 准备就绪
    const readyCheck = setInterval(() => {
        if (provider['_ready']) {
            clearInterval(readyCheck);
            startLogging();
        }
    }, 100);
}

export function stopLogViewer() {
    if (logWatcher) {
        clearInterval(logWatcher);
    }
}
