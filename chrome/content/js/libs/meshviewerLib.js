/**
	TODO: to use less memory
	
	limit skinning palette matrices to 4v3s
*/

var _mv = new Meshviewer();

function RGBToClr(r, g, b) {
	return (255 << 24) | (r & 255) << 16 | (g & 255) << 8 | (b & 255);
}

function RGBaToClr(r, g, b, a) {
	return (a << 24) | (r & 255) << 16 | (g & 255) << 8 | (b & 255);
}

function ClrToRGBa(clr) {
	return {
		r: (clr >> 16 ) & 255,
		g: (clr >> 8 ) & 255,
		b: (clr ) & 255,
		a: (clr >> 24 ) & 255
	};
}

// shader composer - creates new shaders on the fly if needed
function composeShaderString(flags) {
	
	if(flags & SHADER_OPTION_TYPE) {
		
		var str = "";
		
		str += "attribute vec3 aVertexPosition;\n";
		
		if(flags & SHADER_OPTION_WIREFRAME)
			str += "attribute float barycentric;\n"+
				"varying vec3 vBC;\n";
		
		if(flags & (SHADER_OPTION_OVERLAY | SHADER_OPTION_TEXTURE))
			str += "varying vec2 uv;\n"+
					"attribute vec2 vUV;\n";
		
		if(flags & SHADER_OPTION_DIFFUSE_COLOR)
			str += "varying vec4 diffuse_color;\n"+
					"attribute vec4 vDiffuseColor;\n";
		
		if(flags & SHADER_OPTION_SKELETON) {
			var assignmentCounts = getMaxAssignmentsOfFlag(flags);
			for(let i = 0; i < assignmentCounts/4; i++) {
				str += "attribute vec4 boneWeights"+i+";\n";
				str += "attribute vec4 boneIndices"+i+";\n";
			}
			
			str += "uniform vec4 mBones[248];\n";
		}
		
		str += "uniform mat4 mWorld;\n";
		
		// <MAIN>
		str += "void main(void) {\n";
		
		if(flags & SHADER_OPTION_WIREFRAME) {
		str +=  "	if(barycentric == 0.0) {\n"+
				"		vBC = vec3(1, 0, 0); }\n"+
				"else if(barycentric == 1.0) {\n"+
				"		vBC = vec3(0, 1, 0); }\n"+
				"else {\n"+
				"		vBC = vec3(0, 0, 1); }\n";
		}
		
		if(flags & SHADER_OPTION_DIFFUSE_COLOR)
			str += "diffuse_color = vDiffuseColor;\n";
		
		if(flags & (SHADER_OPTION_OVERLAY | SHADER_OPTION_TEXTURE))
			str += "uv = vUV;\n";
				
		if(flags & SHADER_OPTION_SKELETON) {
			str += "vec4 pos = vec4(0.0);\n";
			
			str +=  "if(int(boneIndices0[0]) != -1) {\n";
			
			for(let assignmentGroupId = 0; assignmentGroupId < assignmentCounts/4; assignmentGroupId++) {
				let strIndices = "boneIndices"+assignmentGroupId,
					strWeights = "boneWeights"+assignmentGroupId;
				
				let assignmentsInGroup = assignmentCounts - 4*assignmentGroupId;
				if(assignmentsInGroup > 4)
					assignmentsInGroup = 4;
				
				for(let i = 0; i < assignmentsInGroup; i++) {
					let strIndex = assignmentGroupId + i === 0?"int index":"index";
					
					str += 	"	"+strIndex+" = (int("+strIndices+"["+i+"])) * 4;\n"+
							"	pos += mat4(mBones[index], mBones[index + 1], mBones[index + 2], mBones[index + 3])"+
							"* vec4(aVertexPosition, 1.0) * "+strWeights+"["+i+"];\n";
				}
			}
			str +=	"}\n"+
					"else {\n"+
					"	pos = vec4(aVertexPosition, 1.0);\n"+
					"}\n";
			
			str += "gl_Position = mWorld * pos;\n";
		}
		else
			str += "gl_Position = mWorld* vec4(aVertexPosition, 1.0);\n";
		
		str += "}"; // </MAIN>
		
		return str;
	}
	else {		// fragment shader
		var str = "precision mediump float;\n";
		
		if(flags & SHADER_OPTION_TEXTURE)
			str += "uniform sampler2D sampTexture;\n";
		
		if(flags & SHADER_OPTION_OVERLAY)
			str += "uniform sampler2D sampOverlay;\n"+
					"uniform vec3 overlayColor;\n";
		
		// uv coords are needed for any sort of texture/overlay
		if(flags & (SHADER_OPTION_OVERLAY | SHADER_OPTION_TEXTURE))
			str += "varying vec2 uv;\n";
		
		if(flags & SHADER_OPTION_DIFFUSE_COLOR)
			str += "varying vec4 diffuse_color;\n";
		
		// stolen func from the internet
		if(flags & SHADER_OPTION_WIREFRAME)
			str += "varying vec3 vBC;\n"+
			"#extension GL_OES_standard_derivatives : enable\n"+
			"float edgeFactor(){\n"+
				"vec3 d = fwidth(vBC);\n"+
				"vec3 a3 = smoothstep(vec3(0.0), d*1.02, vBC);\n"+
				"return min(min(a3.x, a3.y), a3.z);\n"+
			"}\n\n";
		
		str += "\
			void main(void) {\n";
		
		if(flags & SHADER_OPTION_TEXTURE_LOD)
			var fnTexture = "texture2DLodEXT";
		else
			var fnTexture = "texture2D";
		
		if(flags & SHADER_OPTION_OVERLAY) {
			str += "vec4 overlayTexel = "+fnTexture+"(sampOverlay, uv);\n";
			
			if(flags & SHADER_OPTION_TEXTURE)
				str += "vec4 textureTexel = "+fnTexture+"(sampTexture, uv);\n";
		}
				
		var fragInput;
		if(flags & SHADER_OPTION_TEXTURE) {
			if(flags & SHADER_OPTION_OVERLAY) {
				str += "vec4 overlay = vec4(overlayColor * overlayTexel.rgb, overlayTexel.a);";
				str += "float alpha0 = 1.0 - (1.0 - textureTexel.a) * (1.0 - overlay.a);";
			
				fragInput = "vec4(mix(textureTexel.rgb, overlay.rgb, overlay.a / alpha0), alpha0)";
				// fragInput = "vec4(mix(textureTexel.rgb, overlayTexel.rgb * overlayColor, overlayTexel.a), textureTexel.a)";
			}
			else
				fragInput = fnTexture+"( sampTexture, uv)";
		}
		else if(flags & SHADER_OPTION_OVERLAY) {
			if(flags & SHADER_OPTION_DIFFUSE_COLOR)
				fragInput = "mix(diffuse_color, vec4(overlayTexel.rgb * overlayColor, overlayTexel.a), overlayTexel.a)";
			else
				fragInput = "vec4(overlayTexel.rgb * overlayColor, overlayTexel.a)";
		}
		else if(flags & SHADER_OPTION_DIFFUSE_COLOR)
			fragInput = "diffuse_color";
		else // default color
			fragInput = "vec4(0.6, 0.6, 0.6, 1.0)";
		
		
		// compute frag color
		str += "gl_FragColor = ";
		
		if(flags & SHADER_OPTION_WIREFRAME)
			str += "mix(vec4(0.2, 0.2, 0.2, 1.0), "+fragInput+", edgeFactor() * 0.5 + 0.5);\n";
		else
			str += fragInput+";\n";
		
		/*
		if(flags & (SHADER_OPTION_OVERLAY | SHADER_OPTION_TEXTURE))
			str += "if(gl_FragColor.a < 0.95)\n"+
					"	discard;\n";
		*/
		
		return str + "}"; // close main()
	}
}

const
	SHADER_OPTION_WIREFRAME = 		1,
	SHADER_OPTION_OVERLAY = 		2,
	SHADER_OPTION_TEXTURE = 		4,
	SHADER_OPTION_SKELETON = 		8,
	SHADER_OPTION_TYPE = 	   	   16, // if set: vertexshader; otherwise: fragmentshader
	SHADER_OPTION_DIFFUSE_COLOR =  32,
	SHADER_OPTION_TEXTURE_LOD =	   64;

const 
	RENDER_CAUSE_RENDER_ONCE = 	0,
	RENDER_CAUSE_ANIMATION = 	1,
	RENDER_CAUSE_MOUSE = 		2,
	RENDER_CAUSE_MOVEMENT = 	2;

const
	RESOURCE_ERROR_INEXISTENT = 1,
	RESOURCE_ERROR_FAILED_TO_PARSE = 2;
	
const
	CLIPSACE_CONVERSION = 1; // 0.01;

