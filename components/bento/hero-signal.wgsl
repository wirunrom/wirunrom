struct Params {
  time: f32,
  aspect: f32,
  pointer: vec2f,
  paper: f32,
  motion: f32,
  energy: f32,
}

@group(0) @binding(0) var<uniform> params: Params;

fn hash21(p: vec2f) -> f32 {
  let q = fract(p * vec2f(123.34, 456.21));
  return fract(q.x * q.y * (q.x + q.y + 45.32));
}

fn sdSegment(p: vec2f, a: vec2f, b: vec2f) -> f32 {
  let ab = b - a;
  let h = clamp(dot(p - a, ab) / max(dot(ab, ab), 0.0001), 0.0, 1.0);
  return length(p - (a + ab * h));
}

fn glyphW(p: vec2f) -> f32 {
  var d = sdSegment(p, vec2f(-0.44, -0.5), vec2f(-0.24, 0.5));
  d = min(d, sdSegment(p, vec2f(-0.24, 0.5), vec2f(0.0, 0.04)));
  d = min(d, sdSegment(p, vec2f(0.0, 0.04), vec2f(0.24, 0.5)));
  return min(d, sdSegment(p, vec2f(0.24, 0.5), vec2f(0.44, -0.5)));
}

fn glyphI(p: vec2f) -> f32 {
  var d = sdSegment(p, vec2f(-0.36, -0.5), vec2f(0.36, -0.5));
  d = min(d, sdSegment(p, vec2f(0.0, -0.5), vec2f(0.0, 0.5)));
  return min(d, sdSegment(p, vec2f(-0.36, 0.5), vec2f(0.36, 0.5)));
}

fn glyphR(p: vec2f) -> f32 {
  var d = sdSegment(p, vec2f(-0.4, 0.5), vec2f(-0.4, -0.5));
  d = min(d, sdSegment(p, vec2f(-0.4, -0.5), vec2f(0.2, -0.5)));
  d = min(d, sdSegment(p, vec2f(0.2, -0.5), vec2f(0.42, -0.3)));
  d = min(d, sdSegment(p, vec2f(0.42, -0.3), vec2f(0.2, 0.0)));
  d = min(d, sdSegment(p, vec2f(0.2, 0.0), vec2f(-0.4, 0.0)));
  return min(d, sdSegment(p, vec2f(0.02, 0.0), vec2f(0.45, 0.5)));
}

fn glyphU(p: vec2f) -> f32 {
  var d = sdSegment(p, vec2f(-0.4, -0.5), vec2f(-0.4, 0.3));
  d = min(d, sdSegment(p, vec2f(-0.4, 0.3), vec2f(-0.18, 0.5)));
  d = min(d, sdSegment(p, vec2f(-0.18, 0.5), vec2f(0.18, 0.5)));
  d = min(d, sdSegment(p, vec2f(0.18, 0.5), vec2f(0.4, 0.3)));
  return min(d, sdSegment(p, vec2f(0.4, 0.3), vec2f(0.4, -0.5)));
}

fn glyphN(p: vec2f) -> f32 {
  var d = sdSegment(p, vec2f(-0.4, 0.5), vec2f(-0.4, -0.5));
  d = min(d, sdSegment(p, vec2f(-0.4, -0.5), vec2f(0.4, 0.5)));
  return min(d, sdSegment(p, vec2f(0.4, 0.5), vec2f(0.4, -0.5)));
}

fn glyphO(p: vec2f) -> f32 {
  var d = sdSegment(p, vec2f(-0.22, -0.5), vec2f(0.22, -0.5));
  d = min(d, sdSegment(p, vec2f(0.22, -0.5), vec2f(0.42, -0.28)));
  d = min(d, sdSegment(p, vec2f(0.42, -0.28), vec2f(0.42, 0.28)));
  d = min(d, sdSegment(p, vec2f(0.42, 0.28), vec2f(0.22, 0.5)));
  d = min(d, sdSegment(p, vec2f(0.22, 0.5), vec2f(-0.22, 0.5)));
  d = min(d, sdSegment(p, vec2f(-0.22, 0.5), vec2f(-0.42, 0.28)));
  d = min(d, sdSegment(p, vec2f(-0.42, 0.28), vec2f(-0.42, -0.28)));
  return min(d, sdSegment(p, vec2f(-0.42, -0.28), vec2f(-0.22, -0.5)));
}

