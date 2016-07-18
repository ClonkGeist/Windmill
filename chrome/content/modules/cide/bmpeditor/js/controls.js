class ModeHandler {
	constructor() {
		
	}
	get selected() {
		return sceneMeta[CM_ACTIVEID]._selectedMode || false
	}
	
	set selected(mode) {
		if(this.active)
			this.active.finish()
	
		if(mode == Mode_Draw_Shape)
			$(".canvas-dimension").addClass("brush-mode")
		else
			$(".canvas-dimension").removeClass("brush-mode")
	
		sceneMeta[CM_ACTIVEID]._selectedMode = mode
	}
	
	get active() {
		return sceneMeta[CM_ACTIVEID]._activeMode || false
	}
	
	set active(m) {
		sceneMeta[CM_ACTIVEID]._activeMode = m
	}
	
	get busy() {
		return sceneMeta[CM_ACTIVEID]._inMode
	}
	
	set busy(f) {
		sceneMeta[CM_ACTIVEID]._inMode = f
	}
	
	create(scene, x, y) {
		this.active = new this.selected(sceneMeta[CM_ACTIVEID]._operandIndex, scene, x, y)
		sceneMeta[CM_ACTIVEID]._operandIndex++
	}
}

var Mode = new ModeHandler()

const
	MODIFIER_CTRL = 1,
	MODIFIER_SHIFT = 2,
	MODIFIER_ALT = 4

function initCtrls() {
	
	$(".canvas-wrapper").mousedown(function(e) {
		if(e.which !== 1 || CM_ACTIVEID === -1 || !Mode.selected || cmw)
			return
		
		let rect = this.getBoundingClientRect()
		
		var x = e.clientX - rect.left,
			y = e.clientY - rect.top;
		
		Mode.busy = true
		
		var [x, y] = a_S.screenToTexture(x, y)
		
		Mode.create(a_S, x, y)
		Mode.active.onSceneFocus(a_S)
	})

	$("body").mousemove(function(e) {
		if(cmw || !Mode.busy)
			return
		
		let rect = $(".canvas-wrapper").get(0).getBoundingClientRect()
		
		var x = e.clientX - rect.left,
			y = e.clientY - rect.top;
		
		[x, y] = a_S.screenToTexture(x, y)
		Mode.active.onMousemove(x, y, a_S, getEventModifiers(e))
	})

	$("body").mouseup(function(e) {
		if(cmw || !Mode.busy || e.which !== 1)
			return
		
		let rect = $(".canvas-wrapper").get(0).getBoundingClientRect()
		
		var x = e.clientX - rect.left,
			y = e.clientY - rect.top;
		
		[x, y] = a_S.screenToTexture(x, y)
		Mode.active.onMouseup(x, y, a_S, getEventModifiers(e))
		
		Mode.busy = false
	})
	
	$(".ui-rect").mousedown((e) => {
		let r = a_S.currentRect
		log("mouse down")
		r.x = e.clientX - a_S.canvas.offsetLeft,
		r.y = e.clientY - a_S.canvas.offsetTop
		
		a_S.updateUiRectPos(r)
		
		e.stopPropagation()
	})
	
	$(".ui-thumb.top").mousedown((e) => {
		
	})
	
	$("#md_point").click(function() {
		Mode.selected = Mode_Draw_Shape
	})
	
	$("#md_rect").click(function() {
		Mode.selected = Mode_Draw_Rect
	})
	
	$("#md_circle").click(function() {
		Mode.selected = Mode_Draw_Circle
	})
	
	$("#md_getclr").click(function() {
		Mode.selected = Mode_Eyedropper
	})
	
	$("#md_selrect").click(function() {
		Mode.selected = Mode_Sel_Rect
	})
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
	finish()
	checkForAlternateRect()

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
	
	checkForAlternateRect() {
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
	}
}

class Mode_Eyedropper extends DefaultMode {
	onMouseup(x = 0, y = 0, scene, modifier) {
		selectColorIndex(CM_ACTIVEID,
			sceneMeta[CM_ACTIVEID].coloridx.indexOf(
				Array.prototype.byte2num.call(scene.readPixels(x, y, 1, 1).slice(0, 3).reverse())
			)
		)
	}
}
var drawTimeout

class Mode_Draw_Shape extends DefaultMode {
	
