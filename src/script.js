let seatdata = [];
let studentdata = [];

window.onload = () => {
	[...document.getElementsByTagName("button")].forEach((n) => {
		n.onmouseover = (e) => {
			if (!e.disabled) e.target.classList.add("focused");
		};
		n.onmouseleave = (e) => {
			e.target.classList.remove("focused");
		};
	});
	seatdata = electronAPI.loaddata("seat") || [
		[0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0],
	];
	studentdata = electronAPI.loaddata("student") || [];
	modeChange("menu");
};

function modeChange(mode) {
	[...document.getElementsByClassName("section")].forEach(
		(n) => (n.style.display = "none")
	);
	document.getElementById(mode).style.display = "";
	switch (mode) {
		case "menu":
			modeMenu();
			break;
		case "wizard_dummy":
			modeWizard();
			break;
		case "print":
			output();
			break;
		case "setting":
			modeSetting();
			break;
		case "listsetting":
			modeListSetting();
			break;
		case "useradd":
			modeUserAdd();
			break;
		case "seatsetting":
			modeSeatSetting();
			break;
	}
}

const states = ["", "frontseat", "normalseat"];

function modeMenu() {
	const e = [];
	if (!seatdata.find((n) => n.find((m) => m))) e.push("席配置が未登録です。");
	if (!studentdata.length) e.push("生徒名簿が未登録です。");
	if (
		seatdata.find((n) => n.find((m) => m)) &&
		studentdata.length &&
		studentdata.length !== seatdata.flat().filter((n) => n).length
	)
		e.push("生徒数と席数が一致しません。");
	if (
		seatdata.find((n) => n.find((m) => m)) &&
		studentdata.length &&
		studentdata.filter((n) => n.front).length >
			seatdata.flat().filter((n) => n == 1).length
	)
		e.push("前席数が足りていません。");
	document.getElementById("wizardbtn").disabled = !!e.length;
	document.getElementById("errormessage").innerHTML = e.join("<br />");
	document.getElementById("errormessage").style.display = e.length
		? ""
		: "none";
}

function modeWizard() {
	if (!confirm("席替えの席を決定しますか。")) return modeChange("menu");

	const seatwidth =
		Math.max(...seatdata.map((n) => n.findLastIndex((m) => m))) + 1;
	const seatheight = seatdata.findLastIndex((n) => n.find((m) => m)) + 1;
	const list = [];
	for (let i = 0; i < seatheight; i++) {
		for (let j = 0; j < seatwidth; j++) {
			if (seatdata[i][j])
				list.push({
					x: j,
					y: i,
					front: seatdata[i][j] == 1,
					student: null,
				});
		}
	}
	//前席
	studentdata
		.filter((n) => n.front)
		.map(
			(m) =>
				(list
					.filter((p) => p.front && p.student == null)
					.random().student = m.number)
		);

	//それ以外
	studentdata
		.filter((n) => !n.front)
		.map(
			(m) =>
				(list.filter((p) => p.student == null).random().student =
					m.number)
		);

	let dom = '<table id="resulttable">';
	//教卓
	dom += `<tr><td colspan="${
		(seatwidth - (seatwidth % 2 ? 1 : 2)) / 2
	}"></td><td class="teacher"${
		seatwidth % 2 ? "" : 'colspan="2"'
	}>教卓</td><td colspan="${
		(seatwidth - (seatwidth % 2 ? 1 : 2)) / 2
	}"></td></tr><tr><td class="space" colspan="${seatwidth}"></tr>`;

	//各席配置
	for (let i = 0; i < seatheight; i++) {
		dom += "<tr>";
		for (let j = 0; j < seatwidth; j++) {
			const seat = list.find((n) => n.x == j && n.y == i);
			if (seat) {
				dom += '<td class="used">';
				const student = studentdata.find(
					(n) => n.number == seat.student
				);
				if (student)
					dom += `${student.number}. ${student.name[0]} ${student.name[1]}`;
			} else {
				dom += "<td>";
			}
			dom += "</td>";
		}
		dom += "</tr>";
	}
	dom += "</table>";

	document.getElementById("result").innerHTML = dom;

	modeChange("print");
}

