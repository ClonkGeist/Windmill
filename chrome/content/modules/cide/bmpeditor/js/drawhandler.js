/**

	TODO:
	render*() nicht mehr auf this.shaderType zurückgreifen, ausschließlich mit render*(shaderType) arbeiten
	gegebenenfalls um render*(shaderType1, shaderType2) erweitern

*/
hook("load", () => {	
	initGl("draw-canvas")
})

var _gl
var _shaders = []

const
	MIRROR_NONE = 0,
	MIRROR_Y 	= 1,
	MIRROR_X 	= 2,
	MIRROR_XY 	= 3

var buffer = []

var DEBUG_WEBGL = false
var _o
function initGl(id) {
	var c = document.getElementById(id)
	
	var gl
	
	try {
		gl = c.getContext("webgl", {
			antialias: false,
			depth: false,
			stencil: false,
			preserveDrawingBuffer: true
		})
	}
	catch(e) {
		log("WebGL doesn't work..., for reasons...", false, "error");
	}
	
	if(!gl)
		return
	
	if(DEBUG_WEBGL) {
		var o = {
			id
		}
		
		let onGlError = (e, funcName, args) => {
			log(WebGLDebugUtils.glEnumToString(e) + " was caused by calling '" + funcName + "'\n" +
				"\n" + o.excertCallStack()
			)
		}
		
		var callstackLength = 0
		
		o._callStack = new Array(callstackLength)
		o._currentCallStackIndex = 0
		let glTraceCallstack = (functionName, args) => {
			let str = ""
			
			args = new Map(Object.entries(args))
			args.forEach((v) => {
				str += v + ", "
			})
			
			o._callStack[o._currentCallStackIndex] = functionName + ": " + str + "\n"
			o._currentCallStackIndex = (o._currentCallStackIndex + 1) % callstackLength
		}
		
		o.excertCallStack = () => {
			let s = "WebGlInstance ("+o.id+") CallStack:\n"
			
			for(let i = 0; i < callstackLength; i++)
				s += o._callStack[(o._currentCallStackIndex + i) % callstackLength]
			
			return s + "-\tend\t-"
		}
		
		_o = o
		
		gl = WebGLDebugUtils.makeDebugContext(gl, onGlError, glTraceCallstack)
	}
	
	_gl = gl
	
	initCtrls()
}

function getGl() {
	if(!_gl)
		initGl("draw-canvas")
	
	return _gl
}

var a_S

function addScene(gl, c) {
	var scene = new BMPScene(gl, c)
	_SCENES[_SCENES.length] = scene
	
	return scene
}

var _SCENES = []

class BMPScene {
	constructor(gl, c) {
		this.height = 0
		this.width = 0
		this.gl = gl
		this.canvas = c
		this.initialized = false
		
		this.mirrorType = MIRROR_NONE
		
		this.orientation = 0
		
		this.rotMat = new Float32Array(4)
		this.inputRect = new Float32Array(4)
		
		this.zoomFactor = 1
		
		this.shader
		this.vBuffer = gl.createBuffer()
		this.uvBuffer = gl.createBuffer()
		
		this.shaderType = SHADER_TYPE_BACKBUFFER
		
		this.useShaderOfType(SHADER_TYPE_BACKBUFFER)
		
		this.bindAttribBuffer()
		
		this.texture_Combined = this.createTexture()
		this.texture_Worker = this.createTexture()
		this.texture_Brush = this.createTexture()
		
		this.selClrIndex = 0
		this.selShape = Shape_Circle
		
		this.currentColorRGB = new Float32Array(3)
		
		this._undoStack = []
		this._tStacks = []
		this.dirtyCounter = 0
		this.currentActionId = -1
		
		// precompile common shaders
		this.addShader(SHADER_TYPE_BACKBUFFER)
		this.addShader(SHADER_TYPE_INPUT)
		this.addShader(SHADER_TYPE_COLORED_SHAPE)
	}
	
