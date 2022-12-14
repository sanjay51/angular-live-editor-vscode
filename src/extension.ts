// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

const config = { isEnabled: false };
export async function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "angular-live-editor" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let panel: vscode.WebviewPanel | undefined = undefined;

	let createPanel = () => {
		if (panel) {
			panel.dispose();
		}

		panel = vscode.window.createWebviewPanel(
			'angularLiveEditor',
			'Angular Live Editor',
			{
				preserveFocus: true,
				viewColumn: vscode.ViewColumn.Beside
			},
			{
				enableScripts: true,
			}
		);

		return panel;
	};

	let showPanel = () => {
		config.isEnabled = true;
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		panel = createPanel();

		addPanelContent(panel);

		vscode.workspace.onDidChangeTextDocument((event) => {
			if (panel && panel.visible && config.isEnabled)
				addPanelContent(panel);
		});

		vscode.workspace.onDidOpenTextDocument((event) => {
			let htmlFileOpen = isHTMLTemplateFileOpen();

			if (!htmlFileOpen || !config.isEnabled) {
				console.log("HTML file not open");
				if (panel)
					panel.dispose();
				panel = undefined;

				return;
			}

			if (!panel) {
				panel = createPanel();
			}

			addPanelContent(panel);
		});
	};

	let command = 'angular-live-editor.toggleTemplateEditor';
	let disposable1 = vscode.commands.registerCommand(command, () => {
		config.isEnabled = !config.isEnabled;
		if (!config.isEnabled) {
			if (panel)
				panel.dispose();
			panel = undefined;
		} else if (config.isEnabled) {
			showPanel();
		}
	});

	context.subscriptions.push(disposable1);

	// create a new status bar item that we can now manage
	let myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	myStatusBarItem.command = command;
	context.subscriptions.push(myStatusBarItem);
	myStatusBarItem.text = `Live Editor`;
	myStatusBarItem.show();
}

async function addPanelContent(panel: vscode.WebviewPanel) {
	if (!panel) return;

	let raw = getText();
	let config = await getConfig();
	let compiled = getCompiledTemplate(raw, config);

	panel.webview.html = getWebViewContent(compiled);
}

function getText() {
	const editor = vscode.window.activeTextEditor;

	if (editor) {
		let document = editor.document;

		// Get the document text
		const documentText = document.getText();
		return documentText;
	}

	return 'No content';
}

async function getConfig() {
	const editor = vscode.window.activeTextEditor;
	if (editor) {
		let path = editor.document.uri.fsPath;
		let configPath = path.split('.').slice(0, -1).join('.') + ".config.json";
		console.log(configPath);
		let configFile: any = null;
		try {
			configFile = await vscode.workspace.openTextDocument(configPath);
		} catch (e) {
			console.log(e);
		}

		if (!configFile) {
			return {};
		}

		return JSON.parse(configFile.getText());
	}
	return {};
}

function isHTMLTemplateFileOpen() {
	const editor = vscode.window.activeTextEditor;
	if (editor) {
		let path = editor.document.uri.fsPath;
		return path.endsWith('.html');
	}

	return false;
}

function getCompiledTemplate(raw: string, config: any) {
	for (let key of Object.keys(config)) {
		raw = raw.replace(key, config[key]);
	}

	return raw;
}

function getWebViewContent(text: string) {
	return `
	<!DOCTYPE html>
	<html id="myhtml" lang="en" style="color: red">
	<head>
	<script src="https://cdn.tailwindcss.com"></script>
	<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.2/dist/css/bootstrap.min.css">
	</head>
	<body style="background-color: white">
		${text}
	</body>
	<script type="text/javascript">
		document.body.removeAttribute('class');
		document.getElementById("myhtml").class = "";
		document.getElementById("myhtml").style = "";
		console.log(document.getElementById("myhtml"))
	</script>
	</html>
`
}

// This method is called when your extension is deactivated
export function deactivate() { }