function modeSetting() {
	const a = document.getElementById("jsonexport");
	delete a.download;
	a.href = "javascript:void(0)";
	a.classList.add("disabled");
	if (!studentdata.length) {
		document.getElementById("userdatastate").innerHTML =
			"<p>登録なし、下のボタンから設定してください。</p>";
		const a = document.getElementById("csvexport");
		delete a.download;
		a.href = "javascript:void(0)";
		a.classList.add("disabled");
	} else {
		document.getElementById(
			"userdatastate"
		).innerHTML = `<p>${studentdata.length}名のデータが登録されています。</p><p>下のボタンで詳細の確認・編集・削除が行えます。</p>`;
		const header =
			"出席番号,姓,名,姓(フリガナ),名(フリガナ),生徒会活動,学習係,部活動";
		const d = studentdata.map(
			(n) =>
				`${n.number},${n.name.join(",")},${n.kana.join(
					","
				)},${n.activity.join(",")}`
		);
		const data = [header, ...d].join("\n");
		const a = document.getElementById("csvexport");
		a.href = URL.createObjectURL(
			new Blob(
				[
					//このUint8Arrayのやつはexcelの文字化け防止用らしい、あってもなくてもいい
					new Uint8Array([0xef, 0xbb, 0xbf]),
					data,
				],
				{
					type: "text/csv",
				}
			)
		);
		a.download = "data.csv";
		a.classList.remove("disabled");
		if (seatdata.find((n) => n.find((m) => m))) {
			const a = document.getElementById("jsonexport");
			a.href = URL.createObjectURL(
				new Blob([JSON.stringify([studentdata, seatdata])]),
				{ type: "application/json" }
			);
			a.download = "data.json";
			a.classList.remove("disabled");
		}
	}
	if (!seatdata.find((n) => n.find((m) => m))) {
		document.getElementById("seatstate").innerHTML =
			"<p>設定されていません、下のボタンから設定してください。</p>";
	} else {
		const seatwidth =
			Math.max(...seatdata.map((n) => n.findLastIndex((m) => m))) + 1;
		const seatheight = seatdata.findLastIndex((n) => n.find((m) => m)) + 1;
		let dom = "";
		for (let i = 0; i < seatheight; i++) {
			dom += "<tr>";
			for (let j = 0; j < seatwidth; j++) {
				dom += `<td class="${states[seatdata[i][j]]}">&emsp;</td>`;
			}
			dom += "</tr>";
		}

		document.getElementById(
			"seatstate"
		).innerHTML = `<p><span class="frontseat"></span>：前席扱い&emsp;<span class="normalseat"></span>：通常席扱い&emsp;</p><table><tr><th colspan="${seatwidth}">教卓</th></tr>${dom}</table>`;
	}
}

function importCSV(file) {
	const reader = new FileReader();
	reader.readAsText(file);
	reader.addEventListener("load", () => {
		const { result } = reader;
		const array = result.split(/\r?\n/).map((n) => n.split(","));
		array.shift();
		studentdata = [];
		const data = array.map((n) => ({
			number: n[0],
			name: [n[1], n[2]],
			kana: [n[3], n[4]],
			activity: [n[5], n[6], n[7]],
		}));
		data.sort((a, b) => a.number - b.number);
		if (
			!confirm(`${data.length}名のデータで上書きします。よろしいですか。`)
		)
			return;
		studentdata = data;
		electronAPI.savedata("student", studentdata);
		modeChange("setting");
	});
}

