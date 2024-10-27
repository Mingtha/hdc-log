import * as vscode from 'vscode';

export function getWebviewContent(webview: vscode.Webview): string {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>日志查看器</title>
            <style>
                body {
                    font-family: var(--vscode-editor-font-family);
                    font-size: var(--vscode-editor-font-size);
                    font-weight: var(--vscode-editor-font-weight);
                    color: var(--vscode-editor-foreground);
                    background-color: var(--vscode-editor-background);
                    margin: 0;
                    padding: 0;
                }
                #search-container {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    background-color: var(--vscode-editor-background);
                    border-bottom: 1px solid var(--vscode-panel-border);
                    padding: 5px;
                    display: flex;
                    align-items: center;
                    z-index: 1000;
                }
                #search-input {
                    flex-grow: 1;
                    background-color: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    border: 1px solid var(--vscode-input-border);
                    padding: 4px 8px;
                    font-family: var(--vscode-font-family);
                    font-size: var(--vscode-font-size);
                }
                #search-input:focus {
                    outline: 1px solid var(--vscode-focusBorder);
                }
                .search-option {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 24px;
                    height: 24px;
                    margin-left: 5px;
                    cursor: pointer;
                    border-radius: 3px;
                    font-size: 12px;
                    background-color: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                }
                .search-option:hover {
                    background-color: var(--vscode-button-secondaryHoverBackground);
                }
                .search-option.active {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                }
                #log-content {
                    margin-top: 40px;
                    padding: 10px;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                    overflow-y: auto;
                    height: calc(100vh - 50px);
                    font-family: var(--vscode-editor-font-family);
                    font-size: var(--vscode-editor-font-size);
                    font-weight: var(--vscode-editor-font-weight);
                    line-height: var(--vscode-editor-line-height, 1.5);
                }
            </style>
        </head>
        <body>
            <div id="search-container">
                <input type="text" id="search-input" placeholder="查找">
                <div id="case-sensitive" class="search-option" title="区分大小写">Aa</div>
                <div id="whole-word" class="search-option" title="全字匹配">\\b</div>
                <div id="use-regex" class="search-option" title="使用正则表达式">.*</div>
            </div>
            <pre id="log-content"></pre>
            <script>
                const vscode = acquireVsCodeApi();
                const searchInput = document.getElementById('search-input');
                const caseSensitive = document.getElementById('case-sensitive');
                const wholeWord = document.getElementById('whole-word');
                const useRegex = document.getElementById('use-regex');
                const logContent = document.getElementById('log-content');

                let allLogs = [];
                let filteredLogs = [];
                let isScrolledToBottom = true;
                let lastScrollHeight = 0;
                let filterTimer = null;

                function updateSearchOptionsFromExtension(options) {
                    caseSensitive.classList.toggle('active', options.caseSensitive);
                    wholeWord.classList.toggle('active', options.wholeWord);
                    useRegex.classList.toggle('active', options.useRegex);
                    searchInput.value = options.searchText || '';
                    filterLogs();
                }

                function saveState() {
                    vscode.postMessage({
                        command: 'updateState',
                        state: {
                            searchText: searchInput.value,
                            caseSensitive: caseSensitive.classList.contains('active'),
                            wholeWord: wholeWord.classList.contains('active'),
                            useRegex: useRegex.classList.contains('active')
                        }
                    });
                }

                function filterLogs() {
                    clearTimeout(filterTimer);
                    filterTimer = setTimeout(() => {
                        const filterText = searchInput.value;
                        const isCaseSensitive = caseSensitive.classList.contains('active');
                        const isWholeWord = wholeWord.classList.contains('active');
                        const isRegex = useRegex.classList.contains('active');

                        if (filterText) {
                            filteredLogs = allLogs.filter(log => {
                                let testText = log;
                                let testFilter = filterText;

                                if (!isCaseSensitive) {
                                    testText = testText.toLowerCase();
                                    testFilter = testFilter.toLowerCase();
                                }

                                if (isRegex) {
                                    try {
                                        const regex = new RegExp(testFilter, isCaseSensitive ? '' : 'i');
                                        return regex.test(testText);
                                    } catch (e) {
                                        return false;
                                    }
                                } else if (isWholeWord) {
                                    const words = testText.split(/\\s+/);
                                    return words.includes(testFilter);
                                } else {
                                    return testText.includes(testFilter);
                                }
                            });
                        } else {
                            filteredLogs = allLogs;
                        }

                        renderLogs();
                    }, 300);
                }

                function renderLogs() {
                    const fragment = document.createDocumentFragment();
                    filteredLogs.forEach(log => {
                        const div = document.createElement('div');
                        div.textContent = log;
                        fragment.appendChild(div);
                    });

                    logContent.innerHTML = '';
                    logContent.appendChild(fragment);

                    if (isScrolledToBottom) {
                        scrollToBottom();
                    }
                }

                function scrollToBottom() {
                    logContent.scrollTop = logContent.scrollHeight;
                    lastScrollHeight = logContent.scrollHeight;
                }

                function addLog(text) {
                    allLogs.push(text);
                    if (!searchInput.value) {
                        const div = document.createElement('div');
                        div.textContent = text;
                        logContent.appendChild(div);
                        if (isScrolledToBottom) {
                            scrollToBottom();
                        }
                    } else {
                        filterLogs();
                    }
                }

                searchInput.addEventListener('input', () => {
                    filterLogs();
                    saveState();
                });

                [caseSensitive, wholeWord, useRegex].forEach(element => {
                    element.addEventListener('click', () => {
                        element.classList.toggle('active');
                        filterLogs();
                        saveState();
                    });
                });

                logContent.addEventListener('scroll', () => {
                    isScrolledToBottom = (logContent.scrollHeight - logContent.clientHeight <= logContent.scrollTop + 1);
                });

                window.addEventListener('message', event => {
                    const message = event.data;
                    switch (message.command) {
                        case 'addLog':
                            addLog(message.text);
                            break;
                        case 'clearLog':
                            allLogs = [];
                            filteredLogs = [];
                            logContent.innerHTML = '';
                            break;
                        case 'restoreState':
                            updateSearchOptionsFromExtension(message.state);
                            break;
                    }
                });

                // 初始化时请求状态并通知扩展 WebView 已准备就绪
                vscode.postMessage({ command: 'getState' });
                vscode.postMessage({ command: 'ready' });
            </script>
        </body>
        </html>
    `;
}
