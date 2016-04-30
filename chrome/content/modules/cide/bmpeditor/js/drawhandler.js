
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

function initGl(id) {
	var c = document.getElementById(id)
	
	var gl
	
	try {
		gl = c.getContext("experimental-webgl", {
			antialias: false, 
			depth: false, 
			stencil: false,
			// alpha: false
		})
	}
	catch(e) {
		log("WebGL doesn't work..., for reasons...");
	}
	
	if(!gl)
		return
	
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
		
		this._undoStacks = []
		this.dirtyCounter = 0
		this.actionCounter = 0
		
		this.selClrIndex = 0
		this.selShape = Shape_Circle
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
		
		this.render()
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
			
			this.render()
		}
		
		img.onerror = function(e) {
		}
		
		img.src = "file:" + src
	}
	
	initWithData(data, width, height) {
		let gl = this.gl
		
		this.texture_Combined = this.createTexture()
		gl.activeTexture(gl.TEXTURE0)
		gl.bindTexture(gl.TEXTURE_2D, this.texture_Combined)
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
		gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, data)
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
		gl.bindTexture(gl.TEXTURE_2D, null)
				
		this.setDimensions(width, height)
		
		this.texture_Worker = this.createTexture()
		gl.activeTexture(gl.TEXTURE1)
		gl.bindTexture(gl.TEXTURE_2D, this.texture_Worker)
		gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.ALPHA, width, height, 0, gl.ALPHA, gl.UNSIGNED_BYTE, null)
		gl.bindTexture(gl.TEXTURE_2D, null)
		
		
		this.ptexture_Source = this.texture_Combined
		this.ptexture_Worker = this.texture_Worker
		
		this.initialized = true
		
		this.render()
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
		
	setDimensions(w = 0, h = 0) {
		this.width = w
		this.height = h
		
		this.canvas.width = w
		this.canvas.height = h
		
		this.updateZoom()
		this.gl.viewport(0, 0, w, h)
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
	
	render() {
		this.useShaderOfType(this.shaderType)
		this.bindAttribBuffer()
		this.setUniforms()
		this.gl.drawArrays(this.gl.TRIANGLES, 0, 6)
	}
	
	renderWithInput(shaderTypeForInput) {
		this.useShaderOfType(this.shaderType)
		this.setUniforms()
		this.gl.drawArrays(this.gl.TRIANGLES, 0, 6)
		
		this.useShaderOfType(shaderTypeForInput)
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
	
	combineInputIntoSource(shaderTypeForInput) {
		this.useShaderOfType(this.shaderType)
		this.setUniforms()
		this.gl.drawArrays(this.gl.TRIANGLES, 0, 6)
		
		this.useShaderOfType(shaderTypeForInput)
		this.setUniforms()
		this.gl.drawArrays(this.gl.TRIANGLES, 0, 6)
		
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture_Combined)
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
		
		if(shader.unifWorkerColor && shader.unifWorkerColor !== null) {
			gl.uniform3fv(shader.unifWorkerColor, this.getCurrentWorkerColor())
		}
		
		if(shader.unifRect && shader.unifRect !== null) {
			gl.uniform4fv(shader.unifRect, this.getInputRect())
		}
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
		return new Float32Array([0.1, 0.5, 0.3])
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
			flags: flags,
			type: flags,
			prog: prog,
			attrPos: this.gl.getAttribLocation(prog, "pos"),
			attrUv: this.gl.getAttribLocation(prog, "uUV"),
			unifImgSource: this.gl.getUniformLocation(prog, "img_source"),
			unifImgWorker: this.gl.getUniformLocation(prog, "img_worker"),
			unifWorkerColor: this.gl.getUniformLocation(prog, "worker_color"),
			unifRect: this.gl.getUniformLocation(prog, "rect"),
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
		
		this.bindAttribBuffer()
		this.render()
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
		this.render()
	}
	
	getDryWorker() {
		return this.dryWorker
	}
	
	createDryWorker() {
		this.dryWorker = new UniColorTex(this.width, this.height)
		return this.dryWorker
	}
	
	useDryWorker(worker) {
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture_Worker)
		this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.ALPHA, this.width, this.height, 0, this.gl.ALPHA, this.gl.UNSIGNED_BYTE, worker.data)
		this.ptexture_Worker = this.texture_Worker
	}
	
	uploadBrush(shape) {
	}
	
	setScissor(rect) {
		this.gl.disable(this.gl.SCISSOR_TEST)
		
		this.gl.scissor(rect.x, rect.y, rect.w, rect.h)
	}
	
	unsetScissor() {
		this.gl.disable(this.gl.SCISSOR_TEST)
	}
	
	/** 
		Undo-Manager
	*/
	
	isDirty() {
		if(dirtyCounter !== 0)
			return true
	}
	
	undo() {
		dirtyCounter--
	}
	
	redo() {
		dirtyCounter++
	}
	
	hasUndoStep() {
		
	}
	
	hasRedoStep() {
		
	}
	
	addUndoStep() {
	}
	
	onSave() {
		dirtyCounter = 0
	}
	
	/** 
		UI-Rect
	*/
	
	useAsRect(el) {
		this.uiRect = el
	}
	
	initUiRectUse(mode, rect) {
		this.updateUiRectPos(rect)
		this.currentRect = rect
		
		this.uiRect.style.display = "flex"
	}
	
	updateUiRectPos(rect) {
		this.uiRect.style.width = rect.w*this.zoomFactor + "px"
		this.uiRect.style.height = rect.h*this.zoomFactor + "px"
		this.uiRect.style.top = rect.y*this.zoomFactor + "px"
		this.uiRect.style.left = rect.x*this.zoomFactor + "px"
	}
	
	stopUiRectUse() {
		this.currentRect = false
	}
	
	
	/**
		Special functionalities
	*/
	
	getPixelColor(x, y) {
		let target = new Uint8Array(3)
		
		this.gl.readPixels(x, y, 1, 1, this.gl.UNSIGNED_BYTE, target)
		
		return target
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