function importJSON(file) {
	const reader = new FileReader();
	reader.readAsText(file);
	reader.addEventListener("load", () => {
		const { result } = reader;
		if (!confirm(`データを上書きします。よろしいですか。`)) return;
		const data = JSON.parse(result);
		studentdata = data[0];
		electronAPI.savedata("student", studentdata);
		seatdata = data[1];
		electronAPI.savedata("seat", seatdata);
		modeChange("setting");
	});
}

function modeListSetting() {
	document.getElementById("listsettingtable").innerHTML =
		'<tr><th class="number">番号</th><th class="name">姓名</th><th class="name">姓名(フリガナ)</th><th>生徒会活動</th><th>学習係</th><th>部活動</th><th class="isfront">前席希望</th><th class="buttons">削除ボタン</th></tr>' +
		studentdata
			.map(
				(n) =>
					`<tr><th class="number">${n.number}</th><td class="name">${
						n.name[0]
					} ${n.name[1]}</td><td class="name">${n.kana[0]} ${
						n.kana[1]
					}</td><td>${n.activity[0]}</td><td>${
						n.activity[1]
					}</td><td>${n.activity[2]}</td><td class="isfront">${
						n.front ? "前席希望" : "\uff0d\uff0d\uff0d"
					}</th><td class="buttons"><a href="javascript:void(0);" onclick="listEdit(this)">✏️</a>&emsp;<a href="javascript:void(0);" onclick="listDelete(this)">🗑</a></td></tr>`
			)
			.join("");
}

async function output() {
	document.getElementById("print").innerHTML =
		document.getElementById("result").innerHTML;
	document.body.style.width = "297mm";
	document.body.style.height = "210mm";
	const buffer = await electronAPI.output();
	document.body.style.width = "";
	document.body.style.height = "";
	const datablob = new Blob([buffer], { type: "application/ocset-stream" });
	const a = document.getElementById("outputbtn");
	a.href = URL.createObjectURL(datablob);
	a.download = `${new Date().toLocaleDateString(
		"ja"
	)} ${new Date().toLocaleTimeString("ja")}-席替え.pdf`;
	modeChange("wizard");
}

function listEdit(dom) {
	const pn = dom.parentNode.parentNode;
	const number = parseInt(pn.getElementsByClassName("number")[0].innerHTML);
	const student = studentdata.find((n) => n.number == number);
	modeChange("useradd");
	document
		.getElementById("useraddtable")
		.getElementsByClassName("number")[0].value = student.number;
	document
		.getElementById("useraddtable")
		.getElementsByClassName("firstname")[0].value = student.name[0];
	document
		.getElementById("useraddtable")
		.getElementsByClassName("lastname")[0].value = student.name[1];
	document
		.getElementById("useraddtable")
		.getElementsByClassName("firstname")[1].value = student.kana[0];
	document
		.getElementById("useraddtable")
		.getElementsByClassName("lastname")[1].value = student.kana[1];
	document
		.getElementById("useraddtable")
		.getElementsByClassName("activity1")[0].value = student.activity[0];
	document
		.getElementById("useraddtable")
		.getElementsByClassName("activity2")[0].value = student.activity[1];
	document
		.getElementById("useraddtable")
		.getElementsByClassName("activity3")[0].value = student.activity[2];
	document
		.getElementById("useraddtable")
		.getElementsByClassName("isfront")[0].checked = student.front;
	document.getElementById("useradd").getElementsByClassName("edit")[0].value =
		number;
}

function listDelete(dom) {
	const pn = dom.parentNode.parentNode;
	const number = parseInt(pn.getElementsByClassName("number")[0].innerHTML);
	const name = pn.getElementsByClassName("name")[0].innerHTML;
	if (!confirm(`${number} ${name}のデータを削除しますか。`)) return;
	studentdata.splice(
		studentdata.findIndex((n) => n.number == number),
		1
	);
	electronAPI.savedata("student", studentdata);
	modeListSetting();
}

