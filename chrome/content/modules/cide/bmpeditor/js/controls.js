/**
	TODO:
	(mode modifiers: shift, alt, ctrl)
	
	interpolate Free-Draw-steps
	make backup
*/


var selectedMode, inMode, a_Mode,
	uiRectDragged

const
	MODIFIER_CTRL = 1,
	MODIFIER_SHIFT = 2,
	MODIFIER_ALT = 4
	

function initCtrls() {
	selectedMode = Mode_Draw_Shape
	
	$(".canvas-wrapper").mousedown(function(e) {
		if(!selectedMode || e.which !== 1 || $(".color-matching-wizard.visible2").get(0))
			return
		
		inMode = true
		
		var x = e.clientX - a_S.canvas.offsetLeft,
			y = e.clientY - a_S.canvas.offsetTop
		
		// convert screen pixels to textures pixels (includes zoom)
		var pos = a_S.screenToTexture(x, y)
		
		var [x, y] = a_S.screenToTexture(x, y)
		a_Mode = new selectedMode(0, a_S, x, y)
		a_Mode.onSceneFocus(a_S)
	})

	$("body").mousemove(function(e) {
		
		if(!inMode || $(".color-matching-wizard.visible2").get(0))
			return
		
		var x = e.clientX - a_S.canvas.offsetLeft,
			y = e.clientY - a_S.canvas.offsetTop
		
		var [x, y] = a_S.screenToTexture(x, y)
		a_Mode.onMousemove(x, y, a_S, getEventModifiers(e))
	})

	$("body").mouseup(function(e) {
		if(!inMode || e.which !== 1 ||  $(".color-matching-wizard.visible2").get(0))
			return
		
		var x = e.clientX - a_S.canvas.offsetLeft,
			y = e.clientY - a_S.canvas.offsetTop
		
		a_Mode.onMouseup(x, y, a_S, getEventModifiers(e))
		
		inMode = false
	})
	
	$(".ui-rect").mousedown((e) => {
		let r = a_S.currentRect
		
		r.x = e.clientX - a_S.canvas.offsetLeft,
		r.y = e.clientY - a_S.canvas.offsetTop
		
		a_S.updateUiRectPos(r)
	})
	
	$(".ui-thumb.top").mousedown((e) => {
		
	})
	
	$("#md_point").click(function() {
		setSelMode(Mode_Draw_Shape)
	})
	
	$("#md_rect").click(function() {
		setSelMode(Mode_Draw_Rect)
	})
	
	$("#md_circle").click(function() {
		setSelMode(Mode_Draw_Circle)
	})
}

function setSelMode(mode) {
	if(a_Mode)
		a_Mode.finish()
	
	selectedMode = mode
}

function getEventModifiers(e) {
	let mods = 0
	
	if(e.ctrlKey)
		mods += MODIFIER_CTRL
	
	if(e.shiftKey)
		mods += MODIFIER_SHIFT
	
	if(e.altKey)
		mods += MODIFIER_ALT
	
	return mods
}


/**
	************	MODE DEFINITIONS	**************

	Mode callbacks:
	
	onSceneFocus(scene)
	onMousemove(x, y, scene)
	onMouseup(x, y, scene)
	bake()
	rebuild()

*/
class DefaultMode {
	constructor(op_id, scene) {
		this.id = op_id
		this.scene = scene
	}
	
	onSceneFocus() {
	}
	
	finish() {
	}
	
	onMousemove(x = 0, y = 0, scene, modifier) {
	}
	
	onMouseup(x = 0, y = 0, scene, modifier) {
		
	}
}

class Mode_Eyedropper extends DefaultMode {
	onMouseup(x = 0, y = 0, scene, modifier) {
		// let clr = scene.getPixelColor(x, y)
	}
}

/*
class Mode_Draw_Shape extends DefaultMode {
	
	constructor(op_id, scene, x, y) {
		super(op_id, scene)
		this.diameter = 1
		this.shape = new scene.selShape(this.diameter)
		
		this.worker = scene.createDryWorker()
		
		this.lastX = x
		this.lastY = y
	}
	
	onSceneFocus(scene) {
		scene.useDryWorker(this.worker)
		scene.shaderType = SHADER_TYPE_COMBINED_BACKBUFFER
	}
	
	onMousemove(x = 0, y = 0, scene, modifier) {
		
		let t = this.worker
		
		// draw into dry texture
		this.shape.setCenterAt(x, y)
		t.insertShape(this.shape)
		
		// fill in gl texture
		let r = new Rect(t.rect, this.shape.rect)
		
		scene.reloadWorkerSub(r, t)
		
		this.lastX = x
		this.lastY = y
	}
	
	onMouseup(x = 0, y = 0, scene, modifier) {
		this.scene.combineIntoSource()
	}
	
	// store in a format which allows to rebuild the needed information with less ressources
	bake() {
		this.clr = this.selClrIndex
	}
	
	// rebuild
	rebuild() {
	}
}*/