fn glyphM(p: vec2f) -> f32 {
  var d = sdSegment(p, vec2f(-0.44, 0.5), vec2f(-0.44, -0.5));
  d = min(d, sdSegment(p, vec2f(-0.44, -0.5), vec2f(0.0, 0.06)));
  d = min(d, sdSegment(p, vec2f(0.0, 0.06), vec2f(0.44, -0.5)));
  return min(d, sdSegment(p, vec2f(0.44, -0.5), vec2f(0.44, 0.5)));
}

fn glyphDistance(p: vec2f, aspect: f32) -> f32 {
  let wordWidth = aspect * 0.88;
  let pitch = wordWidth / 8.0;
  let glyphHeight = min(0.18, pitch * 1.38);
  let glyphWidth = pitch * 0.72;
  let wordLeft = -wordWidth * 0.5;
  let glyphIndex = i32(floor((p.x - wordLeft) / pitch));
  let centerX = wordLeft + (f32(glyphIndex) + 0.5) * pitch;
  // Wide, short mobile cells need the wordmark above center so it never
  // collides with the descriptive copy below it.
  let centerY = select(0.0, -0.105, aspect > 1.45);
  let local = vec2f((p.x - centerX) / glyphWidth, (p.y - centerY) / glyphHeight);

  var d = 10.0;
  if (glyphIndex == 0) { d = glyphW(local); }
  if (glyphIndex == 1) { d = glyphI(local); }
  if (glyphIndex == 2 || glyphIndex == 5) { d = glyphR(local); }
  if (glyphIndex == 3) { d = glyphU(local); }
  if (glyphIndex == 4) { d = glyphN(local); }
  if (glyphIndex == 6) { d = glyphO(local); }
  if (glyphIndex == 7) { d = glyphM(local); }
  if (glyphIndex < 0 || glyphIndex > 7) { d = 10.0; }

  return d * min(glyphWidth, glyphHeight);
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let scale = vec2f(params.aspect, 1.0);
  let p = (uv - 0.5) * scale;
  let pointer = (params.pointer - 0.5) * scale;
  let ink = mix(vec3f(0.94, 0.95, 0.91), vec3f(0.08, 0.075, 0.065), params.paper);
  let quiet = mix(vec3f(0.36, 0.37, 0.34), vec3f(0.42, 0.40, 0.36), params.paper);
  let grain = hash21(floor(uv * vec2f(1181.0, 787.0))) - 0.5;

  let band = floor(uv.y * 13.0);
  let bandUv = fract(uv.y * 13.0);
  let focus = (params.pointer.x - 0.5) * params.energy;
  let fold = sin(band * 2.15 + params.time * 0.32 * params.motion) * 0.012;
  let offset = (f32(i32(band) % 2) - 0.5) * focus * 0.09 + fold;
  let dFront = glyphDistance(p + vec2f(offset, 0.0), params.aspect);
  let dSide = glyphDistance(p + vec2f(offset + 0.018 * sign(focus + 0.001), 0.0), params.aspect);
  let aa = max(fwidth(dFront), 0.0008);
  let front = 1.0 - smoothstep(0.012 - aa, 0.012 + aa, dFront);
  let side = (1.0 - smoothstep(0.018, 0.023, dSide)) * (1.0 - front);
  let seam = (1.0 - smoothstep(0.012, 0.028, abs(bandUv - 0.5))) * 0.1;
  let signalOrange = mix(vec3f(1.0, 0.39, 0.08), vec3f(0.78, 0.24, 0.03), params.paper);
  let color = ink * front + signalOrange * side + quiet * seam;
  let alpha = clamp(front * 0.98 + side * 0.9 + seam, 0.0, 0.98);
  return vec4f(max(color + grain * 0.01, vec3f(0.0)) * alpha, alpha);
}
