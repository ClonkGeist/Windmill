const
	SHADER_TYPE_BACKBUFFER = 0, // obsolet?
	SHADER_TYPE_INPUT = 1,
	SHADER_TYPE_COMBINED_BACKBUFFER = 2, // obsolet?
	SHADER_TYPE_CIRCLE = 3,
	SHADER_TYPE_RECTANGLE = 4,
	SHADER_TYPE_COLORED_SHAPE = 5,
	SHADER_TYPE_SELECTION = 6

function composeShaderProgram(gl, type) {
	
	var [vertexShaderString, fragmentShaderString] = getShaderStrings(type)
	
	var vs = parseShader(gl, vertexShaderString, "x-shader/x-vertex", type)
	var fs = parseShader(gl, fragmentShaderString, "x-shader/x-fragment", type)
	
	var prog = gl.createProgram()
	gl.attachShader(prog, vs)
	gl.attachShader(prog, fs)
	gl.linkProgram(prog)
	
	// If creating the shader program failed, alert
	if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
		log("Unable to initialize the shader program.", false, "error")
	
	return prog
}

function getShaderStrings(type) {
	if(type === SHADER_TYPE_BACKBUFFER) {
		return [
"attribute vec2 pos;\n\
varying vec2 uv;\n\
attribute vec2 uUV;\n\
\
void main(void) {\n\
uv = uUV;\n\
	gl_Position = vec4(pos.x, pos.y, 0.0, 1.0);\n\
}\n"
,
"precision mediump float;\n\
\
uniform sampler2D img_source;\n\
\
varying vec2 uv;\n\
void main(void) {\n\
	gl_FragColor = texture2D(img_source, uv);\n\
}"
		]
	}
	else if(type === SHADER_TYPE_INPUT) {
		return [
"attribute vec2 pos;\n\
varying vec2 uv;\n\
attribute vec2 uUV;\n\
uniform vec4 rect;\n\
\
void main(void) {\n\
	uv = uUV;\n\
	gl_Position = vec4(\
			(pos[0] - 1.0) * rect[0] + (pos[0] + 1.0) * rect[2],\
			(pos[1] - 1.0) * rect[1] + (pos[1] + 1.0) * rect[3],\
			 0.0, 1.0);\n\
}\n"
,
"precision mediump float;\n\
\
uniform sampler2D img_input;\n\
\
varying vec2 uv;\n\
void main(void) {\n\
	gl_FragColor = texture2D(img_input, uv);\n\
}"
		]
	}
	else if(type === SHADER_TYPE_COLORED_SHAPE) {
		return [
"attribute vec2 pos;\n\
varying vec2 uv;\n\
attribute vec2 uUV;\n\
uniform vec4 rect;\n\
\
void main(void) {\n\
	uv = uUV;\n\
	gl_Position = vec4(\
			(pos[0] - 1.0) * rect[0] + (pos[0] + 1.0) * rect[2],\
			(pos[1] - 1.0) * rect[1] + (pos[1] + 1.0) * rect[3],\
			 0.0, 1.0);\n\
}\n"
,
"precision mediump float;\n\
\
uniform sampler2D img_brush;\n\
uniform vec3 worker_color;\n\
\
varying vec2 uv;\n\
void main(void) {\n\
	if(texture2D(img_brush, uv).a < 1.0)\n\
		discard;\n\
	gl_FragColor = vec4(worker_color, 1.0);\n\
}"
		]
	}
	else if(type === SHADER_TYPE_COMBINED_BACKBUFFER) {
		return [
"attribute vec2 pos;\n\
varying vec2 uv;\n\
attribute vec2 uUV;\n\
uniform mat2 mOrient;\n\
\
void main(void) {\n\
uv = uUV;\n\
	gl_Position = vec4(pos.x, pos.y, 0.0, 1.0);\n\
}\n"
,
"precision mediump float;\n\
\
uniform sampler2D img_source;\n\
uniform sampler2D img_worker;\n\
uniform vec3 worker_color;\n\
\
varying vec2 uv;\n\
void main(void) {\n\
	gl_FragColor = mix(texture2D(img_source, uv), vec4(worker_color, 1.0), texture2D(img_worker, uv).a);\n\
}"
		]
	}
	else if(type === SHADER_TYPE_CIRCLE) {
		return [
"attribute vec2 pos;\n\
varying vec2 uv;\n\
attribute vec2 uUV;\n\
uniform vec4 rect;\n\
\
void main(void) {\n\
	uv = uUV;\n\
	gl_Position = vec4(\
			(pos[0] - 1.0) * rect[0] + (pos[0] + 1.0) * rect[2],\
			(pos[1] - 1.0) * rect[1] + (pos[1] + 1.0) * rect[3],\
			 0.0, 1.0);\n\
}\n"
,
"precision mediump float;\n\
\
uniform sampler2D img_worker;\n\
uniform vec3 worker_color;\n\
\
varying vec2 uv;\n\
void main(void) {\n\
	if(distance(vec2(0.5, 0.5), uv) > 0.5)\n\
		discard;\n\
	gl_FragColor = vec4(worker_color, 1.0);\n\
}"
		]
	}
else if(type === SHADER_TYPE_RECTANGLE) {
		return [
"attribute vec2 pos;\n\
varying vec2 uv;\n\
attribute vec2 uUV;\n\
uniform vec4 rect;\n\
\
void main(void) {\n\
	uv = uUV;\n\
	gl_Position = vec4(\
			(pos[0] - 1.0) * rect[0] + (pos[0] + 1.0) * rect[2],\
			(pos[1] - 1.0) * rect[1] + (pos[1] + 1.0) * rect[3],\
			 0.0, 1.0);\n\
}\n"
,
"precision mediump float;\n\
\
uniform sampler2D img_worker;\n\
uniform vec3 worker_color;\n\
\
varying vec2 uv;\n\
void main(void) {\n\
	gl_FragColor = vec4(worker_color, 1.0);\n\
}"
		]
	}
else if(type === SHADER_TYPE_SELECTION) {
		return [
"attribute vec2 pos;\n\
varying vec2 uv;\n\
attribute vec2 uUV;\n\
\
void main(void) {\n\
	uv = uUV;\n\
	gl_Position = vec4(pos.x, pos.y, 0.0, 1.0);\n\
}\n"
,
"precision mediump float;\n\
\
uniform sampler2D img_sel;\n\
uniform vec2 textureSize;\n\
uniform float offset;\n\
\
varying vec2 uv;\n\
void main(void) {\n\
	vec2 pixelUnit = vec2(1.0, 1.0) / textureSize;\n\
	vec4 sum = 	texture2D(img_sel, uv + vec2( 0.0, -1.0) * pixelUnit)+\n\
				texture2D(img_sel, uv + vec2( 0.0,  1.0) * pixelUnit)+\n\
				texture2D(img_sel, uv + vec2(-1.0,  0.0) * pixelUnit)+\n\
				texture2D(img_sel, uv + vec2( 1.0,  0.0) * pixelUnit)+\n\
				texture2D(img_sel, uv) * -4.0;\n\
\n\
\n\
if(sum.a >= 0.0)\n\
	discard;\n\
\n\
	if(mod(uv.s + uv.t + offset, 0.02) < 0.01)\n\
		gl_FragColor = vec4(0.0, 0.0, 0.0, sum.a);\n\
	else\n\
		gl_FragColor = vec4(1.0, 1.0, 1.0, sum.a);\n\
}"
		]
	}
	else
		return ["", ""]
}

/**

	vec4 sum = 	texture2D(img_sel, uv * vec2(0, -1) * pixelUnit *  1.0)+\n\
				texture2D(img_sel, uv * vec2(0,  1) * pixelUnit *  1.0)+\n\
				texture2D(img_sel, uv * vec2(-1, 0) * pixelUnit *  1.0)+\n\
				texture2D(img_sel, uv * vec2( 1, 0) * pixelUnit *  1.0)+\n\
				texture2D(img_sel, uv               * -4.0);\n\

*/

function parseShader(gl, string, type, shaderInteralType) {
	
	var shader
	
	if (type == "x-shader/x-fragment")
		shader = gl.createShader(gl.FRAGMENT_SHADER)
	else if (type == "x-shader/x-vertex")
		shader = gl.createShader(gl.VERTEX_SHADER)
	else {
		log("Invalid shader type given")
		return false
	}
	
	gl.shaderSource(shader, string)
	gl.compileShader(shader)
	
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		log("An error occurred compiling the shaders ("+shaderInteralType+"): \n" + gl.getShaderInfoLog(shader), false, "error")
		return false
	}
	return shader
}