class Mode_Draw_Shape extends DefaultMode {
	
	constructor(op_id, scene, x, y) {
		super(op_id, scene)
		this.diameter = 1
		this.shape = new scene.selShape(this.diameter)
		
		scene.uploadBrush(this.shape)
		
		this.shape.setCenterAt()
		
		this.lastX = x
		this.lastY = y
		
		this.bounding = new Rect(this.shape.rect)
	}
	
	onSceneFocus(scene) {
		scene.shaderType = SHADER_TYPE_COMBINED_BACKBUFFER
	}
	
	onMousemove(x = 0, y = 0, scene, modifier) {
		
		let t = this.worker
		
		this.shape.setCenterAt(x, y)
		
		this.scene.shaderType = SHADER_TYPE_BACKBUFFER
		this.scene.setInputRect(this.shape.rect)
		this.scene.renderInputIntoWorker(SHADER_TYPE_INPUT)
		
		this.scene.shaderType = SHADER_TYPE_COMBINED_BACKBUFFER
		this.scene.render()
		
		this.lastX = x
		this.lastY = y
	}
	
	onMouseup(x = 0, y = 0, scene, modifier) {
		this.scene.combineIntoSource()
	}
}

class Mode_Draw_Rect extends DefaultMode {
	constructor(op_id, scene, x = 0, y = 0) {
		super(op_id, scene)
		
		this.startX = x
		this.startY = y
		
		this.rect = new Rect(x, y, 0, 0)
		
		this.unstopped = false
	}
	
	onSceneFocus(scene) {
		this.unstopped = true
		
		let fn = () => {
			if(!this.unstopped)
				return
			
			// keep center if alt button pressed
			if(this.modifiers & MODIFIER_ALT) {
				let offsetX = Math.abs(this.newX - this.startX)
				let offsetY = Math.abs(this.newY - this.startY)
				
				this.rect.w = offsetX*2
				this.rect.x = this.startX - offsetX
				
				this.rect.h = offsetY*2
				this.rect.y = this.startY - offsetY
			}
			else {
				this.rect.w = this.newX - this.rect.x
				this.rect.h = this.newY - this.rect.y
				
				this.rect.x = this.startX
				this.rect.y = this.startY
			}
			
			this.scene.shaderType = SHADER_TYPE_BACKBUFFER
			this.scene.setInputRect(this.rect)
			this.scene.renderWithInput(SHADER_TYPE_RECTANGLE)
			
			requestAnimationFrame(fn)
		}
		
		requestAnimationFrame(fn)
	}
	
	onMousemove(x = 0, y = 0, scene, modifiers) {
		this.newX = x
		this.newY = y
		this.modifiers = modifiers
	}
	
	onMouseup(x = 0, y = 0, scene, modifiers) {
		this.unstopped = false
		
		this.rect.ensureFormat()
		showObj2(this.rect)
		this.scene.initUiRectUse(this, this.rect)
		this.onUiRectFinish()
	}
	
	onUiRectFinish() {
		this.scene.shaderType = SHADER_TYPE_BACKBUFFER
		this.scene.setInputRect(this.rect)
		this.scene.combineInputIntoSource(SHADER_TYPE_RECTANGLE)
	}
	
	// store in a format which allows to rebuild the needed information with less ressources
	bake() {
	}
	
	// rebuild
	rebuild() {
	}
}

class Mode_Draw_Circle extends DefaultMode {
	constructor(op_id, scene, x = 0, y = 0) {
		super(op_id, scene)
		
		this.startX = x
		this.startY = y
		
		this.rect = new Rect(x, y, 0, 0)
		
		this.unstopped = false
	}
	
	onSceneFocus(scene) {
		this.unstopped = true
		
		let fn = () => {
			if(!this.unstopped)
				return
			
			// keep center if alt button pressed
			if(this.modifiers & MODIFIER_ALT) {
				let offsetX = Math.abs(this.newX - this.startX)
				let offsetY = Math.abs(this.newY - this.startY)
				
				this.rect.w = offsetX*2
				this.rect.x = this.startX - offsetX
				
				this.rect.h = offsetY*2
				this.rect.y = this.startY - offsetY
			}
			else {
				this.rect.w = this.newX - this.rect.x
				this.rect.h = this.newY - this.rect.y
				
				this.rect.x = this.startX
				this.rect.y = this.startY
			}
			
			this.scene.shaderType = SHADER_TYPE_BACKBUFFER
			this.scene.setInputRect(this.rect)
			this.scene.renderWithInput(SHADER_TYPE_CIRCLE)
			
			requestAnimationFrame(fn)
		}
		
		requestAnimationFrame(fn)
	}
	
