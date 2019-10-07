var CHARACTER_SETS = [
	[true, "Numbers", "0123456789"],
	[true, "Lowercase", "abcdefghijklmnopqrstuvwxyz"],
	[false, "Uppercase", "ABCDEFGHIJKLMNOPQRSTUVWXYZ"],
	[false, "ASCII symbols", "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~"],
];



// variables
var passwordElem = document.getElementById("password");
var statisticsElem = document.getElementById("statistics");
var copyElem = document.getElementById("copy-button");
var cryptoObject = null;
var currentPassword = null;


function initCharsets() {
	function createElem(tagName, attribs) {
		var result = document.createElement(tagName);
		if (attribs !== undefined) {
			for (var key in attribs)
				result[key] = attribs[key];
		}
		return result;
	}
	
	var container = document.querySelector("#charset tbody");
	var endElem = document.querySelector("#charset tbody > tr:last-child");
	CHARACTER_SETS.forEach(function(entry, i) {
		var tr = createElem("tr");
		var td = tr.appendChild(createElem("td"));
		var input = td.appendChild(createElem("input", {
			type: "checkbox",
			checked: entry[0],
			id: "charset-" + i}));
		var td = tr.appendChild(createElem("td"));
		var label = td.appendChild(createElem("label", {
			htmlFor: "charset-" + i,
			textContent: " " + entry[1] + " "}));
		var small = label.appendChild(createElem("small", {
			textContent: "(" + entry[2] + ")"}));
		container.insertBefore(tr, endElem);
	});
}

function doGenerate(ev) {
	ev.preventDefault();
	
	// check character set
	var charset = getPasswordCharacterSet();
	if (charset.length == 0) {
		alert("Error: Character set is empty");
		return;
	} else if (document.getElementById("by-entropy").checked && charset.length == 1) {
		alert("Error: Need at least 2 distinct characters in set");
		return;
	}
	
	// calculate desired length
	var length;
	if (document.getElementById("by-length").checked)
		length = parseInt(document.getElementById("length").value, 10);
	else if (document.getElementById("by-entropy").checked)
		length = Math.ceil(parseFloat(document.getElementById("entropy").value) * Math.log(2) / Math.log(charset.length));
	else
		throw "Assertion error";
	
	// check length
	if (length < 0) {
		alert("Negative password length");
		return;
	} else if (length > 10000) {
		alert("Password length too large");
		return;
	}
	
	// generate password
	currentPassword = generatePassword(charset, length);
	
	// calculate and format entropy
	var entropy = Math.log(charset.length) * length / Math.log(2);
	var entropystr;
	if (entropy < 70)
		entropystr = entropy.toFixed(2);
	else if (entropy < 200)
		entropystr = entropy.toFixed(1);
	else
		entropystr = entropy.toFixed(0);
	
	// output 
	passwordElem.textContent = currentPassword;
	copyElem.disabled = false;
}

function doCopy() {
	var container = document.querySelector("article");
	var textarea = document.createElement("textarea");
	textarea.style.position = "fixed";
	textarea.style.opacity = "0";
	const newLocal = container.insertBefore(textarea, container.firstChild);
	textarea.value = currentPassword;
	textarea.focus();
	textarea.select();
	document.execCommand("copy");
	container.removeChild(textarea);
}

function getPasswordCharacterSet() {
	var rawCharset = "";
	CHARACTER_SETS.forEach(function(entry, i) {
		if (document.getElementById("charset-" + i).checked)
			rawCharset += entry[2];
	});
	
	// convert to array of strings
	var charset = [];
	for (var i = 0; i < rawCharset.length; i++) {
		var c = rawCharset.charCodeAt(i);
		if (c < 0xD800 || c >= 0xE000) { 
			var s = rawCharset.charAt(i);
			if (charset.indexOf(s) == -1)
				charset.push(s);
			continue;
		}
		if (0xD800 <= c && c < 0xDC00 && i + 1 < rawCharset.length) { 
			var d = rawCharset.charCodeAt(i + 1);
			if (0xDC00 <= d && d < 0xE000) {  
				var s = rawCharset.substring(i, i + 2);
				i++;
				if (charset.indexOf(s) == -1)
					charset.push(s);
				continue;
			}
		}
		throw "Invalid UTF-16";
	}
	return charset;
}


function generatePassword(charset, len) {
	var result = "";
	for (var i = 0; i < len; i++)
		result += charset[randomInt(charset.length)];
	return result;
}

function randomInt(n) {
	var x = randomIntMathRandom(n);
	x = (x + randomIntBrowserCrypto(n)) % n;
	return x;
}


function randomIntMathRandom(n) {
	var x = Math.floor(Math.random() * n);
	if (x < 0 || x >= n)
		throw "Arithmetic exception";
	return x;
}


function randomIntBrowserCrypto(n) {
	if (cryptoObject == null)
		return 0;
	// generate an unbiased sample
	var x = new Uint32Array(1);
	do cryptoObject.getRandomValues(x);
	while (x[0] - x[0] % n > 4294967296 - n);
	return x[0] % n;
}

initCharsets();