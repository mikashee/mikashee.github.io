

//text from file:
var text;
var wordsList = [];

// Start the worker in which sql.js will run
var worker = new Worker("../js/worker.sql.js");
worker.onerror = error;

// Open a database
worker.postMessage({action:'open'});

// Connect to the HTML element we 'print' to
function print(text) {
    outputElm.innerHTML = text.replace(/\n/g, '<br>');
}
function error(e) {
  console.log(e);
	errorElm.style.height = '2em';
	errorElm.textContent = e.message;
}

function noerror() {
		errorElm.style.height = '0';
}

//
// !!!!NEWRun a command in the database
//
function execute2() {
	//var comands2 = "";
	sqlstr = "DROP TABLE IF EXISTS android_metadata; "+
	" DROP TABLE IF EXISTS QQQ; "+
	" DROP TABLE IF EXISTS employees;"+
	" CREATE TABLE android_metadata ([locale] TEXT DEFAULT 'en_US'); "+
	" CREATE TABLE QQQ ([_id] INTEGER PRIMARY KEY AUTOINCREMENT,[FIRST] TEXT NOT NULL,[SECOND] TEXT); ";
	
	for (var i = 0; i < wordsList.length; i++) {
		var tire = wordsList[i].indexOf("—");
		var FIRST = wordsList[i].substring(0, tire + 1);
		var SECOND = wordsList[i].substring(tire + 1);
		sqlstr += " INSERT INTO QQQ (FIRST,SECOND)"+
		" VALUES ('" + FIRST + "','" + SECOND + "');";
    }
	sqlstr += " SELECT * FROM QQQ; ";
	
	tic();
	worker.onmessage = function(event) {
		var results = event.data.results;
		toc("Executing SQL");

		tic();
		outputElm.innerHTML = "";
		for (var i=0; i<results.length; i++) {
			outputElm.appendChild(tableCreate(results[i].columns, results[i].values));
		}
		toc("Displaying results");
	}
	worker.postMessage({action:'exec', sql:sqlstr});
	outputElm.textContent = "Fetching results...";
}
//
// !!!!NEW END
//

// Create an HTML table
var tableCreate = function () {
  function valconcat(vals, tagName) {
    if (vals.length === 0) return '';
    var open = '<'+tagName+'>', close='</'+tagName+'>';
    return open + vals.join(close + open) + close;
  }
  return function (columns, values){
    var tbl  = document.createElement('table');
    var html = '<thead>' + valconcat(columns, 'th') + '</thead>';
    var rows = values.map(function(v){ return valconcat(v, 'td'); });
    html += '<tbody>' + valconcat(rows, 'tr') + '</tbody>';
	  tbl.innerHTML = html;
    return tbl;
  }
}();


function execEditorContents2 () {
	noerror()
	execute2();
}
execBtn2.addEventListener("click", execEditorContents2, true);
// Performance measurement functions
var tictime;
if (!window.performance || !performance.now) {window.performance = {now:Date.now}}
function tic () {tictime = performance.now()}
function toc(msg) {
	var dt = performance.now()-tictime;
	console.log((msg||'toc') + ": " + dt + "ms");
}

// Load a txt-lib from a file
txtFileElm.onchange = function() {
	var f = txtFileElm.files[0];
	var r = new FileReader();	
	r.onload = function() {
		text = r.result;
		//commandsElm2.innerHTML = text;
		//console.log(r.result.substring(0, 200));
		setArray(text);
		//r.readAsText(f);
		//tic();
	}
	tic();
	r.readAsText(f);
	
}

function setArray (text) { 
    var array = text.split('\n');
    outputElm.innerHTML = '<ul>';
    for (var i = 0; i < array.length; i++) {
		if (array[i].includes("—") &&
                !(array[i].indexOf("—")==0) &&
                !(array[i].substring(array[i].indexOf("—") + 1).includes("—")) &&
                !(array[i].endsWith("—")))
            {
				//значит строка годная, работаю с ней!!!
				outputElm.innerHTML += '<li>' + array[i] + '</li>';
				wordsList.push(array[i]);
			}
    }
   	outputElm.innerHTML += '</ul>';
}

// Save the db to a file
function savedb () {
	worker.onmessage = function(event) {
		toc("Exporting the database");
		var arraybuff = event.data.buffer;
		var blob = new Blob([arraybuff]);
		var a = document.createElement("a");
		a.href = window.URL.createObjectURL(blob);
		a.download = "sql.db";
		a.onclick = function() {
			setTimeout(function() {
				window.URL.revokeObjectURL(a.href);
			}, 1500);
		};
		a.click();
	};
	tic();
	worker.postMessage({action:'export'});
}
savedbElm.addEventListener("click", savedb, true);
