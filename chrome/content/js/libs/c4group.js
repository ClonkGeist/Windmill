function C4GroupFile(header, content) {
	this.header = header;
	this.content = content;
	
	this.getEntryByName = function(filename) {
		for(var i = 0; i < this.content.length; i++) {
			if(this.content[i].filename == filename)
				return this.content[i];
		}
	}
}

function readC4GroupFile(f) {
	var	fs = _sc.ifstream(f, 1, 0, false),
		bs = _sc.bistream(),
		result = {};
		bs.setInputStream(fs);

	//Bytedaten rauslesen
	var data = bs.readByteArray(f.fileSize);

	bs.close();
	fs.close();
	
	return readC4GroupBytes(data);
}

function readC4GroupBytes(data) {
	//GZIP-Header und Footer wegschneiden
	var gz_header = data.splice(0, 10);
	var gz_footer = data.splice(data.length-8);

	if(gz_header[0] != 0x1e || gz_header[1] != 0x8c) {
		return false;
	}

	//Bytes als Blob für JSInflate
	var datablob = "";
	for(var i = 0; i < data.length; i++)
	  datablob += String.fromCharCode(data[i]);
	
	//Inflate
	var ndata = JSInflate.inflate(datablob);
	data = [];
	
	//Blob to Byte Array
	for(var i = 0; i < ndata.length; i++) {
		data.push(ndata[i].charCodeAt(0));
	}
	
	var c4g_headerdata = data.slice(0, 204);
	var c4g_contentdata = data.slice(204, data.length);
	
	var c4g_header = getGroupHeader(c4g_headerdata);
	var c4g_content = getGroupContent(c4g_contentdata, c4g_header.entries);
	
	var groupfile = new C4GroupFile(c4g_header, c4g_content);
	return groupfile;
}

function C4GroupHead() {
	this.id = "";			//0x0000  25 Bytes
	this.reserved1 = 0;		//0x0019   3 Bytes
	this.ver1 = 0;			//0x001C   4 Bytes
	this.ver2 = 0;			//0x0020   4 Bytes
	this.entries = 0;		//0x0024   4 Bytes
	this.author = "";		//0x0028  32 Bytes
	this.reserved2 = 0;		//0x0048 164 Bytes
}

function getGroupHeader(data) {
	//Gruppenheader dekodieren
	for(var i = 0; i < data.length; i++) {
		data[i] ^= 237;
	}
	for(var i = 0,temp; (i+2) < data.length; i+=3) {
		temp = data[i];
		data[i] = data[i+2];
		data[i+2] = temp;
	}
	
	//Headerinhalte in Objekt speichern
	var head = new C4GroupHead();
	head.id = data.splice(0,25).byte2str();
	head.reserved1 = data.splice(0,3);
	head.ver1 = data.splice(0,4).byte2num();
	head.ver2 = data.splice(0,4).byte2num();
	head.entries = data.splice(0,4).byte2num();
	head.author = data.splice(0,32).byte2str();
	head.reserved2 = data.splice(0,164);

	return head;
}

function C4GroupEntryCore() {
	this.filename = ""; 	//0x0000   260 Bytes
	this.packed = 0;		//0x0104     4 Bytes
	this.childgroup = 0;	//0x0108     4 Bytes
	this.size = 0;			//0x010c 	 4 Bytes
	this.reserved1 = 0;		//0x0110	 4 Bytes
	this.offset = 0;		//0x0114	 4 Bytes
	this.reserved2 = 0;		//0x0118	 4 Bytes
	this.reserved3 = 0;		//0x011c	 1 Byte
	this.reserved4 = 0;		//0x011d	 4 Bytes
	this.executable = 0;	//0x0121	 1 Byte
	this.buffer = 0;		//0x0122	26 Bytes
	
	this.data = "";	//Dateiinhalt
}

function getGroupContent(data, count) {
	//Inhaltsverzeichnis auslesen
	var entries = [];
	for(var i = 0; i < count; i++) {
		/*if(i > 2) Macht Apfels Spieler kaputt?
			break;*/
	
		var entry = new C4GroupEntryCore();
		
		entry.filename = data.splice(0,260).byte2str();
		entry.packed = data.splice(0,4).byte2num();
		entry.childgroup = data.splice(0,4).byte2num();
		entry.size = data.splice(0,4).byte2num();
		entry.reserved1 = data.splice(0,4);
		entry.offset = data.splice(0,4).byte2num();
		entry.reserved2 = data.splice(0,4);
		entry.reserved3 = data.splice(0,1);
		entry.reserved4 = data.splice(0,4);
		entry.executable = data.splice(0,1)[0];
		entry.buffer = data.splice(0,26);

		entries[i] = entry;
	}
	
	//Daten zuordnen
	for(var i = 0; i < count; i++)
		entries[i].data = data.splice(0, entries[i].size);

	return entries;
}