	set ptexture_Source (tex) {
		this._tex0 = tex
	}
	
	get ptexture_Source() {
		return this._tex0
	}
	
	set ptexture_Worker (tex) {
		this._tex1 = tex
	}
	
	get ptexture_Worker() {
		return this._tex1
	}
			
	// has to be 1 or -1
	rotate(dir) {
		this.orientation += dir
		if(this.orientation > 3)
			this.orientation = 0
		else if(this.orientation < 0)
			this.orientation = 3
		
		this.updateRotMat()
		
		this.render(this.shaderType)
	}
	
	updateRotMat() {
		switch(this.orientation) {
			// no rotation
			case 0:
				this.rotMat[0] = 1
				this.rotMat[1] = 0
				this.rotMat[2] = 0
				this.rotMat[3] = 1
			break
			// 90deg cw
			case 1:
				this.rotMat[0] = 0
				this.rotMat[1] = -1
				this.rotMat[2] = 1
				this.rotMat[3] = 0
			break
			// 180deg cw
			case 2:
				this.rotMat[0] = -1
				this.rotMat[1] = 0
				this.rotMat[2] = 0
				this.rotMat[3] = -1
			break
			// 270deg cw
			case 3:
				this.rotMat[0] = 0
				this.rotMat[1] = 1
				this.rotMat[2] = -1
				this.rotMat[3] = 0
			break
		}
		
		var loc = this.gl.getUniformLocation(this.shader.prog, "mOrient")
		this.gl.uniformMatrix2fv(this.gl.getUniformLocation(this.shader.prog, "mOrient"), false, this.rotMat)
	}
	
	initWithTexture(src) {
		
		return new Promise((resolve, reject) => {
			var img = new Image()
			
			img.onload = () => {
				let gl = this.gl
				
				this.texture_Combined = this.createTexture()
				gl.activeTexture(gl.TEXTURE0)
				gl.bindTexture(gl.TEXTURE_2D, this.texture_Combined)
				this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true)
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img)
				this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, false)
				gl.bindTexture(gl.TEXTURE_2D, null)
							
				this.setDimensions(img.width, img.height)
				
				this.texture_Worker = this.createTexture()
				gl.activeTexture(gl.TEXTURE1)
				gl.bindTexture(gl.TEXTURE_2D, this.texture_Worker)
				gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.ALPHA, this.width, this.height, 0, gl.ALPHA, gl.UNSIGNED_BYTE, null)
				gl.bindTexture(gl.TEXTURE_2D, null)
				
				
				this.ptexture_Source = this.texture_Combined
				this.ptexture_Worker = this.texture_Worker
				
				this.initialized = true
				
				this.render(this.shaderType)
				
				var ts = this.getTextureStack()
		
				var state = ts.saveState()
				
				this.manifestUndoStep(new Action(() => {
					ts.drawState(state, this)
				}))
				