function getMaxAssignmentsOfFlag(flags) {
	return (flags >> 8) & 15; // length
}

function setMaxAssignmentsOfFlag(flags, maxAssignments) {
	if(!maxAssignments)
		return false;
	
	return (flags | (maxAssignments << 8)); // offset
}


function Meshviewer() {
	
	var _ref = this;
	
	this.FSHADER = 1;
	this.VSHADER = 2;
	
	// secure existing tmp folder
	var f = _sc.file(_sc.profd+"/tmp");
	
	if(!f.exists() || !f.isDirectory())
		f.create(Ci.nsIFile.DIRECTORY_TYPE, 0o777);
	
	var ZOOM_FACTOR = 0.1;
	
	this._sessions = [];
	
	this.init = function(canvasEl) {
		
		var canvas = canvasEl,
			gl;
		
		try {
			gl = canvas.getContext("experimental-webgl");
		}
		catch(e) {
			log("WebGL doesn't work..., for reasons...");
		}
		
		if(!gl)
			return false;
		
		return _ref.addSession(canvas, gl);;
	}
	
	this.addSession = function(canvas, gl) {
		
		var id = _ref._sessions.length;
		_ref._sessions[id] = new _ref.session(id, canvas, gl);
		
		return _ref._sessions[id];
	}
	
	this.session = function(id, canvas, gl) {
		
		var _session = this;
		
		this.canvas = canvas;
		this.height = 600;
		this.width = 800;
			
		let onGlError = function (e, funcName, args) {
			RenderError(WebGLDebugUtils.glEnumToString(e) + " was caused by calling '" + funcName + "'\n" + showObj2(args, -1, {avoidErr: true}) +
				"\n" + _session.excertCallStack()
			);
			log(
				_sc.chpath + "/content/modules/cide/meshviewer/shader.txt",
				bumpFlags(_session.currentScene.currentRenderFlags) + "\n----------------\n" +
				composeShaderString(_session.currentScene.currentRenderFlags | SHADER_OPTION_TYPE) + "----------------\n" +
				composeShaderString(_session.currentScene.currentRenderFlags),
				true
			);
			_session.currentScene.stopRenderLoop();
		}
		
		this._callStack = new Array(10);
		this._currentCallStackIndex = 0;
		let glTraceCallstack = function(functionName, args) {
			_session._callStack[_session._currentCallStackIndex] = functionName + ":\n" + showObj2(args, 0, {avoidErr: true});
			_session._currentCallStackIndex = (_session._currentCallStackIndex + 1) % 10;
		}
		
		this.excertCallStack = function() {
			let s = "WebGl CallStack:\n";
			for(let i = 0; i < 10; i++)
				s += _session._callStack[(_session._currentCallStackIndex + i) % 10] + "\n";
			
			return s + "-callstack end-\n";
		}
		
		gl = WebGLDebugUtils.makeDebugContext(gl, onGlError, glTraceCallstack);
		
		this.gl = gl;
		/* gl setup */
		if(gl.getExtension('OES_standard_derivatives') !== null)
			this.extFlags = this.extFlags & SHADER_OPTION_WIREFRAME;
		
		if(gl.getExtension('GL_EXT_shader_texture_lod') !== null)
			this.extFlags = this.extFlags & SHADER_OPTION_TEXTURE_LOD;
		
		gl.enable(gl.DEPTH_TEST);
		gl.depthFunc(gl.LEQUAL);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		gl.enable(gl.BLEND);
		gl.disable(gl.DEPTH_TEST);
		
		gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
				
		this._id = id;
		this.currentScene;
		
		this._scenes = [];
		
		this.addScene = function() {
			var id = _session._scenes.length;
			this._scenes[id] = new this.scene(id);
			
			if(!this.currentScene)
				this._scenes[id].show();
				
			this._scenes[id]._sess = _session;
			
			return this._scenes[id];
		}
		
		this.removeScene = function(id) {
			_session._scenes[id] = null;
		}
		
		this.setOption = function(id, value) {
			if(!this.currentScene)
				return false;
			
			switch(id) {
				case "OVERLAY_COLOR":
					if(!this.currentScene)
						return false;
					
					this.currentScene.setOverlayColor(value);
				break;
				
				case "SHOW_WIREFRAME":
					if(value)
						this.currentScene.enableWireframe();
					else
						this.currentScene.disableWireframe();
				break;
				
				case "SHOW_BOUNDING_BOX":
				break;
			}
			
			this.currentScene.initRenderLoop(RENDER_CAUSE_RENDER_ONCE);
		}
		
		this._sprograms = [];
		this.activeProgram = false;
		
		this.setSize = function(x, y) {
			canvas.width = x;
			canvas.height = y;
			this.gl.viewport(0, 0, x, y);
			
			this.width = x;
			this.height = y;
			
			this.setViewportCorrection(x, y);
		}
		
		this.viewportCorrectionX = 1;
		this.viewportCorrectionY = 1;
		
		this.setViewportCorrection = function(w = 1, h = 1) {
			let d = w/h;
			
			if(d > 1) { // if screen is wider than high
				this.viewportCorrectionX = 1/d;
				this.viewportCorrectionY = 1;
			}
			else { // else screen is higher than wide
				this.viewportCorrectionX = 1;
				this.viewportCorrectionY = 1/d;
			}
		}
		
		this.setSize(this.width, this.height);
		
		this.loadTexture = function(src, mesh, key, matName) {
			var img = new Image();
			
			var tu;
			if(this.ontextureload)
				tu = this.ontextureload(mesh, key, src, img, matName);
			
			var _session = this;
			
			img.onload = function() {
				var texture = gl.createTexture();
				
				gl.bindTexture(gl.TEXTURE_2D, texture);
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
				gl.generateMipmap(gl.TEXTURE_2D);
				gl.bindTexture(gl.TEXTURE_2D, null);
				
				if(_session.ontextureloadsucces)
					_session.ontextureloadsucces(tu)
				
				mesh.setTexture(texture, key);
			};
			
			if(_session.ontextureloaderror)
				img.onerror = function(e) {
						_session.ontextureloaderror(tu)
				};
			
			img.src = encodeURI("file:" + src).replace(/#/g, "%23");
		}
		
		this.addShader = function(vs, fs, flags) {
			
			if(!vs || !fs)
				return log("Initializing Program failed, at least one (vertex- oder fragment-shader) hasn't been identified", 0, "error");
			
			var id = this._sprograms.length;
			
			this._sprograms[id] = new this.Shader(vs, fs, id, flags);
			
			return this._sprograms[id];
		}
		
		this.getShaderByFlags = function(searchFlags) {
			for(var id = 0; id < this._sprograms.length; id++)
				if(this._sprograms[id].flags == searchFlags)
					return this._sprograms[id];
			
			return false;
		}
		
		this.Shader = function(vs, fs, id, flags) {
		
			this.flags = flags;
			
			this.id = id;
			
			// insert into program
			this.program = _session.createShaderProgram(vs, fs);
			gl.useProgram(this.program);
			
			this.isShader = true;
						
			this.setAttrLocs = function() {
				if(this.attrBary)
					return;
				// attribute position
				this.attrPos = gl.getAttribLocation(this.program, "aVertexPosition");
				gl.enableVertexAttribArray(this.attrPos);
				
				// attribute wireframe
				this.attrBary = gl.getAttribLocation(this.program, "barycentric");
				if(this.attrBary != -1)
					gl.enableVertexAttribArray(this.attrBary);
				
				// attribute uv
				this.attrUV = gl.getAttribLocation(this.program, "vUV");
				
				if(this.attrUV != -1)
					gl.enableVertexAttribArray(this.attrUV);
				
				// attribute vDiffuseColor
				this.attrColor = gl.getAttribLocation(this.program, "vDiffuseColor");
				
				if(this.attrColor != -1)
					gl.enableVertexAttribArray(this.attrColor);
				
				// attribute boneIndices
				this.attrBIndices0 = gl.getAttribLocation(this.program, "boneIndices0");
				
				if(this.attrBIndices0 != -1)
					gl.enableVertexAttribArray(this.attrBIndices0);
				
				// attribute boneWeights
				this.attrBWeights0 = gl.getAttribLocation(this.program, "boneWeights0");
				
				if(this.attrBWeights0 != -1)
					gl.enableVertexAttribArray(this.attrBWeights0);
					
					// attribute boneIndices
				this.attrBIndices1 = gl.getAttribLocation(this.program, "boneIndices1");
				
				if(this.attrBIndices1 != -1)
					gl.enableVertexAttribArray(this.attrBIndices1);
				
				// attribute boneWeights
				this.attrBWeights1 = gl.getAttribLocation(this.program, "boneWeights1");
				
				if(this.attrBWeights1 != -1)
					gl.enableVertexAttribArray(this.attrBWeights1);
			}
		}
		
		this.createShaderByFlags = function(flags) {
			return this.addShader(
				this.parseShader(composeShaderString(flags | SHADER_OPTION_TYPE), _ref.VSHADER),
				this.parseShader(composeShaderString(flags), _ref.FSHADER),
				flags
			);
		}
		
		this.useShaderByFlags = function(flags) {
			var shader = this.getShaderByFlags(flags);
			
			if(!shader)
				shader = this.createShaderByFlags(flags);
			
			// on compiling error
			if(!shader)
				return false;
			
			gl.useProgram(shader.program);
			this.currentShader = shader;
			
			shader.setAttrLocs();
			
			return true;
		}
		
		this.useShader = function(shader) {
			if(!shader || !shader.isShader)
				return;
			
			gl.useProgram(shader.program);
			this.currentShader = shader;
			
			shader.setAttrLocs();
		}
		
		this.createShaderProgram = function(vs, fs) {

			// Create the shader program
			var prog = gl.createProgram();
			gl.attachShader(prog, vs);
			gl.attachShader(prog, fs);
			gl.linkProgram(prog);

			// If creating the shader program failed, alert
			if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
				log("Unable to initialize the shader program.");
			
			return prog;
		}
		
		this.parseShader = function(string, type) {
			
			var shader;
			
			if (type === 1)
				shader = gl.createShader(gl.FRAGMENT_SHADER);
			else if (type === 2)
				shader = gl.createShader(gl.VERTEX_SHADER);
			else// TODO: err msg
				return false;
			
			// set shader source
			gl.shaderSource(shader, string);
			
			// Compile the shader program
			gl.compileShader(shader);  
			
			// See if it compiled successfully
			if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
				RenderError("An error occurred compiling the shaders: \n" + gl.getShaderInfoLog(shader) + numberString(string));
				return false;  
			}
			return shader;
		}
		
		// pre compile most common shaders
		var flags = SHADER_OPTION_WIREFRAME;
		
		this.solidShader = this.addShader(
			this.parseShader(composeShaderString(flags | SHADER_OPTION_TYPE), _ref.VSHADER),
			this.parseShader(composeShaderString(flags), _ref.FSHADER),
			flags
		)
		
		flags = SHADER_OPTION_WIREFRAME | SHADER_OPTION_TEXTURE;
		
		this.textureShader = this.addShader(
			this.parseShader(composeShaderString(flags | SHADER_OPTION_TYPE), _ref.VSHADER),
			this.parseShader(composeShaderString(flags), _ref.FSHADER),
			flags
		)
		
		this.useShader(this.solidShader);
		
		this.getCurrentProgram = function() {
			return this.currentShader.program;
		}
		
		this.getCurrentShader = function() {
			return this.currentShader;
		}
		
		this.getCurrentScene = function() {
			return this.currentScene;
		}
		
		this.scene = function(id) {
			
			this.mouseControl = false;
			
			this.flags = SHADER_OPTION_WIREFRAME;
			
			this.zoomLevel = 0.8;
			this.zoomFactor = 0.64;
			
			this.trans_x = 0;
			this.trans_y = 0;
			this.id = id;
			
			this.gl = gl;
			
			this.overlayColor = [1, 0, 0];
			
			var _scene = this;
			this._meshes = [];
			
			this.renderCause = 0;
			
			this.initRenderLoop = function(iCause) {
				// if is already affected a cause for a render loop
				// add this cause
				if(this.renderCause && iCause)
					this.renderCause = this.renderCause | iCause;
				// init with this cause
				else if(iCause) {
					this.renderCause = iCause;
					var fn = function() {
						if(!_scene.renderCause)
							return;
						
						_scene.renderStep();
						window.requestAnimationFrame(fn);
					};
					
					window.requestAnimationFrame(fn);
				}
				// render once (giving no render cause is equivalent to RENDER_CAUSE_RENDER_ONCE
				else
					this.renderStep();
			}
				
			this.renderStep = function() {
						
				if(!_session.currentShader)
					return false;
				
				var currentShaderFlags = _session.currentShader.flags;
				
				// clear color and depth buffer
				//gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
				gl.enable(gl.DEPTH_TEST);
				
				gl.depthFunc(gl.LEQUAL);
				gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
				gl.enable(gl.BLEND);
				gl.disable(gl.DEPTH_TEST);
				gl.enable(gl.DEPTH_TEST);
				
				_scene.prepareBoneData();
				
				var combinationMask = SHADER_OPTION_SKELETON | SHADER_OPTION_TEXTURE_LOD;
				
				// draw each mesh
				for(var i in this._meshes) {
					
					for(var submeshIndex = 0; submeshIndex < this._meshes[i].submeshes.length; submeshIndex++) {
						
						var m = this._meshes[i].submeshes[submeshIndex];
						let combinedMask = ((m.flags | this.flags) & ~combinationMask) | (m.flags & this.flags);
						
						if(combinedMask !== currentShaderFlags) {this.currentRenderFlags = combinedMask;
							_session.useShaderByFlags(combinedMask);
							currentShaderFlags = m.flags
							
							// only for debugging, gets obsolete in stable
							this.currentRenderFlags = currentShaderFlags;
						}
						
						_scene.setMatrixUniforms();
						m.setUpForRenderProcess(combinedMask, _session.currentShader);
						gl.drawArrays(gl.TRIANGLES, 0, m.faceCount*3);
					}
				}
			}
			
			this.stopRenderLoop = function(iCause) {
				this.renderCause = this.renderCause & ~iCause;
			}
			
			this.interventRenderLoop = function() {
				this.renderCause = 0;
			}
			
			this.setOverlayColor = function(value) {
				this.overlayColor = [value[0]/255, value[1]/255, value[2]/255];
				this.initRenderLoop(RENDER_CAUSE_RENDER_ONCE);
			}
			
			this.setShader = function(shader) {
				this.shader = shader;
				
				if(this.isCurrentScene())
					_session.useShader(this.shader);
			}
			
			this.getShader = function() {
				return _session.getCurrentShader();
			}
			
			this.isCurrentScene = function() {
				
				if(_session.currentScene.id == this.id)
					return true;
				
				return false;
			}
			
			this.enableWireframe = function() {
				this.flags = this.flags | SHADER_OPTION_WIREFRAME;
			}
			
			this.disableWireframe = function() {
				this.flags = this.flags & ~SHADER_OPTION_WIREFRAME;
			}
			
			this.setSkeleton = function(skeleton) {
				this.setSkeletonCondition("skeletonGiven", true);
				
				if(typeof this.onskeletonset === "function")
					this.onskeletonset(skeleton, !!this.skeleton);
				
				this.skeleton = skeleton;
				
				this.initRenderLoop(RENDER_CAUSE_RENDER_ONCE);
			}
			
			this.getBoneMatrices = function() {
				if(!this.skeleton || !this.skeleton.isSkeleton)
					return mat4.create();
				
				var bonePalette = this.skeleton.getBoneTransformations(this.getAnimationTime()/1000),
					palette = [],
					l = bonePalette.length;
				
				for(var i = 0; i < l; i++) {
					palette.push.apply(palette, bonePalette[i]);
				}
				
				return palette;
			}
									
			this.setMatrixUniforms = function() {
				
				var prog = _session.getCurrentProgram();
				
				var loc = gl.getUniformLocation(prog, "mWorld");
				gl.uniformMatrix4fv(loc, false, new Float32Array(_scene.getWorldMatrix()));
				
				loc = gl.getUniformLocation(prog, "mBones");
				// this should never return null (product of wrong program assignments). fix this one day
				if(loc != -1 && loc != null)
					gl.uniform4fv(loc, this.recentBoneData);
			}
			
			this.recentBoneData = new Float32Array();
			
			this.prepareBoneData = function() {
				if(!(this.flags & SHADER_OPTION_SKELETON))
					return;
				
				this.recentBoneData = new Float32Array(this.getBoneMatrices());
			}
			
			this.getWorldMatrix = function() {
				
				var m = mat4.create(),
					t = mat4.create();
				
				var rot = quat.clone(this.qRot),
					cRot = quat.create();
				
				quat.rotateX(cRot, cRot, this.xRot);
				quat.rotateY(cRot, cRot, this.yRot);
				quat.normalize(cRot, cRot);
				
				quat.multiply(rot, cRot, rot);
				quat.multiply(rot, rot, this.qAxisSwap);
				
				mat4.fromRotationTranslation(t, rot, this.vTrans);
				
				mat4.scale(m ,m, [
					 -this.zoomFactor * _session.viewportCorrectionX, 
					 this.zoomFactor * _session.viewportCorrectionY,
					-this.zoomFactor
					]);
				mat4.multiply(m, m, t);
				
				var ortho = mat4.create();
				// with y-axis flipped so that 0 is at the top
				mat4.ortho(ortho, -1, 1, -1, 1, -5, 5);
				mat4.multiply(m, ortho, m);
				
				return m;
			}
			
			this.animTimeOffset = 0;
			this.animGlobalStartTime = 0;
			
			this.playsAnimation = false;
			this._anim;
			
			this.setAnimation = function(index) {
				
				this._anim = this.skeleton.setAnimation(index);
				
				this.animTimeOffset = 0;
				
				return this._anim;
			}
			
			this.setAnimationPosition = function(iPerc) {
				this.animTimeOffset = this._anim.length*10*iPerc; // /100*1000
				
				this.initRenderLoop(RENDER_CAUSE_RENDER_ONCE);
			}
			
			this.playAnimation = function() {
				this.animGlobalStartTime = (new Date()).getTime();
				this.playsAnimation = true;
				
				this.initRenderLoop(RENDER_CAUSE_ANIMATION);
			}
			
			this.pauseAnimation = function() {
				this.playsAnimation = false;
				
				this.animTimeOffset += (new Date()).getTime() - this.animGlobalStartTime;
				this.stopRenderLoop(RENDER_CAUSE_ANIMATION);
			}
			
			this.getAnimationTime = function() {
				if(this.playsAnimation)
					return this.animTimeOffset + (new Date()).getTime() - this.animGlobalStartTime;
				else
					return this.animTimeOffset;
			}
			
			this.getAnimationPosition = function() {
				var v = this.getAnimationTime();
				v /= 1000;
				
				if(v > this._anim.length)
					v = this._anim.length;
				
				return v/this._anim.length*100;
			}
			
			this.resetView = function() {
				quat.set(this.qRot, 0, 0, 0, 1);
				vec3.set(this.vTrans, 0, 0, 0);
				
				this.initRenderLoop(RENDER_CAUSE_RENDER_ONCE);
			}
			
			this.xRot = 0;
			this.yRot = 0;
			
			this.qRot = quat.create();
			this.vTrans = vec3.create();
			this.qAxisSwap = quat.create();
			
			// constants to convert from radiant to degree
			this.c_RtD = 180/Math.PI;
			this.c_DtR = Math.PI/180;
			
			quat.rotateY(this.qAxisSwap, this.qAxisSwap, 90*this.c_DtR);
			
			this.onViewRotation = function(x, y) {
				this.xRot = -y/100;
				this.yRot = x/100;
			}
			
			this.onViewRotationStop = function(x, y) {
				
				var qNewRot = quat.create();
				
				quat.rotateX(qNewRot, qNewRot, -y/100);
				quat.rotateY(qNewRot, qNewRot, x/100);
				
				quat.multiply(this.qRot, qNewRot, this.qRot);
				quat.normalize(this.qRot, this.qRot);
				
				this.xRot = 0;
				this.yRot = 0;
			}
			
			this.onViewTranslation = function(x, y) {
				
				let m = 2/this.zoomFactor;
				var transX = -x/canvas.width*m/_session.viewportCorrectionX,
					transY = -y/canvas.height*m/_session.viewportCorrectionY;
				
				vec3.add(this.vTrans, this.vTrans, vec3.fromValues(transX, transY, 0));
			}
			/**
			 *	function to get current transformation
			 *  in an in-game useable format
			 */
			this.getIngameTransformationFormat = function(precision = 10) {
				
				var strRot = "",
					strRotX = "";
					strRotY = "";
					strTrans = "";
				
				// rotation back to angle-axis representation
				var qx = this.qRot[0],
					qy = this.qRot[1],
					qz = this.qRot[2],
					qw = this.qRot[3];
				// if there is a rotation
				
				if(qw !== 0 && qw !== 1) {
					// to axis-angle representation
					var angle = 2 * Math.acos(qw);
					qw = Math.sqrt(1-qw*qw);
					var x = qx / qw;
					var y = qy / qw;
					var z = qz / qw;
					
					// Rotate_X/Y fromat
					var angleX = Math.acos(vec3.dot([0, 1, 0], [0, y, z])),
						angleY = Math.acos(vec3.dot([1, 0, 0], [x, 0, z]));
					
					angleX = Math.round(angleX*this.c_RtD);
					angleY = Math.round(angleY*this.c_RtD);
					
					strRotX = "Trans_Rotate("+angleX+", 1, 0, 0)";
					strRotY = "Trans_Rotate("+angleY+", 0, 1, 0)";
					
					// Rotate(angle, axis) format
					var smallest = 1;
					if(x !== 0)
						smallest = Math.abs(x);
					if(y !== 0 && Math.abs(y) < smallest)
						smallest = Math.abs(y);
					if(z !== 0 && Math.abs(z) < smallest)
						smallest = Math.abs(z);
					
					if(smallest > 0.1) {
						x /= smallest;
						y /= smallest;
						z /= smallest;
					}
					
					x = Math.round(x * precision);
					y = Math.round(y * precision);
					z = Math.round(z * precision);
					
					angle = Math.round(angle*this.c_RtD);
					
					strRot = "Trans_Rotate(" + angle + ", " + x + ", "+ y +", " + z + ")";
				}
				
				if(this.vTrans[0] || this.vTrans[1] || this.vTrans[2]) {
					var tx = this.vTrans[0],
						ty = this.vTrans[1],
						tz = this.vTrans[2];
					
					tx = parseInt(tx * 1000);
					ty = parseInt(ty * 1000);
					tz = parseInt(tz * 1000);
					
					strTrans = "Trans_Translate("+tx+", "+ty+", "+tz+")";
				}
				
				if(strRot.length && strTrans.length)
					return { 
						rotateAxis: "Trans_Mul("+strTrans+", "+strRot+")",
						rotateXY: "Trans_Mul("+strTrans+", "+strRotX+", "+strRotY+")",
					};
				else if(strRot.length)
					return { 
						rotateAxis: strRot,
						rotateXY: "Trans_Mul("+strRotX+", "+strRotY+")",
					};
				else if(strTrans.length)
					return strTrans;
				
				return false;
			};
			
			this.zoom = function(addend) {
				if(_scene.zoomLevel + addend < 0)
					return;
				
				_scene.zoomLevel += addend;
				_scene.zoomFactor = _scene.zoomLevel*_scene.zoomLevel;
			}
			
			this.show = function() {
			
				if(_session.currentScene)
					_session.currentScene.renderCause = 0;
				
				_session.currentScene = this;
				
				if(!this.shader)
					return;
				
				_session.useShader(this.shader);
				
				this.initRenderLoop(RENDER_CAUSE_RENDER_ONCE);
			}
			
			this.addMesh = function(path) {
				this.fpath = formatPath(path);
				var origDirPath = path.slice(0, -this.fpath.split("/").pop().length - 1);
				
				var targetFilePath = _sc.profd+"/tmp/meshviewer" + tmpFileIndex + ".xml";
				tmpFileIndex++;
				return new Promise(function(resolve, reject) {
					runXmlParser(path, targetFilePath, function() {
						_session.createMesh(_scene, targetFilePath, origDirPath).then(resolve, reject);
					});
				});
			}
			
			this.s_Cond = {};
			
			this.setSkeletonCondition = function(key, val) {
				if(arguments.length == 2) {
					this.s_Cond[key] = val;
					this.updateSkeletonCondition();
				}
				else if(arguments.length)
					return this.s_Cond[key];
				
				this.initRenderLoop(RENDER_CAUSE_RENDER_ONCE);
			}
			
			this.updateSkeletonCondition = function() {
				if(this.s_Cond.meshHasVertexAssignments && this.s_Cond.skeletonGiven)
					this.flags = this.flags | SHADER_OPTION_SKELETON;
				else
					this.flags = this.flags & ~SHADER_OPTION_SKELETON;
			}
			
			this.hasSkeletonRequirements = function() {
				return this.flags & SHADER_OPTION_SKELETON;
			}
			
			this.RenderReport = function() {
				this.maxVectors = gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS);
				this.vendor = gl.getParameter(gl.VENDOR);
				this.supportedExt = gl.getSupportedExtensions();
				
				var dbgRenderInfo = gl.getExtension("WEBGL_debug_renderer_info");
				if (dbgRenderInfo != null) {
					this.renderer = gl.getParameter(dbgRenderInfo.UNMASKED_RENDERER_WEBGL);
					this.unmaskedVendor   = gl.getParameter(dbgRenderInfo.UNMASKED_VENDOR_WEBGL);
				}
			}
			
			this.getRenderReport = function() {
				return new this.RenderReport();
			}
			
			
			this.useAsMatDef = function(file, materialName) {
			}
		} // close scene
		
		this._ctrl = {};
		
		// control stuff
		this.enableViewControls = function() {
			
			$(canvas).mousedown(function(e) {
				
				var activeScene = _session.getCurrentScene();
				if(!activeScene)
					return;
				// if already operating with the mouse
				else if(_session._ctrl.mouseControl != e.which && _session._ctrl.mouseControl)
					return;
				
				_session._ctrl.mouseControl = e.which;
				
				_session._ctrl.mousemoveOriginX = e.clientX;
				_session._ctrl.mousemoveOriginY = e.clientY;
				
				_session.getCurrentScene().initRenderLoop(RENDER_CAUSE_MOUSE);
			})
			
			$(canvas).mousemove(function(e) {
				var scene = _session.getCurrentScene();
				
				if(!scene || !_session._ctrl.mouseControl)
					return;
				
				if(_session._ctrl.mouseControl == 1)
					scene.onViewRotation(
						e.clientX - _session._ctrl.mousemoveOriginX, 
						e.clientY - _session._ctrl.mousemoveOriginY
					);
				else { // == 2
					scene.onViewTranslation(
						e.clientX - _session._ctrl.mousemoveOriginX, 
						e.clientY - _session._ctrl.mousemoveOriginY
					);
				
					_session._ctrl.mousemoveOriginX = e.clientX;
					_session._ctrl.mousemoveOriginY = e.clientY;
				}
			})
			
			$(canvas).mouseup(function (e) {
				
				if(!_session._ctrl.mouseControl)
					return;
				
				_session._ctrl.mouseControl = 0;
				_session.getCurrentScene().onViewRotationStop(
					e.clientX - _session._ctrl.mousemoveOriginX, 
					e.clientY - _session._ctrl.mousemoveOriginY
				);
				
				_session.getCurrentScene().stopRenderLoop(RENDER_CAUSE_MOUSE);
				_session.getCurrentScene().initRenderLoop(RENDER_CAUSE_RENDER_ONCE);
			})
			
			canvas.addEventListener("DOMMouseScroll", function(event) {
				var activeScene = _session.getCurrentScene();
				activeScene.zoom(event.detail > 0? -ZOOM_FACTOR : ZOOM_FACTOR);
				activeScene.initRenderLoop(RENDER_CAUSE_RENDER_ONCE);
			}, false);
		}
		
		// mesh stuff
		this.mesh = function(scene) {
			
			var _mesh = this;
			this._scene = scene;
			this.vertexAmount = 0;
			
			this.submeshes = [];
			
			this.createSubmesh = function() {
				var id = this.submeshes.length;
				this.submeshes[id] = new this.submesh(id);
				return this.submeshes[id];
			}
			
			var gl = scene.gl;
			
			this.submesh = function(id) {
				this.positionBuffer = gl.createBuffer();
				this.barycentricBuffer = gl.createBuffer();
				this.flags = 0;
				this.id = id;
				this.parentMesh = _mesh;
				
				this.setPositionBufferData = function(array, faceCount, box) {
					this.faceCount = faceCount;
					
					if(!(array instanceof Float32Array))
						array = new Float32Array(array);
					
					gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
					gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW);
					
					this.box = box;
				}
				
				this.setBarycentricBufferData = function(array) {
					if(!(array instanceof Float32Array))
						array = new Float32Array(array);
					
					gl.bindBuffer(gl.ARRAY_BUFFER, this.barycentricBuffer);
					gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW);
				}
				
				this.setUVBufferData = function(array) {
					if(!this.uvBuffer)
						this.uvBuffer = gl.createBuffer();
					
					if(!(array instanceof Float32Array))
						array = new Float32Array(array);
				
					gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
					gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW);
				}
				
				this.setDiffuseColorBufferData = function(array) {
					if(!this.colorBuffer)
						this.colorBuffer = gl.createBuffer();
					
					if(!(array instanceof Float32Array))
						array = new Float32Array(array);
				
					gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
					gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW);
					
					this.flags = this.flags | SHADER_OPTION_DIFFUSE_COLOR;
				}
				
				this.setVertexAssignments = function(buffer_Indices, buffer_Weights, maxAssignments) {
					
					if(!(buffer_Indices instanceof Float32Array))
						buffer_Indices = new Float32Array(buffer_Indices);
					
					if(!(buffer_Weights instanceof Float32Array))
						buffer_Weights = new Float32Array(buffer_Weights);
					
					if(!this.bWeightsBuffer)
						this.bWeightsBuffer = gl.createBuffer();
					
					gl.bindBuffer(gl.ARRAY_BUFFER, this.bWeightsBuffer);
					gl.bufferData(gl.ARRAY_BUFFER, buffer_Weights, gl.STATIC_DRAW);
					
					if(!this.bIndicesBuffer)
						this.bIndicesBuffer = gl.createBuffer();
					
					gl.bindBuffer(gl.ARRAY_BUFFER, this.bIndicesBuffer);
					gl.bufferData(gl.ARRAY_BUFFER, buffer_Indices, gl.STATIC_DRAW);
					this.flags = setMaxAssignmentsOfFlag(this.flags, maxAssignments);
					
					this.flags = this.flags | SHADER_OPTION_SKELETON;
				}
				
				this.reloadTexture = function(key, img) {
					gl.bindTexture(gl.TEXTURE_2D, this.getTexture(key));
					gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
					gl.bindTexture(gl.TEXTURE_2D, null);
				}
				
				this.setUpForRenderProcess = function(combinedFlags, shader) {
					
					gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
					gl.enableVertexAttribArray(shader.attrPos);
					gl.vertexAttribPointer(shader.attrPos, 3, gl.FLOAT, false, 0, 0);
					
					if(combinedFlags & SHADER_OPTION_WIREFRAME) {
						gl.bindBuffer(gl.ARRAY_BUFFER, this.barycentricBuffer);
						gl.enableVertexAttribArray(shader.attrBary);
						gl.vertexAttribPointer(shader.attrBary, 1, gl.FLOAT, false, 0, 0);
					}
					
					if(combinedFlags & SHADER_OPTION_DIFFUSE_COLOR) {
						gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
						gl.enableVertexAttribArray(shader.attrColor);
						gl.vertexAttribPointer(shader.attrColor, 4, gl.FLOAT, false, 0, 0);
					}
					
					if(combinedFlags & SHADER_OPTION_SKELETON) {
						var assignmentsCount = getMaxAssignmentsOfFlag(this.flags);
						if(assignmentsCount > 4) {
							var secondaryAssignments = assignmentsCount - 4;
							assignmentsCount = 4;
						}
						else
							var secondaryAssignments = 0;
						
						var stride = 4 * secondaryAssignments + 4 * assignmentsCount;
						
						gl.bindBuffer(gl.ARRAY_BUFFER, this.bWeightsBuffer);
						gl.enableVertexAttribArray(shader.attrBWeights0);
						gl.vertexAttribPointer(shader.attrBWeights0, assignmentsCount, gl.FLOAT, false, stride, 0);
						
						gl.bindBuffer(gl.ARRAY_BUFFER, this.bIndicesBuffer);
						gl.enableVertexAttribArray(shader.attrBIndices0);
						gl.vertexAttribPointer(shader.attrBIndices0, assignmentsCount, gl.FLOAT, false, stride, 0);
						
						if(secondaryAssignments) {
							gl.bindBuffer(gl.ARRAY_BUFFER, this.bWeightsBuffer);
							gl.enableVertexAttribArray(shader.attrBWeights1);
							gl.vertexAttribPointer(shader.attrBWeights1, secondaryAssignments, gl.FLOAT, false, stride, 0);
							
							gl.bindBuffer(gl.ARRAY_BUFFER, this.bIndicesBuffer);
							gl.enableVertexAttribArray(shader.attrBIndices1);
							gl.vertexAttribPointer(shader.attrBIndices1, secondaryAssignments, gl.FLOAT, false, stride, 0);
						}
					}
					
					if(!(combinedFlags & (SHADER_OPTION_TEXTURE | SHADER_OPTION_OVERLAY)))
						return;
					
					gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
					gl.enableVertexAttribArray(shader.attrUV);
					gl.vertexAttribPointer(shader.attrUV, 2, gl.FLOAT, false, 0, 0);
					
					var tId = 0;
					
					if(this.texTexture) {
						gl.activeTexture(gl.TEXTURE0);
						gl.bindTexture(gl.TEXTURE_2D, this.texTexture);
						gl.uniform1i(gl.getUniformLocation(shader.program, "sampTexture"), 0);
						
						tId = 1;
					}
					
					if(this.texOverlay) {
						// overlay texture
						gl.activeTexture(gl["TEXTURE" + tId]);
						gl.bindTexture(gl.TEXTURE_2D, this.texOverlay);
						gl.uniform1i(gl.getUniformLocation(shader.program, "sampOverlay"), tId);
						
						// overlay color
						var loc = gl.getUniformLocation(_session.getCurrentProgram(), "overlayColor");
						gl.uniform3fv(loc, new Float32Array(_mesh._scene.overlayColor));
					}
				}
				
				this.setTexture = function(texture, key) {
					if(key == "texture") {
						this.texTexture = texture;
						this.flags = this.flags | SHADER_OPTION_TEXTURE;
					}
					else if(key == "overlay") {
						this.texOverlay = texture;
						this.flags = this.flags | SHADER_OPTION_OVERLAY;
					}
					
					_mesh._scene.initRenderLoop(RENDER_CAUSE_RENDER_ONCE);
				}
				
				this.getTexture = function(key) {
					if(key === "overlay")
						return this.texOverlay;
					else
						return this.texTexture;
				}
			}
			
			this.queueMaterialFile = function(pathDir, mName, subMesh) {
				return Materials.get(mName, pathDir).then(function(mat) {
					
					if(_mesh._scene._sess.onmatload)
						_mesh._scene._sess.onmatload(mat, _mesh._scene.id, mName);
					
					if(!mat)
						return;
					
					var t_units =  mat.find("texture_unit");
					
					for(var i in t_units) {
						if(t_units[i].texture && t_units[i].texture.length)
							if(t_units[i].name == "Overlay")
								_mesh._scene._sess.loadTexture(pathDir + "/" + t_units[i].texture[0], subMesh, "overlay", mName);
							else
								_mesh._scene._sess.loadTexture(pathDir +"/"+ t_units[i].texture[0], subMesh, "texture", mName);
					}
				});
			}
			
		} // end of mesh object-declaration
		
		this.createMesh = function(targetScene, path, origDirPath) {
			let _this = this;
			return Task.spawn(function*() {
				let xml = yield OS.File.read(path, {encoding: "utf-8"});
				
				if(!xml) 
					return false;
				
				targetScene.setShader(_this.solidShader);
				
				var	dom = _ref.DOMParser.parseFromString(xml, "text/xml");
				
				var createVDataObject = function() {
					return vertexData = {
						uv: [],
						position: [],
						boneAssignments: [],
						color: [],
						box: {
							left: 0,
							right: 0,
							top: 0,
							bottom: 0,
							back: 0,
							front: 0,
							medianX: 0,
							medianY: 0,
							medianZ: 0
						},
						amount: 0,
						maxAssignments: 0,
						//normals = [],
					};
				}
				
				var parseVertices = function(element) {
					var vertexData = createVDataObject();
					
					var _box = vertexData.box;
					
					var elements;
					
					if(element.nodeName !== "vertexbuffer")
						elements = element.getElementsByTagName("vertexbuffer");
					else
						elements = [element];
					
					for(var bufferIndex = 0; bufferIndex < elements.length; bufferIndex++) {
						var vertexNodes = elements[bufferIndex].children;
						
						/** xml structure of a vertex node
						<vertex>
							<position x="-15.206469" y="-2.933670" z="-58.532657"/>
							<normal x="0.794744" y="-0.307238" z="0.523438"/>
							<texcoord u="0.742877" v="0.970355"/>
						</vertex>
						*/
						
						// iterate through each vertex, ...
						for(var v = 0; v < vertexNodes.length; v++) {
							// through each vertex property,...
							var v_attributes = vertexNodes[v].children;
							
							// through properties' attributes
							for(var s = 0; s < v_attributes.length; s++) {
								switch(v_attributes[s].nodeName) {
									case "position":
										
										// multiply with  0.01 to make roughly fitting our clipspace (-1 to 1)
										x = parseFloat(v_attributes[s].getAttribute("x")) * CLIPSACE_CONVERSION;
										y = parseFloat(v_attributes[s].getAttribute("y")) * CLIPSACE_CONVERSION;
										z = parseFloat(v_attributes[s].getAttribute("z")) * CLIPSACE_CONVERSION;
										
										vertexData.position.push(x);
										vertexData.position.push(y);
										vertexData.position.push(z);
										
										// check for most outer bound to generate bounding box
										if(x > _box.right)
											_box.right = x;
										else if(x < _box.left)
											_box.left = x;
										if(y > _box.top)
											_box.top = y;
										else if(y < _box.bottom)
											_box.bottom = y;
										if(z > _box.front)
											_box.front = z;
										else if(z < _box.back)
											_box.back = z;
										
										// check for the median according to the vertexdistribution
										_box.medianX += x;
										_box.medianY += y;
										_box.medianZ += z;									
									break;
									
									case "texcoord":
										vertexData.uv.push(parseFloat(v_attributes[s].getAttribute("u")));
										vertexData.uv.push(parseFloat(v_attributes[s].getAttribute("v")));
										
										// break loop || TODO: probably make more failsafe 
										// (compare texcoord index position with given attributes of the vertexbuffer
										s = v_attributes.length;
									break;
									
									case "colour_diffuse":
										vertexData.color.push.apply(vertexData.color, v_attributes[s].getAttribute("value").split(" "));
									break;
								}
							}
						} // end of vertex iteration
					}
					// generate median
					_box.medianX /= vertexData.position.length;
					_box.medianY /= vertexData.position.length;
					_box.medianZ /= vertexData.position.length;
					
					return vertexData;
				}
				
				var parseBoneAssignments = function(elAssignments, vDataObject) {
					var data = new Array(vDataObject.amount);
					
					let ass = elAssignments.children,
						l = ass.length,
						node,
						vIndex;
					
					var	maximumBonesPerVertex = 2;
					
					for(let i = 0; i < l; i++) {
						node = ass[i],
						vIndex = node.getAttribute("vertexindex");
						
						if(data[vIndex]) {
							data[vIndex].push(parseFloat(node.getAttribute("boneindex")));
							data[vIndex].push(parseFloat(node.getAttribute("weight")));
							
							if(data[vIndex].length > maximumBonesPerVertex) {
								maximumBonesPerVertex = data[vIndex].length;
							}
						}
						else
							data[vIndex] = [
								parseFloat(node.getAttribute("boneindex")),
								parseFloat(node.getAttribute("weight"))
							];
					}
					
					vDataObject.boneAssignments = data;
					vDataObject.maxAssignments = maximumBonesPerVertex / 2;
				}
							
				var mergeVertexData = function(data1, data2) {
					var data = createVDataObject();
					
					data.position = data1.position.concat(data2.position);
					data.uv = data1.uv.concat(data2.uv);
					data.boneAssignments = data1.boneAssignments.concat(data2.boneAssignments);
					
					data.maxAssignments = data1.maxAssignments > data2.maxAssignments?data1.maxAssignments:data2.maxAssignments;
					data.amount = data1.amount + data2.amount;
					
					data.box.left = data1.box.left<data2.box.left?data1.box.left:data2.box.left;
					data.box.right = data1.box.right>data2.box.right?data1.box.right:data2.box.right;
					data.box.top = data1.box.top<data2.box.top?data1.box.top:data2.box.top;
					data.box.bottom = data1.box.bottom>data2.box.bottom?data1.box.bottom:data2.box.bottom;
					data.box.front = data1.box.front<data2.box.front?data1.box.front:data2.box.front;
					data.box.back = data1.box.back>data2.box.back?data1.box.back:data2.box.back;
					
					if(data1.color.length && data2.color.length)
						data.color = data1.color.concat(data2.color);
					else if(data1.color.length)
						data.color = data1.color.concat(new Array(data2.amount*4));
					else if(data2.color.length)
						data.color = (new Array(data1.amount*4)).concat(data2.color);
					
					return data;
				}
				
				var node_Sharedgeometry = dom.getElementsByTagName("sharedgeometry")[0],
					sharedGeometry = false;
				
				if(node_Sharedgeometry)
					sharedGeometry = parseVertices(node_Sharedgeometry);
				
				let node_SharedAssignments = (function() {
					let children = dom.documentElement.children;
					for(var i = 0; i < children.length; i++)
						if(children[i].nodeName === "boneassignments")
							return children[i];
						
					return false;
				})();
				
				if(node_SharedAssignments)
					parseBoneAssignments(node_SharedAssignments, sharedGeometry);
				
				var submeshNodes = dom.getElementsByTagName("submeshes")[0].getElementsByTagName("submesh"),
					submeshIndex = 0;
				
				var mesh = new _this.mesh(targetScene);
				
				// check for skeleton
				var skeletonLink = dom.getElementsByTagName("skeletonlink")[0];
				
				// iterate each submeshname
				for(var submeshIndex = 0; submeshIndex < submeshNodes.length; submeshIndex++)
				{
					// create new mesh
					var _sub = mesh.createSubmesh();
					
					yield mesh.queueMaterialFile(origDirPath, submeshNodes[submeshIndex].getAttribute("material"), _sub);
					
					// parse vertex buffers
					var vData = parseVertices(submeshNodes[submeshIndex]);
					var boneAssignments;
					var useBoneAssignments = false,
						useDiffuseColor = false;
					
					// add bone assignments
					if(skeletonLink) {
						let boneAssignmentsNode = submeshNodes[submeshIndex].getElementsByTagName("boneassignments")[0];
						if(boneAssignmentsNode) {
							parseBoneAssignments(boneAssignmentsNode, vData);
							useBoneAssignments = true;
						}
					}
					
					if(submeshNodes[submeshIndex].getAttribute("usesharedvertices") === "true")
						vData = mergeVertexData(sharedGeometry, vData);
					
					if(vData.color.length)
						useDiffuseColor = true;
					
					/** --------------- FACE ITERATION */
					
					// ---	store face data	of each triangle	-----
					var faceNodes = submeshNodes[submeshIndex].getElementsByTagName("face");
					
					var buffer_Position = [],
						buffer_Barycentric = [],
						buffer_UV = [],
						buffer_boneWeights = [],
						buffer_boneIndices = [],
						buffer_Color = [];
					
					var gen = function* (a, max) {
						let cur = 0;
						max *= 2;
						let r = [,];
						if(a) {
							let d = 0;
							for(let i = 0; i < max; i += 2)
								d += a[1 + i] || 0;
							
							d = 1/d;
							let cur = 0;
							while(cur < max) {
								r[0] = typeof a[cur] === "undefined"?-1:a[cur];
								r[1] = a[cur + 1]*d || 0;
								yield r;
								cur += 2;
							}
						}
						else {
							while(cur < max) {
								r[0] = -1;
								r[1] = 0;
								yield r;
								cur += 2;
							}
						}
					}
					
					for(var f = 0; f < faceNodes.length; f++) {
					
						/** <face v1="0" v2="1" v3="2" */
						// use indices and save the triangle data
						for(var iAtr = 0; iAtr < faceNodes[f].attributes.length; iAtr++) {
							let vIndex = faceNodes[f].attributes[iAtr].value;
							let	uvIndex = faceNodes[f].attributes[iAtr].value * 2;
							
							buffer_UV[buffer_UV.length] = vData.uv[uvIndex    ] // u
							buffer_UV[buffer_UV.length] = vData.uv[uvIndex + 1] // v
							
							if(useBoneAssignments) {
								for(let a of gen(vData.boneAssignments[vIndex], vData.maxAssignments)) {
									let [index, weight] = a;
									buffer_boneIndices.push(index);
									buffer_boneWeights.push(weight);
								}
							}
													
							if(useDiffuseColor) {
								let colorIndex = vIndex * 4;
								buffer_Color[buffer_Color.length] = vData.color[colorIndex + 0] // r
								buffer_Color[buffer_Color.length] = vData.color[colorIndex + 1] // g
								buffer_Color[buffer_Color.length] = vData.color[colorIndex + 2] // b
								buffer_Color[buffer_Color.length] = vData.color[colorIndex + 3] // a
							}
							
							vIndex *= 3;
							// relative to coord listing
							
							buffer_Position[buffer_Position.length] = vData.position[vIndex    ] // x
							buffer_Position[buffer_Position.length] = vData.position[vIndex + 1] // y
							buffer_Position[buffer_Position.length] = vData.position[vIndex + 2] // z
						}
						
						// barycentric data
						// these will be used to indicate special vectors based on triangle-listing
						let bi = f*3;
						buffer_Barycentric[bi    ] = 0; // vec3(1, 0, 0)
						buffer_Barycentric[bi + 1] = 1; // vec3(0, 1, 0)
						buffer_Barycentric[bi + 2] = 2; // vec3(0, 0, 1)
					}
									
					var id = targetScene._meshes.length;
					targetScene._meshes[id] = mesh;
					
					// move data to gl context
					_sub.setPositionBufferData(buffer_Position, f, vData.box);
					_sub.setBarycentricBufferData(buffer_Barycentric);
					
					if(buffer_UV.length)
						_sub.setUVBufferData(buffer_UV, f);
					
					if(useDiffuseColor)
						_sub.setDiffuseColorBufferData(buffer_Color);
					
					if(useBoneAssignments) {
						_sub.setVertexAssignments(buffer_boneIndices, buffer_boneWeights, vData.maxAssignments);
						targetScene.setSkeletonCondition("meshHasVertexAssignments", true);
					}
				} // end mesh iteration
				
				if(skeletonLink) {
					
					var name = skeletonLink.getAttribute("name");
					
					if(_this.onskeletonasked)
						_this.onskeletonasked(name, targetScene.id);

					let skelpath = origDirPath + "/" + name;
					if(yield OS.File.exists(skelpath)) {
						var newFilePath = _sc.profd+"/tmp/meshviewer" + tmpFileIndex + ".xml";
						tmpFileIndex++;
						runXmlParser(skelpath, newFilePath, function() {
							parseSkeletonXml(newFilePath).then(function(skeleton) {
								targetScene.setSkeleton(skeleton);
							});
						});
					}
					else {
						if(_this.onskeletonloaderr)
							_this.onskeletonloaderr(RESOURCE_ERROR_INEXISTENT);
					}
				}
				targetScene.initRenderLoop(RENDER_CAUSE_RENDER_ONCE);
			});
		}
		
	} // close session
	
	this.DOMParser = new DOMParser();
}

