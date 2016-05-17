
class Material {
	constructor (obj = {}) {
		this.data = obj;
	}
	
	find (idName) {
		var result = new Array();
		
		let fn = function(o) {
			for(let i in o) {
				if (!o.hasOwnProperty(i))
					continue;
				
				if(i == idName) {
					if(typeof o[i] === "object" || Object.prototype.toString.call( o[i] ) === '[object Array]')
						result.push.apply(result, o[i])
					else
						result[result.length] = o[i];
				}
				
				if(typeof o[i] === "object" || Object.prototype.toString.call( o[i] ) === '[object Array]')
					fn(o[i]);
			}
		};
		
		fn(this.data);
		
		return result;
	}
}


var Materials = new (function() {
	
	this._MATERIALS = [];
	
	this.get = function(name, dir, fnCallback) {
		
		if(!dir.isDirectory)
			return fnCallback(false);
		
		this.explodeDir(dir);
		log(this._MATERIALS[name]);
		
		fnCallback(this._MATERIALS[name]);
	}
	
	this.explodeDir = function(dir) {
		var entries = dir.directoryEntries;
	
		while(entries.hasMoreElements()) {
			var entry = entries.getNext().QueryInterface(Ci.nsIFile),
				s = entry.leafName.split(".");
			
			// only load *.material-files
			if(s[s.length - 1] != "material")
				continue;
			
			var txt = readFile(entry);
		
			if(!txt)
				continue;
			
			var aResults = this.parse(txt);
			
			for(var i in aResults)
				this._MATERIALS[aResults[i].materialName] = aResults[i];
		}
	}
	
	/**
		Parser
	*/
	
	this.nextSubClass = "";
	
	this.parse = function(txt) {
	
		// reset working variables
		this.s = "";
		this._results = [];
		this._o = this._results;
		var length = txt.length;
		
		for(var i = 0; i < length; i++)  {
			var c = txt.charAt(i);
			
			switch(c) {
				
				case "\}":
					this.delimit();
					this.closeSub();
				break;
				
				case "{":
					this.delimit();
					this.openSub();
				break;
				
				case ",":
					this.delimit();
				break;
				
				case "\r":
				case "\r\n":
				case "\n":
					this.delimit();
					// close property access
					this.propName = undefined;
				break;
				
				case "/":
					if(txt.charAt(i + 1) == "/")
						for(var ii = i + 1; ii < length; ii++)
							if(txt.charAt(ii).match(/(\r\n|\n|\r)/g)) {
								i = ii;
								break;
							}
				break;
				
				case " ":
					this.delimit();
				break;
				
				case "\t":
				break;
				
				default:
					this.s += c;
			}
		}
		
		return this._results;
	};
	
	this.delimit = function() {
		
		if(!this.s.length)
			return;
		else if(this.nextSubClass)
			this.nextSubName = this.s;
		else if(this.s == "material" ||
			this.s == "pass" ||
			this.s == "technique" ||
			this.s == "texture_unit")
			this.nextSubClass = this.s;
		else {
			if(this.propName)
				this._o[this.propName][this._o[this.propName].length] = this.s;
			else {
				this.propName = this.s;
				this._o[this.propName] = [];
			}
		}
		
		this.clearBuffer();
	};
	
	this.openSub = function() {
		// create new material instance
		if(this.nextSubClass == "material") {
			var newMat = new Material();
			
			this._results[this._results.length] = newMat;
			this._o = newMat.data;
			newMat.materialName = this.nextSubName;
			
			this.nextSubName = "";
		}
		// non-special sub-object
		else {
			if(!this._o[this.nextSubClass])
			this._o[this.nextSubClass] = [];
		
			var i = this._o[this.nextSubClass].length;
			
			this._o[this.nextSubClass][i] = {
				"id": i, 
				"parent": this._o, 
				"class": this.nextSubClass,
				"name": this.nextSubName
			};
			this._o = this._o[this.nextSubClass][i];
		}
		
		this.nextSubClass = "";
	};
	
	this.closeSub = function() {
		var p = this._o.parent;
		
		this._o.parent = false;
		this._o = p;
	};
	
	this.clearBuffer = function() {
		this.s = "";
	};
})();