	constructor(op_id, scene, x, y) {
		super(op_id, scene)
		
		scene.uploadBrush()
		this.shape = new Shape(sceneMeta[CM_ACTIVEID].brushData.size)
		
		this.lastX = x
		this.lastY = y
		
		let color = getCurrentRGB(CM_ACTIVEID)
		if(color === null)
			this.color = new Float32Array([0, 0, 0])
		else {
			color[0] = color[0] / 255
			color[1] = color[1] / 255
			color[2] = color[2] / 255
			
			this.color = color
		}
		
		this.bounding = new Rect(this.shape.rect)
	}
	
	onSceneFocus(scene) {
		scene.setColorRGB(this.color)
	}
	
	onMousemove(x = 0, y = 0, scene, modifier) {
		
		if(drawTimeout)
			return
		
		if(modifier & MODIFIER_SHIFT)
			return
		
		this.scene.renderBrushLine(SHADER_TYPE_COLORED_SHAPE, this.lastX, this.lastY, x, y, this.shape)
		
		this.lastX = x
		this.lastY = y
		
		// drawTimeout = true
		drawTimeout = setTimeout(function() { drawTimeout = false; }, 10)
	}
	
	onMouseup(x = 0, y = 0, scene, modifier) {
		this.onMousemove(x, y, scene, 0)
		
		var ts = scene.getTextureStack()
		
		var state = ts.saveState()
		log("draw step state: " + state)
		let a = new Action(() => {log("state: " + state)
			ts.drawState(state, this.scene)
		})
		
		scene.manifestUndoStep(a)
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
			
			this.checkForAlternateRect()
			
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
			
			this.checkForAlternateRect()
			
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
}

/* Selection controls */


class Mode_Sel_Rect extends DefaultMode {
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
			
			this.checkForAlternateRect()
			
			$(".sel-r")
				.attr("x", this.rect.w < 0?this.rect.x + this.rect.w : this.rect.x)
				.attr("y", this.rect.h < 0?this.rect.y + this.rect.h : this.rect.y)
				.attr("width", Math.abs(this.rect.w))
				.attr("height", Math.abs(this.rect.h))
			
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
		
		// this.scene.selMask
	}
	
	finish() {
	}
}

/* Shapes */


class Shape {
	
	constructor(size = 1) {
		this.rect = new Rect(0, 0, size, size)
	}
	
	isShape() {
		return true
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

class Action {
	constructor(fnPerform) {
		this.fnPerf = fnPerform
	}
	
	perform() {
		this.fnPerf()
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



function svgPathFromMask(mask, w, h) {
	
	let h2 = h  -1
	let w2 = w  -1
	
	//let pointMask = new Uint8Array(w2*h2)
	let pointMask = mask
	
	let maskIndex, curr, below, right, pointIndex
	
	var startPoints = []
	
	for(let y = 0; y < h2; y++)
		for(let x = 0; x < w2; x++) {
			maskIndex = x + y*w
			
			curr = mask[maskIndex]
			below = mask[maskIndex + w]
			right = mask[maskIndex + 1]
									
			if(curr ^ right) {
				pointIndex = maskIndex - w
				pointMask[pointIndex] += DIR_DOWN
				
				if(pointMask[pointIndex] === DIR_BOTH)
					startPoints.push(pointIndex)
			}
			
			if(curr ^ below) {
				
				pointIndex = maskIndex - 1
				pointMask[pointIndex] += DIR_RIGHT
			}
			
			mask[maskIndex] = 0
		}
	
	var str = ""
	
	let start, x, y, max
	
	var getNext = function*(index) {
		let data = pointMask[index]
		while(data && data !== DIR_BOTH) {
			
			if(data === DIR_RIGHT) {
				index += 1
				yield "h 1 "
			}
			else {
				index += w
				yield "v 1 "
			}
			
			data = pointMask[index]
		}
	}
	
	for(let f = 0; f < startPoints.length; f++) {
		
		start = startPoints[f]
		
		// get coords
		y = Math.floor(start/w)
		x = start % w

		
		// add starting point (move to)
		str += "M" + x + " " + y + " "
		
		// follow outline to right
		str += "h 1 "
		for(let s of getNext(start + 1))
			str += s
		
		
				
		// add starting point (move to)
		str += "M" + x + " " + y + " "
		
		// follow outline to below
		
		str += "v 1 "
		for(let s of getNext(start + w))
			str += s
		
	}
	
	document.getElementById("sel-p1").setAttribute("d", str)
	document.getElementById("sel-p2").setAttribute("d", str)
	
	return pointMask
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
		return log((new Date()).getTime() - _profilerIds[key])
	}
}