function parseSkeletonXml(path) {
	return Task.spawn(function*() {
		let xml = yield OS.File.read(path, {encoding: "utf-8"});
		
		var sk = new MV_Skeleton();
		
		var dom = (new DOMParser()).parseFromString(xml, "text/xml");
		
		// parse bone-hierarchy
		var domBoneParents = dom.getElementsByTagName("bonehierarchy")[0],
			hierarchyRefs = {};
		
		if(domBoneParents) {
			domBoneParents = domBoneParents.getElementsByTagName("boneparent");
			
			for(let i = 0; i < domBoneParents.length; i++)
				hierarchyRefs[domBoneParents[i].getAttribute("bone")] = domBoneParents[i].getAttribute("parent");
		}
		
		// parse single bones
		var bones = [],
			boneCount = 0,
			boneNameToIdReference = [],
			aBoneInserted = [],
			sortedBones = [],
			sortedBoneCount = 0;
		
		var domBones = dom.getElementsByTagName("bone"),
			l = domBones.length;
		
		for(let i = 0; i < l; i++) {
			var name = domBones[i].getAttribute("name");
			boneNameToIdReference[name] = domBones[i].getAttribute("id");
			bones[i] = {
				"name": name,
				"origId": i,
			};
		}
		for(var i = 0; i < l; i++) {
			
			var domRot = domBones[i].getElementsByTagName("rotation")[0],
				domRotAxis = domRot.getElementsByTagName("axis")[0],
				domPos = domBones[i].getElementsByTagName("position")[0];
			
			// bone position
			var pos = vec3.clone([
				parseFloat(domPos.getAttribute("x")) * CLIPSACE_CONVERSION,
				parseFloat(domPos.getAttribute("y")) * CLIPSACE_CONVERSION,
				parseFloat(domPos.getAttribute("z")) * CLIPSACE_CONVERSION
			]);
			
			// bone orientation
			var q = quat.create();
			quat.setAxisAngle(q, [
				rx = parseFloat(domRotAxis.getAttribute("x")),
				ry = parseFloat(domRotAxis.getAttribute("y")),
				rz = parseFloat(domRotAxis.getAttribute("z"))
			], domRot.getAttribute("angle"));
			
			var mBone = mat4.create();
			mat4.fromQuat(mBone, mBone, q);
			mat4.fromRotationTranslation(mBone, q, pos)
			
			var boneName = domBones[i].getAttribute("name");
			
			// save bone id by name
			var id = domBones[i].getAttribute("id");
			boneNameToIdReference[boneName] = id;
			
			var parent = boneNameToIdReference[hierarchyRefs[boneName]];
			
			// apply parent bind pose and parent inverse
			if(parent == undefined) {
				sortedBones[sortedBones.length] = i;
				aBoneInserted[id] = true;
				sortedBoneCount++;
			}
			
			// save bone
			bones[id].bind = mBone;
			bones[id].local = mat4.clone(mBone);
			bones[id].inverse = mat4.create();
			mat4.invert(bones[id].inverse, mBone)
			bones[id].parent = parent;
		}
		
		// reorganize bone structure // from root to tail
		while(l > sortedBoneCount)
			for(let i = 0; i < l; i++)
				// if parent already in list, insert this bone too
				if(aBoneInserted[bones[i].parent] && !aBoneInserted[i]) {
					sortedBones[sortedBones.length] = i;
					aBoneInserted[i] = true;
					
					// apply parent inverse
					mat4.multiply(bones[i].bind, bones[bones[i].parent].bind, bones[i].bind);
					mat4.invert(bones[i].inverse, bones[i].bind);
					
					// loop ctrl
					sortedBoneCount++;
				}
				// else wait until parent gets listed
		
		// apply bone structure
		sk.setBones(bones, sortedBones);
		
		// parse animations
		var animNodes = dom.getElementsByTagName("animation"),
			l = animNodes.length,
			tracks,
			anim, iTrack, trackNodes, arTrack, 
			iKeyf, keyfNodes, keyfPos, keyfRot, keyfAxis;
		
		for(i = 0; i < l; i++) {
			anim = sk.addAnimation(
				animNodes[i].getAttribute("name"),
				animNodes[i].getAttribute("length")
			);
			
			trackNodes = animNodes[i].getElementsByTagName("track");
			tracks = {};
			
			for(iTrack = 0; iTrack < trackNodes.length; iTrack++) {
				
				// track data storage
				// add basic transformation (which is none) for keyframe at 0 time
				arKeyframes = [-1]; // -1: time of the first, extrapolated transformation
				
				// iterate through the keyframes of the track
				keyfNodes = trackNodes[iTrack].getElementsByTagName("keyframe");
				
				// extrapolate to left, to secure animation track for time of 0
				keyfPos = keyfNodes[0].getElementsByTagName("translate")[0];
				keyfRot = keyfNodes[0].getElementsByTagName("rotate")[0];
				keyfAxis = keyfRot.getElementsByTagName("axis")[0];
				
				angle = parseFloat(keyfRot.getAttribute("angle"));
				// translation as vec3
				arKeyframes.push(vec3.fromValues(
					keyfPos.getAttribute("x"),
					keyfPos.getAttribute("y"),
					keyfPos.getAttribute("z")
				));
				/**
					qx = ax * sin(angle/2)
					qy = ay * sin(angle/2)
					qz = az * sin(angle/2)
					qw = cos(angle/2)
				*/
				
				angle *= 0.5;
				var sin =  Math.sin(angle);
				
				arKeyframes.push(quat.fromValues(
					parseFloat(keyfAxis.getAttribute("x")) * sin,
					parseFloat(keyfAxis.getAttribute("y")) * sin,
					parseFloat(keyfAxis.getAttribute("z")) * sin,
					Math.cos(angle)
				));
				
				
				/** keyframe structure within track array:
				 * [0]: time (keyframe position in the timeline of the animation)
				 * [1]: vec3 translation
				 * [2]: quat4 rotation
				 **/
				for(iKeyf = 0; iKeyf < keyfNodes.length; iKeyf++) {
					
					keyfPos = keyfNodes[iKeyf].getElementsByTagName("translate")[0];
					keyfRot = keyfNodes[iKeyf].getElementsByTagName("rotate")[0];
					keyfAxis = keyfRot.getElementsByTagName("axis")[0];
					
					angle = parseFloat(keyfRot.getAttribute("angle"));
					
					// time
					arKeyframes.push(keyfNodes[iKeyf].getAttribute("time"));
					
					// translation as vec3
					arKeyframes.push(vec3.fromValues(
						keyfPos.getAttribute("x"),
						keyfPos.getAttribute("y"),
						keyfPos.getAttribute("z")
					));
					/**
						qx = ax * sin(angle/2)
						qy = ay * sin(angle/2)
						qz = az * sin(angle/2)
						qw = cos(angle/2)
					*/
					
					angle *= 0.5;
					var sin =  Math.sin(angle);
					
					arKeyframes.push(quat.fromValues(
						parseFloat(keyfAxis.getAttribute("x")) * sin,
						parseFloat(keyfAxis.getAttribute("y")) * sin,
						parseFloat(keyfAxis.getAttribute("z")) * sin,
						Math.cos(angle)
					));
				}
				
				tracks[parseInt(boneNameToIdReference[trackNodes[iTrack].getAttribute("bone")])] = arKeyframes;
			}
			anim.setTracks(tracks);
		}
		
		return sk;
	});
}

