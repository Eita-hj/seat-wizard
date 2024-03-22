const { app, BrowserWindow, ipcMain, Menu, dialog } = require("electron");
const path = require("path");
const Store = require("electron-store");

const store = new Store();

app.setAboutPanelOptions({
	applicationName: "席替え用ソフト SeatWizard",
	applicationVersion: require("../package.json").version,
	copyright: "©︎えいた",
	authors: "えいた",
	website: "https://sw.pjeita.top/",
});

ipcMain.on("savedata", (e, obj) => {
	e.returnValue = store.set(obj.key, obj.value);
	return;
});
ipcMain.on("deletedata", (e, obj) => {
	e.returnValue = store.delete(obj.key);
	return;
});
ipcMain.on("loaddata", (e, obj) => {
	e.returnValue = store.get(obj.key);
	return;
});

app.once("ready", () => {
	const mainWindow = new BrowserWindow({
		width: 960,
		heght: 720,
		show: false,
		webPreferences: {
			devTools: false,
			preload: path.join(__dirname, "preload.js"),
			nodeIntegration: false,
		},
	});
	mainWindow.loadFile(path.join(__dirname, "index.html"));
	mainWindow.once("ready-to-show", () => {
		fetch("https://api.pjeita.top/update", {
			method: "post",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				version: require("../package.json").version,
				platform: process.platform,
				application: "SeatWizard",
			}),
		})
			.then((n) => n.json())
			.then((n) => {
				versionChecked = true;
				if (n.url) {
					dialog
						.showMessageBox({
							buttons: ["ダウンロード"],
							message: `新しいバージョン(ver.${n.version}) が公開されています。\n更新をしてください。\n(ダウンロードは少し時間がかかります)`,
						})
						.then((m) => {
							nowWindow.webContents.session.on(
								"will-download",
								(e, i, c) => {
									i.setSavePath(
										{
											win32: `${process.env.TEMP}/seatwizard/update_ver.${n.version}.exe`,
											darwin: `/tmp/seatwizard/update_ver.${n.version}.dmg`,
											linux: `/tmp/seatwizard/update_ver.${n.version}.AppImage`,
										}[process.platform]
									);
									i.on("done", async () => {
										require("child_process").execSync(
											{
												win32: `${process.env.TEMP}/seatwizard/update_ver.${n.version}.exe`,
												darwin: `open /tmp/seatwizard/update_ver.${n.version}.dmg`,
												linux: "",
											}[process.platform]
										);
										if (process.platform == "linux")
											await dialog
												.showMessageBox(nowWindow, {
													buttons: ["OK"],
													message:
														"ダウンロードをしました。新しいバージョンのファイルを開いて起動してください。",
												})
												.then(() => {
													const {
														shell,
													} = require("electron");
													shell.showItemInFolder(
														`/tmp/seatwizard/update_ver.${n.version}.AppImage`
													);
												});
										nowWindow.close();
									});
								}
							);
							nowWindow.webContents.session.downloadURL(n.url);
						});
				} else {
					mainWindow.show();

					ipcMain.handle("output", async (e) => {
						const buffer = await mainWindow.webContents.printToPDF({
							landscape: true,
							pageSize: "A4",
							margins: {
								top: 0,
								bottom: 0,
								left: 0,
								right: 0,
							},
							pageRanges: "1",
						});
						return buffer;
					});
				}
			})
			.catch(() => {
				versionChecked = true;
				dialog
					.showErrorBox(
						"更新確認エラー",
						"更新確認サーバーとの接続に失敗しました。"
					)
				mainWindow.show();
			});
	});
	mainWindow.on("close", () => {
		if (process.platform === "darwin") return;
		app.exit();
	});

	mainWindow.webContents.once("did-create-window", (w, e) => {
		w.setMenuBarVisibility(false);
	});
});

const templateMenu = [
	...(process.platform == "darwin"
		? [
				{
					label: "AquaRise",
					submenu: [{ label: "このアプリについて", role: "about" }],
				},
		  ]
		: []),
	{
		label: "編集",
		submenu: [
			{ label: "元に戻す", role: "undo" },
			{ label: "やり直し", role: "redo" },
			{ type: "separator" },
			{ label: "切り取り", role: "cut" },
			{ label: "コピー", role: "copy" },
			{ label: "ペースト", role: "paste" },
		],
	},
	{
		label: "選択",
		submenu: [{ label: "すべて選択", role: "selectAll" }],
	},
	{
		label: "表示",
		submenu: [
			{ label: "再読み込み", role: "reload" },
			{ type: "separator" },
			{ role: "togglefullscreen", label: "全画面表示" },
			{ type: "separator" },
			{ role: "quit", label: "終了" },
		],
	},
];

const menu = Menu.buildFromTemplate(templateMenu);
Menu.setApplicationMenu(menu);