function modeUserAdd() {
	document
		.getElementById("useraddtable")
		.getElementsByClassName("number")[0].value = "";
	document
		.getElementById("useraddtable")
		.getElementsByClassName("firstname")[0].value = "";
	document
		.getElementById("useraddtable")
		.getElementsByClassName("lastname")[0].value = "";
	document
		.getElementById("useraddtable")
		.getElementsByClassName("firstname")[1].value = "";
	document
		.getElementById("useraddtable")
		.getElementsByClassName("lastname")[1].value = "";
	document
		.getElementById("useraddtable")
		.getElementsByClassName("activity1")[0].value = "";
	document
		.getElementById("useraddtable")
		.getElementsByClassName("activity2")[0].value = "";
	document
		.getElementById("useraddtable")
		.getElementsByClassName("activity3")[0].value = "";
	document
		.getElementById("useraddtable")
		.getElementsByClassName("isfront")[0].checked = false;
	document.getElementById("useradd").getElementsByClassName("edit")[0].value =
		"";
}

function userAdd() {
	const edit = document
		.getElementById("useradd")
		.getElementsByClassName("edit")[0].value;
	const number = parseInt(
		document
			.getElementById("useraddtable")
			.getElementsByClassName("number")[0].value
	);
	if (edit)
		studentdata.splice(
			studentdata.findIndex((n) => n.number == edit),
			1
		);
	if (studentdata.find((n) => n.number == number))
		studentdata.splice(
			studentdata.findIndex((n) => n.number == number),
			1
		);
	studentdata.push({
		number,
		name: [
			document
				.getElementById("useraddtable")
				.getElementsByClassName("firstname")[0].value,
			document
				.getElementById("useraddtable")
				.getElementsByClassName("lastname")[0].value,
		],
		kana: [
			document
				.getElementById("useraddtable")
				.getElementsByClassName("firstname")[1].value,
			document
				.getElementById("useraddtable")
				.getElementsByClassName("lastname")[1].value,
		],
		activity: [
			document
				.getElementById("useraddtable")
				.getElementsByClassName("activity1")[0].value,
			document
				.getElementById("useraddtable")
				.getElementsByClassName("activity2")[0].value,
			document
				.getElementById("useraddtable")
				.getElementsByClassName("activity3")[0].value,
		],
		front: document
			.getElementById("useraddtable")
			.getElementsByClassName("isfront")[0].checked,
	});
	studentdata.sort((a, b) => a.number - b.number);
	electronAPI.savedata("student", studentdata);
	modeChange("listsetting");
}

function modeSeatSetting() {
	document.getElementById("seatsettingtable").innerHTML =
		'<tr><th colspan="8">教卓</th></tr>' +
		seatdata
			.map(
				(n, m) =>
					"<tr>" +
					n
						.map(
							(p, q) =>
								`<td class="${
									states[p]
								}"><select onchange="seatChange(${q}, ${m}, this.value)"><option value=""${
									p == 0 ? " selected" : ""
								}>席なし</option><option value="frontseat"${
									p == 1 ? " selected" : ""
								}>席(先頭扱い)</option><option value="normalseat"${
									p == 2 ? " selected" : ""
								}>席(通常の席)</option></select></td>`
						)
						.join("") +
					"</tr>"
			)
			.join("");
}

function allReset() {
	if (!confirm("全ての設定を初期化します。よろしいですか。")) return;
	electronAPI.deletedata("seat");
	electronAPI.deletedata("student");
	location.reload();
}

function seatChange(x, y, state) {
	document
		.getElementById("seatsettingtable")
		.getElementsByTagName("tr")
		[y + 1].getElementsByTagName("td")[x].className = state;
	seatdata[y][x] = states.indexOf(state);
	electronAPI.savedata("seat", seatdata);
}

//禁忌。本当は使ってはいけない(迫真)
Array.prototype.random = function () {
	return this[Math.floor(Math.random() * this.length)];
};