function MV_Skeleton() {
	
	this.bones = [];
	
	this.isSkeleton = true;
	this.boneAmount = 0;
	
	this.animations = [];
	this._a = -1;
	
	this.setAnimation = function(id = 0) {
	
		if(id === -1)
			this._a = -1;
		this._a = this.animations[id];
		
		return this._a;
	}
	
	this.getBoneTransformations = function(time) {
		
		if(this._a === -1) {
			var r = [];
			for(var i = 0; i < this.boneAmount; i++)
				r[i] = mat4.create();
			
			return r;
		}
		
		var tracks = this._a.getTracks(),
			result = [],
			mTransformation,
			parentBindNTrans = {};
		
		if(time > this._a.length)
			time = this._a.length;
				
		// iterate through bones
		for(var iList = 0; iList < this.boneAmount; iList++) {
			
			var iBone = this.sortedBones[iList],
				bone = this.bones[iBone];
			
			// get animations tracks
			var trackData = tracks[iBone];
			
			mTransformation = mat4.create();
			
			// if track for this bone exists
			// TODO: Make much more progressive (don't iterate through all keyframes each render step, smarten it
			if(trackData) {
				var l = trackData.length,
					last = -1;
				
				// calculate current keyframe transformation, if any
				for(let i = 0; i < l; i += 3) {
					// iterate to the right anim set/keyframeset
					if(trackData[i] >= time) {
						
						// calculate animation weight depending on the given time value
						var t = 1 - (time - trackData[last]) /( trackData[i] - trackData[last]);
						
						var rot = quat.create(),
							trans = vec3.create();
						
						vec3.lerp(trans, trackData[i + 1], trackData[last + 1], t);
						quat.slerp(rot, trackData[i + 2], trackData[last + 2], t);
						
						mat4.fromRotationTranslation(mTransformation, rot, trans);
						break;
					}
					else						
						last = i;
				} // <<end of keyframe iteration
			}
			
			mat4.multiply(mTransformation, bone.local, mTransformation);
			
			if(bone.parent != undefined)
				mat4.multiply(mTransformation, parentBindNTrans[bone.parent], mTransformation);
			
			parentBindNTrans[iBone] = mat4.clone(mTransformation);
			
			var inv = mat4.clone(bone.inverse);
			mat4.multiply(mTransformation, mTransformation, inv);
			
			result[bone.origId] = mTransformation;
			
		} // <<end of bone iteration
		
		return result;
	}
	
	this.setBones = function(mBones, aSortedBonesIds) {
		if(mBones && mBones.length) {
			this.bones = mBones;
			this.boneAmount = mBones.length;
			
			this.sortedBones = aSortedBonesIds;
		}
	}
	
	this.addAnimation = function(name, length) {
		var id = this.animations.length;
		
		this.animations[id] = new this.MV_Animation(name, length, id);
		
		return this.animations[id];
	}
	
	this.MV_Animation = function(name, length, id) {
		
		this.name = name;
		this.length = length;
		this.id = id;
		
		this.setTracks = function(tracks) {
			for(var i in tracks)
				return this.tracks = tracks;
			
			return false;
		}
		
		this.getTracks = function() {
			return this.tracks;
		}
	}
}

