/**
 * The hand in the arch: a <video> of Hastas.mp4 drawn through a small WebGL
 * shader onto a canvas.
 *
 * WHY THE SHADER
 * --------------
 * The footage is the hand on a mid-grey studio backdrop. On a dark section the
 * arch shows the hand floating in a warm, lamp-lit niche, so the grey has to go:
 * the shader keys it out by chroma (the skin and the alta-red fingertips are
 * saturated, the backdrop is not) and removes the grey tint from the pixels at
 * the edge. On a light section the arch shows the footage as filmed, and the
 * `raw` uniform fades from the keyed hand to the untouched frame.
 *
 * Keying by distance from the backdrop's own grey was tried and rejected: the
 * backdrop has a horizontal vignette, so the left-edge sample is wrong across
 * the frame and the result was grey haze over the lower half of the arch.
 *
 * WHY A VIDEO, NOT FRAMES
 * -----------------------
 * The earlier arch scrubbed 324 stills (6 fps) from a 30 fps clip and looked
 * like stop-motion. The video is 1.8-2.1 MB, plays at its own frame rate, and
 * the stage eases the playhead toward the scroll position (HomeStage).
 *
 * The crop is 1558x2160 of the original 3840x2160, scaled to 720x998, which is
 * the arch's own aspect (see `--arch-ratio`).
 */

import { handShiftAtSeconds } from '@/lib/footage';

/** The hand sits high in the cropped footage; the arch's dome is narrow at the top. */
const SHIFT_DOWN = 0.07;

const VERTEX = `attribute vec2 p;varying vec2 uv;
void main(){uv=vec2(p.x*.5+.5,.5-p.y*.5-(${SHIFT_DOWN.toFixed(3)}));gl_Position=vec4(p,0.,1.);}`;

// Above the top of the footage there is only backdrop; mirror it so the first
// row is not smeared into streaks across the shifted-down area. `sx` moves the
// picture toward the far side of the hand (lib/footage.ts); past the arm's edge
// the clamp repeats the last column, which is the arm.
const FRAGMENT = `precision mediump float;varying vec2 uv;uniform sampler2D t;uniform float raw;uniform float sx;
void main(){
  vec2 u=vec2(clamp(uv.x+sx,0.,1.),abs(uv.y));
  vec3 c=texture2D(t,u).rgb;
  float ch=max(max(c.r,c.g),c.b)-min(min(c.r,c.g),c.b);
  float a=smoothstep(.133,.243,ch);
  vec3 g=texture2D(t,vec2(.03,clamp(u.y,0.,1.))).rgb;
  vec3 f=a<.98?clamp((c-(1.-a)*g)/max(a,.2),0.,1.):c;
  gl_FragColor=mix(vec4(f*a,a),vec4(c,1.),raw);
}`;

export type ArchVideo = {
  /** False when WebGL is unavailable: the caller shows the <video> itself. */
  ok: boolean;
  /** Redraw only if the video has moved on (or the canvas was resized). */
  draw: (force?: boolean) => void;
  /** 0 = keyed hand over the niche, 1 = the footage as filmed. */
  setRaw: (target: number, immediate?: boolean) => void;
  /** Advance the raw fade; true while it is still moving. */
  step: (dt: number) => boolean;
  dispose: () => void;
};

export function createArchVideo(canvas: HTMLCanvasElement, video: HTMLVideoElement): ArchVideo {
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false });
  if (!gl) return { ok: false, draw() {}, setRaw() {}, step: () => false, dispose() {} };

  const compile = (type: number, source: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, source);
    gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  };
  const vs = compile(gl.VERTEX_SHADER, VERTEX);
  const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT);
  const program = gl.createProgram();
  if (!vs || !fs || !program) return { ok: false, draw() {}, setRaw() {}, step: () => false, dispose() {} };
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    return { ok: false, draw() {}, setRaw() {}, step: () => false, dispose() {} };
  }
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'p');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  for (const k of [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T]) gl.texParameteri(gl.TEXTURE_2D, k, gl.CLAMP_TO_EDGE);
  for (const k of [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER]) gl.texParameteri(gl.TEXTURE_2D, k, gl.LINEAR);
  gl.clearColor(0, 0, 0, 0);
  const rawLocation = gl.getUniformLocation(program, 'raw');
  const shiftLocation = gl.getUniformLocation(program, 'sx');

  let raw = 0;
  let rawTarget = 0;
  let drawnAt = -1;

  const draw = (force = false) => {
    if (video.readyState < 2) return;
    if (!force && video.currentTime === drawnAt) return;
    drawnAt = video.currentTime;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1f(rawLocation, raw);
    gl.uniform1f(shiftLocation, handShiftAtSeconds(video.currentTime));
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  return {
    ok: true,
    draw,
    setRaw(target, immediate = false) {
      rawTarget = target;
      if (immediate) raw = target;
    },
    step(dt) {
      if (raw === rawTarget) return false;
      raw += (rawTarget - raw) * (1 - Math.exp(-dt * 4));
      if (Math.abs(rawTarget - raw) < 0.003) raw = rawTarget;
      draw(true);
      return raw !== rawTarget;
    },
    dispose() {
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
