onmessage = function(e) {
	importScripts("chrome://windmill/content/js/external/js-inflate.js");
	let data = e.data;
	//Bytes als Blob für JSInflate
	let datablob = "";
	for(let i = 0; i < data.length; i++)
	  datablob += String.fromCharCode(data[i]);
	
	//Inflate
	let ndata = JSInflate.inflate(datablob);
	data = [];
	
	//Blob to Byte Array
	for(let i = 0; i < ndata.length; i++) {
		data.push(ndata[i].charCodeAt(0));
	}
	postMessage(data);
}