var tmpFileIndex = 0;

function runXmlParser(filePath, targetFilePath, fnOnFinish) {
	/*var name = "OgreXMLConverter";
	if(OS_TARGET == "WINNT")
		name = "OgreXMLConverter.exe";

	var converter = _sc.file(_sc.chpath + "/content/modules/cide/meshviewer/" + name);

	if(!converter.exists() || !converter.isExecutable())
		return warn("$err_group_not_found$");
*/
	if(OS_TARGET == "WINNT") {
		filePath = formatPath(filePath).replace(/\//g, "\\");
		targetFilePath = formatPath(targetFilePath).replace(/\//g, "\\");
	}
	getAppById("ogrexmlcnv").create([filePath, targetFilePath], 0x00000001, fnOnFinish, function(data) {
		log(data);
	});
}

var RENDER_REPORT_PRINTED = false;

function RenderError(string) {
	if(RENDER_REPORT_PRINTED)
		var o = {};
	else {
		var o = _mv._sessions[0].getCurrentScene().getRenderReport();
		RENDER_REPORT_PRINTED = true;
	}
	if(!Object.keys(o).length)
		log(string);
	else {
		o.errorMessage = string;
		log(o);
	}
}

function numberString(str) {
	var i = 0;
	var s = str.replace(/(\r\n|\n|\r)/g, function(match) {
		i++;
		return match + i +": ";
	});
	
	return "\n0: " + s;
}

function bumpFlags(flags) {
	var str = "";
	
	while(flags) {
		str = (flags & 1?"1":"0") + str;
		flags = flags >> 1;
	}
	
	return str;
}

// coding space