				resolve()
			}
			
			img.onerror = function(e) {
				reject(e, src)
			}
		
			img.src = "file:" + src
		})
	}
	
	createTexture() {
		let gl = this.gl
		let tex = gl.createTexture()
		gl.bindTexture(gl.TEXTURE_2D, tex)
		// disable interpolation
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
		// disable wrap (to work with NPOT textures)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
		
		gl.bindTexture(gl.TEXTURE_2D, null)
		
		return tex
	}
		
	isInitialized() {
		return this.initialized
	}
		
	setDimensions(w = 1, h = 1, align = -1) {
		this.width = w
		this.height = h
		log("image align: " + align)
		this.canvas.width = w
		this.canvas.height = h
		
		this.updateZoom()
		this.gl.viewport(0, 0, w, h)
		
		// work with additional margin of 1 at each side
		this.selMask = new Uint8Array((w+2)*(h+2))
		this._selPointMask = new Uint8Array((w+2)*(h+2))
		
		document.getElementById("ui-sel").setAttribute("viewBox", "0 0 "+ w + " " + h)
		document.getElementById("ui-sel").setAttribute("height", this.height*this.zoomFactor)
	}
	
	// flip y coords	
	rectToClipspaceFormat(x = 0, y = 0, w = 1, h = 1) {
		return [
			(this.width/2 - x)/this.width,
			-(this.height/2 - y)/this.height,
			(x + w - this.width/2)/this.width,
			-(y + h - this.height/2)/this.height
		]
	}
		
	updateZoom() {
		$(this.canvas).css("width", (this.width*this.zoomFactor) + "px")
		$(this.canvas).css("height", (this.height*this.zoomFactor) + "px")
		
		document.getElementById("ui-sel").setAttribute("height", this.height*this.zoomFactor)
		
		if(this.currentRect)
			this.updateUiRectPos()
	}
	
	screenToTexture(x, y) {
		
		x /= this.zoomFactor
		y /= this.zoomFactor
		
		if(x > this.w)
			x = this.w
		
		if(y > this.h)
			y = this.h
		
		// flip y
		return [Math.round(x), Math.round(y)]
	}
	
	getNeededDimensions() {
		return [
			this.width * this.zoomFactor,
			this.height * this.zoomFactor
		]
	}
	
	render(shaderType) {
		this.useShaderOfType(shaderType)
		this.bindAttribBuffer()
		this.setUniforms()
		this.gl.drawArrays(this.gl.TRIANGLES, 0, 6)
	}
	
	renderWithBackup(backupShaderType, inputShaderType) {
		this.useShaderOfType(backupShaderType)
		this.setUniforms()
		this.gl.drawArrays(this.gl.TRIANGLES, 0, 6)
		
		this.useShaderOfType(inputShaderType)
		this.setUniforms()
		this.gl.drawArrays(this.gl.TRIANGLES, 0, 6)
	}
	
	renderInputIntoWorker(shaderType, rect) {
		// draw old
		this.useShaderOfType(this.shaderType)
		this.setUniforms()
		this.gl.drawArrays(this.gl.TRIANGLES, 0, 6)
		
		// draw new
		this.useShaderOfType(shaderType)
		this.setUniforms()
		this.gl.drawArrays(this.gl.TRIANGLES, 0, 6)
		
		// TODO: use copySubTexImage
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture_Combined)
		this.gl.copyTexImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGB, 0, 0, this.width, this.height, 0)
	}
	
	renderBrushLine(shaderType, x1, y1, x2, y2, shape) {
		this.useShaderOfType(shaderType)
		this.setUniforms()
		
		// sort points by x
		if(x1 > x2) {
			let temp = x1
			x1 = x2
			x2 = temp
			
			temp = y1
			y1 = y2
			y2 = temp
		}
		
		var slope = (y2 - y1 + 1) / (x2 - x1 + 1)
		
		if(y1 <= y2)
			for(let x = x1; x <= x2; x++) {
				for(let y = 0; y <= slope; y++) {
					shape.setCenterAt(x, y + parseInt(y1))
					this.setInputRect(shape.rect)
					
					this.updateInputRectUniform()
					this.gl.drawArrays(this.gl.TRIANGLES, 0, 6)
				}
				y1 += slope
			}
		else
			for(let x = x1; x <= x2; x++) {
				for(let y = 0; y >= slope; y--) {
					shape.setCenterAt(x, parseInt(y1) - y)
					this.setInputRect(shape.rect)
					
					this.updateInputRectUniform()
					this.gl.drawArrays(this.gl.TRIANGLES, 0, 6)
				}
				y1 += slope
			}
	}
	
	combineInputIntoSource(shaderTypeForInput) {
		this.useShaderOfType(this.shaderType)
		this.setUniforms()
		this.gl.drawArrays(this.gl.TRIANGLES, 0, 6)
		
		this.useShaderOfType(shaderTypeForInput)
		this.setUniforms()
		this.gl.drawArrays(this.gl.TRIANGLES, 0, 6)
		
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture_Combined)
		this.gl.copyTexImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGB, 0, 0, this.width, this.height, 0)
	}
	
	combineIntoSource() {
		this.useShaderOfType(this.shaderType)
		this.setUniforms()
		this.gl.drawArrays(this.gl.TRIANGLES, 0, 6)
		
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture_Combined)
		this.gl.copyTexImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGB, 0, 0, this.width, this.height, 0)
	}
	
	backupSource() {
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture_Combined)
		this.gl.copyTexImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGB, 0, 0, this.width, this.height, 0)
	}
		
	setUniforms() {
		var shader = this.shader
		var gl = this.gl
		
		if(shader.unifImgSource !== null) {
			gl.activeTexture(gl.TEXTURE0)
			gl.bindTexture(gl.TEXTURE_2D, this.ptexture_Source)
			gl.uniform1i(shader.unifImgSource, 0)
		}
		
		if(shader.unifImgWorker !== null) {
			gl.activeTexture(gl.TEXTURE1)
			gl.bindTexture(gl.TEXTURE_2D, this.ptexture_Worker)
			gl.uniform1i(shader.unifImgWorker, 1)
		}
		
		if(shader.unifImgBrush !== null) {
			gl.activeTexture(gl.TEXTURE2)
			gl.bindTexture(gl.TEXTURE_2D, this.texture_Brush)
			gl.uniform1i(shader.unifImgBrush, 2)
		}
		
		if(shader.unifImgInput !== null) {
			gl.activeTexture(gl.TEXTURE2)
			gl.bindTexture(gl.TEXTURE_2D, this.texture_Input)
			gl.uniform1i(shader.unifImgInput, 2)
		}
		
		if(shader.unifWorkerColor && shader.unifWorkerColor !== null) {
			gl.uniform3fv(shader.unifWorkerColor, this.getCurrentWorkerColor())
		}
		
		if(shader.unifRect && shader.unifRect !== null) {
			gl.uniform4fv(shader.unifRect, this.getInputRect())
		}
	}
	
	updateInputRectUniform() {
		this.gl.uniform4fv(this.shader.unifRect, this.getInputRect())
	}
	
	useShaderOfType(type) {
		if(!this.shader || this.shader.type !== type) {
			var s = this.getShaderOfType(type)
			if(!s)
				return false
			this.shader = s
		}
		
		this.gl.useProgram(this.shader.prog)
		return true
	}
	
	useShaderByFlags(flags) {
		
		if(!this.shader || this.shader.flags !== flags) {
			var s = this.getShaderByFlags(flags)
			if(!s)
				return false
			this.shader = s
		}
		
		this.gl.useProgram(this.shader.prog)
		return true
	}
		
	bindAttribBuffer() {
		[this.vBuffer, this.uvBuffer] = getBuffer(this.mirrorType, this.gl)
		
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vBuffer)
		this.gl.enableVertexAttribArray(this.shader.attrPos)
		this.gl.vertexAttribPointer(this.shader.attrPos, 2, this.gl.FLOAT, false, 0, 0)
		
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.uvBuffer)
		this.gl.enableVertexAttribArray(this.shader.attrUv)
		this.gl.vertexAttribPointer(this.shader.attrUv, 2, this.gl.FLOAT, false, 0, 0)
	}
	
	getCurrentWorkerColor() {
		return this.currentColorRGB
	}
	
	getShaderByFlags(flags) {
		var s = this.shaderAvailable(flags)
		
		if(!s)
			s = this.addShader(flags)
		
		return s
	}
	
	getShaderOfType(type) {
		return this.shaderAvailable(type) || this.addShader(type)
	}
	
	addShader(flags) {
		var prog = composeShaderProgram(this.gl, flags)
		if(!prog)
			return false
		
		var s = {
			flags: flags, /// @deprecated
			type: flags,
			prog: prog,
			attrPos: this.gl.getAttribLocation(prog, "pos"),
			attrUv: this.gl.getAttribLocation(prog, "uUV"),
			unifImgSource: this.gl.getUniformLocation(prog, "img_source"),
			unifImgWorker: this.gl.getUniformLocation(prog, "img_worker"),
			unifImgBrush: this.gl.getUniformLocation(prog, "img_brush"),
			unifImgInput: this.gl.getUniformLocation(prog, "img_input"),
			unifWorkerColor: this.gl.getUniformLocation(prog, "worker_color"),
			unifRect: this.gl.getUniformLocation(prog, "rect")
		}
		
		_shaders[_shaders.length] = s
		return s
	}
	
	shaderAvailable(flags) {
		for(var i = 0; i < _shaders.length; i++)
			if(flags === _shaders[i].flags || flags === _shaders[i].type)
				return _shaders[i]
		
		return false
	}

	onShow() {
		this.canvas.width = this.width
		this.canvas.height = this.height
		
		document.getElementById("ui-sel").setAttribute("viewBox", "0 0 "+ this.width + " " + this.height)
		document.getElementById("ui-sel").setAttribute("height", this.height*this.zoomFactor)
		this.gl.viewport(0, 0, this.width, this.height)
		
		this.bindAttribBuffer()
		//this.render(this.shaderType)
		this._undoStack[this.currentActionId].perform()
	}
	
	setInputTex(tex) {
		this.texture_Input = tex
	}
	
	setInputRect(rect) {
		var [x, y, w, h] = this.rectToClipspaceFormat(rect.x, rect.y, rect.w, rect.h)
		
		this.inputRect[0] = x
		this.inputRect[1] = y
		this.inputRect[2] = w
		this.inputRect[3] = h
	}
	
	getInputRect() {
		return this.inputRect
	}
	
	reloadWorkerSub(rect, tex) {
		this.ptexture_Worker = this.texture_Worker
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture_Worker)
		this.gl.texSubImage2D(this.gl.TEXTURE_2D, 0, rect.x, rect.y, rect.w, rect.h, this.gl.ALPHA, this.gl.UNSIGNED_BYTE, new Uint8Array([255]))
		
		this.shaderType = SHADER_TYPE_COMBINED_BACKBUFFER
		this.render(this.shaderType)
	}
	
	uploadBrush() {
		let size = sceneMeta[CM_ACTIVEID].brushData.size
		
		this.gl.activeTexture(this.gl.TEXTURE2)
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture_Brush)
		
		this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.ALPHA, this.gl.ALPHA, this.gl.UNSIGNED_BYTE, document.getElementById("bp-preview-gen"))
	}
	
	setColorRGB([r, g, b]) {
		this.currentColorRGB[0] = r
		this.currentColorRGB[1] = g
		this.currentColorRGB[2] = b
	}
	
	/** 
		Undo-Manager
	*/
	
	isClean() {
		if(this.dirtyCounter === 0)
			return true
		
		return false
	}
	
	undo() {
		if(!this.hasUndoStep())
			return false
		
		this._undoStack[--this.currentActionId].perform()
		
		this.dirtyCounter--
		
		return true
	}
	
	redo() {
		this.dirtyCounter++
	}
	
	hasUndoStep() {
		if(this.currentActionId <= 0)
			return false
		
		return true
	}
	
	hasRedoStep() {
		if(this.currentActionId === this._undoStack.length - 1)
			return false
		
		return true
	}
	
	manifestUndoStep(action) {
		if(this._undoStack.length < MAX_UNDO_STACKSIZE) {
			this.currentActionId++
			this._undoStack.push(action)
		}
		else {
			this._undoStack.shift()
			this._undoStack.push(action)
		}
		
		this.dirtyCounter++
	}
	
	onSave() {
		this.dirtyCounter = 0
	}
	
	getTextureStack() {
		
		let id = this.width + "x" + this.height
		
		if(!this._tStacks[id])
			this._tStacks[id] = new TextureStack(
				this.width,
				this.height,
				this.gl,
				this.c,
				this.createTexture()
			)
		
		return this._tStacks[id]
	}
	
	/** 
		UI-Rect
	*/
	
	setRectElement(el) {
		this.uiRect = el
	}
	
	initUiRectUse(mode, rect) {
		this.updateUiRectPos(rect)
		this.currentRect = rect
		
		this.uiRect.style.display = "flex"
		
		this.fallbackRect = rect
	}
	
	updateUiRectPos(rect = this.fallbackRect) {
		this.uiRect.style.width = rect.w*this.zoomFactor + "px"
		this.uiRect.style.height = rect.h*this.zoomFactor + "px"
		this.uiRect.style.top = rect.y*this.zoomFactor + "px"
		this.uiRect.style.left = rect.x*this.zoomFactor + "px"
	}
	
	hideUiRect() {
		this.uiRect.style.display = "none"
	}
	
	stopUiRectUse() {
		this.currentRect = false
	}
	
	
	/**
		Special functionalities
	*/
	
	// this output is flipped by its y-axis
	readPixels(x, y, w, h) {
		// flip y
		y = this.height - y - h
		
		let target = new Uint8Array(w*h*4)
		
		this.gl.readPixels(x, y, w, h, this.gl.RGBA, this.gl.UNSIGNED_BYTE, target)
		
		return target
	}
}

