var execBtn = document.getElementById("execute");
var execBtn2 = document.getElementById("execute2");
var outputElm = document.getElementById('output');
var errorElm = document.getElementById('error');
var commandsElm = document.getElementById('commands');
var commandsElm2 = document.getElementById('commands2');
var dbFileElm = document.getElementById('dbfile');
var txtFileElm = document.getElementById('txtfile');
var savedbElm = document.getElementById('savedb');

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

// Run a command in the database
function execute(commands) {
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
	worker.postMessage({action:'exec', sql:commands});
	outputElm.textContent = "Fetching results...";
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
	" CREATE TABLE QQQ ([_id] INTEGER PRIMARY KEY AUTOINCREMENT,[FIRST] TEXT NOT NULL,[SECOND] TEXT); "+
	" INSERT INTO QQQ (FIRST, SECOND) VALUES ('123', 'hello'); "+
	" INSERT INTO QQQ (FIRST, SECOND) VALUES ('321', 'bb'); "+
	" SELECT * FROM QQQ; ";
/*	sqlstr += " DROP TABLE IF EXISTS QQQ;";
	sqlstr += " DROP TABLE IF EXISTS employees;";
	sqlstr += " CREATE TABLE android_metadata ([locale] TEXT DEFAULT 'en_US');";
	sqlstr += " CREATE TABLE QQQ ([_id] INTEGER PRIMARY KEY AUTOINCREMENT,[FIRST] TEXT NOT NULL,[SECOND] TEXT);";
	sqlstr += " INSERT INTO QQQ (FIRST, SECOND) VALUES ('123', 'hello');";
	sqlstr += " INSERT INTO QQQ (FIRST, SECOND) VALUES ('321', 'bb');";
	sqlstr += " SELECT * FROM QQQ;";*/
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

// Execute the commands when the button is clicked
function execEditorContents () {
	noerror()
	execute (editor.getValue() + ';');
}
execBtn.addEventListener("click", execEditorContents, true);

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

// Add syntax highlihjting to the textarea
var editor = CodeMirror.fromTextArea(commandsElm, {
    mode: 'text/x-mysql',
    viewportMargin: Infinity,
    indentWithTabs: true,
    smartIndent: true,
    lineNumbers: true,
    matchBrackets : true,
    autofocus: true,
		extraKeys: {
			"Ctrl-Enter": execEditorContents,
			"Ctrl-S": savedb,
		}
});

// Load a db from a file
dbFileElm.onchange = function() {
	var f = dbFileElm.files[0];
	var r = new FileReader();
	r.onload = function() {
		worker.onmessage = function () {
			toc("Loading database from file");
			// Show the schema of the loaded database
			editor.setValue("SELECT `name`, `sql`\n  FROM `sqlite_master`\n  WHERE type='table';");
			execEditorContents();
		};
		tic();
		try {
			worker.postMessage({action:'open',buffer:r.result}, [r.result]);
		}
		catch(exception) {
			worker.postMessage({action:'open',buffer:r.result});
		}
	}
	r.readAsArrayBuffer(f);
}

// Load a txt-lib from a file
txtFileElm.onchange = function() {
	var f = txtFileElm.files[0];
	var r = new FileReader();	
	var text;
	r.onload = function() {
		text = r.result;
		commandsElm2.innerHTML = text;
		console.log(r.result.substring(0, 200));
		
		//r.readAsText(f);
		//tic();
	}
	tic();
	r.readAsText(f);
	setArray(text);
}
function setArray (text) { 
    var array = text.split('\n');
    outputElm.innerHTML = '<ul>';
    for (var i = 0; i < array.length; i++) {
		if (array[i].contains("—") &&
                !(array[i].indexOf("—")==0) &&
                !(array[i].substring(array[i].indexOf("—") + 1).contains("—")) &&
                !(array[i].endsWith("—")))
            {
				//значит строка годная, работаю с ней!!!
				outputElm.innerHTML += '<li>' + array[i] + '</li>';
			}
    }
   	outputElm.innerHTML += '</ul>';
}

/*      var openFile = function(event) {
        var input = event.target;

        var reader = new FileReader();
        reader.onload = function(){
          var text = reader.result;
          var node = document.getElementById('output');
          node.innerText = text;
          console.log(reader.result.substring(0, 200));
        };
        reader.readAsText(input.files[0]);
      };
	  */

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