	onMousemove(x = 0, y = 0, scene, modifiers) {
		this.newX = x
		this.newY = y
		this.modifiers = modifiers
	}
	
	onMouseup(x = 0, y = 0, scene, modifiers) {
		this.unstopped = false
		
		this.rect.ensureFormat()
		this.scene.initUiRectUse(this, this.rect)
		this.onUiRectFinish()
	}
	
	onUiRectFinish() {
		this.scene.shaderType = SHADER_TYPE_BACKBUFFER
		this.scene.setInputRect(this.rect)
		this.scene.combineInputIntoSource(SHADER_TYPE_CIRCLE)
	}
	
	// store in a format which allows to rebuild the needed information with less ressources
	bake() {
	}
	
	// rebuild
	rebuild() {
	}
}

/* Shapes */


class Shape {
	
	constructor() {
	}
	
	isShape() {
		return true;
	}
	
	setCenterAt(x, y) {
		this.rect.x = x - parseInt(this.rect.w/2)
		this.rect.y = y - parseInt(this.rect.h/2)
	}
}


class Shape_Circle extends Shape {
	constructor(diameter = 1) {
		super()
		this.rect = new Rect(0, 0, diameter, diameter)
		
		this.data = new Uint8Array(diameter * diameter)
		
		for(let x = 0; x < diameter; x++)
			for(let y = 0; y < diameter; y++)
				this.data[x + y*diameter] = (Math.sqrt(x*x + y*y)) <= diameter? 255:0;
	}
}

class Shape_Quad extends Shape {
	constructor(d) {
		super()
		this.rect = new Rect(0, 0, d, d)
		this.data = new Uint8Array(d*d)
		
		for(let i of this.rect.iterate)
			this.data[i] = 255
	}
}

class UniColorTex {
	constructor(w = 0, h = 0) {
		this.data = new Uint8Array(w*h)
		this.dataType = "Uint8Array"
		this.rect = new Rect(0, 0, w, h)
		this.color = new Float32Array([0, 0.5, 1])
	}
	
	insertShape(shape) {
		for(let i of (new Rect(this.rect, shape.rect)).iterate(this.rect.w))
			this.data[i] = 255
	}
}

class GenShape extends Shape {
	constructor(diameter = 1) {
		super()
		this.rect = new Rect(0, 0, diameter, diameter)
		
		this.data = new Uint8Array(diameter * diameter)
		
		for(let x = 0; x < diameter; x++)
			for(let y = 0; y < diameter; y++)
				this.data[x + y*diameter] = (Math.sqrt(x*x + y*y)) <= diameter? 255:0;
	}
}

/**
	new Rect(rect) // copies another Rect-instance
	new Rect(rect1, rect2) // creates intersection rectangle based on two other rects
	new Rect(x, y, w, h) // creates a rectangle based on given dimensions
*/

class Rect {
	constructor(v1, v2, w = 0, h = 0) {
		// if rect is given
		if(v1 instanceof Rect) {
			// create intersection rectangle
			if(v2 instanceof Rect) {
				this.x = v1.x > v2.x? v1.x : v2.x
				this.y = v1.y > v2.y? v1.y : v2.y
				
				this.w = v1.w + v1.x < v2.w + v2.x? v1.w + v1.x - this.x: v2.w + v2.x - this.x
				this.h = v1.h + v1.y < v2.h + v2.y? v1.h + v1.y - this.y: v2.h + v2.y - this.y
			}
			else // copy properties
				Object.assign(v1, v2)
		}
		// create from given dimensions
		else {
			this.x = v1
			this.y = v2
			this.w = w
			this.h = h
		}
	}
	
	set(x = 0, y = 0, w = 1, h = 1) {
		this.x = x
		this.y = y
		this.w = w
		this.h = h
	}
	
	ensureFormat() {
		if(this.w < 0) {
			this.w = -this.w
			this.x = this.x - this.w
		}
		
		if(this.h < 0) {
			this.h = -this.h
			this.y = this.y - this.h
		}
	}
	
	* iterate(arrayBreak = this.w + this.x) {
		let i = arrayBreak * this.y + this.x
		
		for(let y = 0; y < this.h; y++) {
			for(let x = 0; x < this.w; x++)
				yield i + x
			
			i += arrayBreak
		}
	}
}

function rotateCanvas(iChange) {
	a_S.rotate(iChange)
}

var _profilerIds = {}
class Profiler {
	static init(key) {
		_profilerIds[key] = (new Date()).getTime()
	}
	
	static get(key) {
		return (new Date()).getTime() - _profilerIds[key]
	}
	
	static pop(key) {
		return console.log((new Date()).getTime() - _profilerIds[key])
	}
}