class TextureStack {
	constructor(w, h, gl, c, tex) {
		this.gl = gl
		this.c = c
		this.w = w
		this.h = h
		
		this.totalH = h*MAX_UNDO_STACKSIZE
		
		this.maxSize = MAX_UNDO_STACKSIZE
		
		this.id = w + "x" + h
		
		this.userCount = 0
		this.hasFocus = false
		this.tex = tex
		
		this.offset = 0
		
		gl.bindTexture(gl.TEXTURE_2D, tex)
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, this.totalH, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
	}
	
	saveState() {
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.tex)
		this.gl.copyTexSubImage2D(this.gl.TEXTURE_2D, 0, 0, this.offset * this.h, 0, 0, this.w, this.h)
		
		let i = this.offset
		
		this.offset = (this.offset + 1) % this.maxSize
		
		return i
	}
	
	drawState(i, scene, doNotTrack) {		
		let y = i * this.h
		
		scene.inputRect[0] = 0.5
		scene.inputRect[1] = (i * 2 + 1)/2
		scene.inputRect[2] = 0.5
		scene.inputRect[3] = ((this.maxSize - i) * 2 - 1)/2
		
		scene.setInputTex(this.tex)
		scene.render(SHADER_TYPE_INPUT)
		
		if(!doNotTrack)
			this.offset = (i + 1) % this.maxSize
	}
	
	registerUser() {
		this.userCount++
	}
	
	// returning true marks as unused and is allowed to get deleted
	unregisterUser() {
		this.userCount--
		
		if(this.userCount < 1 && !this.current) {
			this.die()
			return true
		}
		
		return false
	}
	
	die() {
		this.gl.deleteTexture(this.tex)
		this.gl = null
	}
}


/**
	global buffer creation
*/

function getBuffer(mirrorType, gl) {
	return buffer[mirrorType] || createBuffer(gl, mirrorType)
}

function createBuffer(gl, mirrorType) {
	
	var vBuffer = gl.createBuffer(), uvBuffer = gl.createBuffer()
	
	if(mirrorType === 0) {
		gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer)
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
			// first rect
			 -1, -1,
			 1, -1,
			 -1, 1,
			 
			 -1, 1,
			 1, -1,
			 1, 1,
			 
		]), gl.STATIC_DRAW)
		
		gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer)
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
			0, 0,
			1, 0,
			0, 1,
			
			0, 1,
			1, 0,
			1, 1
		]), gl.STATIC_DRAW)
	}
	
	buffer[mirrorType] = [vBuffer, uvBuffer]
	
	return buffer[mirrorType]
}