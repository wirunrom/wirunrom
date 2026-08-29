struct Params {
  time: f32,
  aspect: f32,
  pointer: vec2f,
  paper: f32,
  energy: f32,
  kind: f32,
}

@group(0) @binding(0) var<uniform> params: Params;

fn hash21(p: vec2f) -> f32 {
  let q = fract(p * vec2f(123.34, 456.21));
  return fract(q.x * q.y * (q.x + q.y + 45.32));
}

fn sdBox(p: vec2f, b: vec2f) -> f32 {
  let d = abs(p) - b;
  return length(max(d, vec2f(0.0))) + min(max(d.x, d.y), 0.0);
}

fn sdSegment(p: vec2f, a: vec2f, b: vec2f) -> f32 {
  let pa = p - a;
  let ba = b - a;
  let h = clamp(dot(pa, ba) / max(dot(ba, ba), 0.0001), 0.0, 1.0);
  return length(pa - ba * h);
}

fn lineMask(distance: f32, width: f32) -> f32 {
  let aa = max(fwidth(distance), 0.0006);
  return 1.0 - smoothstep(width - aa, width + aa, distance);
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let p = vec2f((uv.x - 0.5) * params.aspect, uv.y - 0.5);
  let pointer = vec2f((params.pointer.x - 0.5) * params.aspect, params.pointer.y - 0.5);
  let cursorField = exp(-length(p - pointer) * 5.5) * params.energy;
  let signalOrange = vec3f(1.0, 0.39, 0.08);
  let cream = vec3f(0.96, 0.92, 0.84);
  let darkInk = vec3f(0.055, 0.038, 0.025);
  let paperInk = vec3f(0.12, 0.09, 0.07);
  var color = vec3f(0.0);
  var alpha = 0.0;

  // ORDER THROUGHPUT — thousands of tiny receipt slips moving in lanes.
  if (params.kind < 0.5) {
    let laneCount = 13.0;
    let lane = floor(uv.y * laneCount);
    let speed = 0.025 + hash21(vec2f(lane, 7.0)) * 0.035;
    let flowX = fract(uv.x + params.time * speed + lane * 0.071);
    let columns = 18.0;
    let cell = vec2f(fract(flowX * columns) - 0.5, fract(uv.y * laneCount) - 0.5);
    let cellId = vec2f(floor(flowX * columns), lane);
    let alive = step(0.34, hash21(cellId + floor(params.time * speed) * 3.0));
    let bend = cursorField * (params.pointer.y - uv.y) * 0.7;
    let slip = lineMask(sdBox(cell + vec2f(0.0, bend), vec2f(0.25, 0.13)), 0.035) * alive;
    let tally = lineMask(abs(fract((uv.x + params.time * 0.045) * 9.0) - 0.5), 0.025);
    let laneLine = lineMask(abs(fract(uv.y * laneCount) - 0.5), 0.01) * 0.28;
    let sweep = pow(max(0.0, sin((flowX * 2.0 - uv.y) * 6.283)), 18.0);
    let contentGuard = 0.16 + smoothstep(0.5, 0.78, uv.x) * 0.84;
    let mark = (slip * (0.34 + cursorField * 0.52) + laneLine + tally * sweep * 0.24) * contentGuard;
    color = mix(darkInk, signalOrange, 0.24 + cursorField * 0.46) * mark;
    alpha = clamp(mark, 0.0, 0.78);
  }

  // FORECAST — observed ledger lines turn into widening future bands.
  if (params.kind > 0.5 && params.kind < 1.5) {
    let horizon = smoothstep(0.24, 0.86, uv.x);
    var graph = 0.0;
    for (var i = 0; i < 5; i += 1) {
      let fi = f32(i);
      let baseline = 0.22 + fi * 0.135;
      let wave = sin(uv.x * (5.0 + fi) + params.time * 0.28 + fi * 1.7) * (0.012 + horizon * 0.028);
      let projection = baseline + wave + (uv.x - 0.5) * (fi - 2.0) * 0.018;
      graph += lineMask(abs(uv.y - projection), 0.0025 + cursorField * 0.002);
    }
    let yearBand = lineMask(abs(fract(uv.x * 8.0) - 0.5), 0.012) * horizon * 0.24;
    let reveal = 0.28 + horizon * 0.3 + cursorField * 0.5;
    let mark = graph * reveal + yearBand;
    let forecastInk = mix(cream, paperInk, params.paper);
    color = mix(forecastInk, signalOrange, horizon * 0.7 + cursorField * 0.3) * mark;
    alpha = clamp(mark, 0.0, 0.76);
  }

  // EXPERIENCE — four timelines stream toward the present.
  if (params.kind > 1.5 && params.kind < 2.5) {
    var tracks = 0.0;
    var pulses = 0.0;
    for (var i = 0; i < 4; i += 1) {
      let fi = f32(i);
      let y = -0.31 + fi * 0.205;
      let start = vec2f(-params.aspect * 0.42, y);
      let finish = vec2f(params.aspect * 0.43, y + (fi - 1.5) * 0.018);
      let distance = sdSegment(p, start, finish);
      tracks += lineMask(distance, 0.003) * (0.4 + cursorField * 0.42);
      let travel = fract(params.time * (0.055 + fi * 0.008) + fi * 0.19);
      let pulsePoint = mix(start, finish, travel);
      pulses += 1.0 - smoothstep(0.008, 0.027, length(p - pulsePoint));
    }
    let present = lineMask(abs(p.x - params.aspect * 0.43), 0.0024) * 0.52;
    let contentGuard = smoothstep(0.34, 0.72, uv.x);
    let mark = (tracks + pulses * (0.62 + params.energy * 0.45) + present) * contentGuard;
    let experienceInk = mix(cream, paperInk, params.paper);
    color = mix(experienceInk, signalOrange, 0.72) * mark;
    alpha = clamp(mark, 0.0, 0.82);
  }

  // PROJECTS — a trunk splits into shipped branches and live nodes.
  if (params.kind > 2.5 && params.kind < 3.5) {
    let trunkStart = vec2f(-params.aspect * 0.38, 0.26);
    let trunkEnd = vec2f(params.aspect * 0.34, -0.24);
    var branches = lineMask(sdSegment(p, trunkStart, trunkEnd), 0.0032) * 0.62;
    var nodes = 0.0;
    for (var i = 0; i < 5; i += 1) {
      let fi = f32(i);
      let t = 0.14 + fi * 0.17;
      let root = mix(trunkStart, trunkEnd, t);
      let direction = select(-1.0, 1.0, i % 2 == 0);
      let tip = root + vec2f(params.aspect * (0.11 + fi * 0.008), direction * (0.09 + fi * 0.012));
      branches += lineMask(sdSegment(p, root, tip), 0.0028) * (0.46 + cursorField * 0.5);
      let beat = 0.55 + 0.45 * sin(params.time * 0.82 + fi * 1.4);
      nodes += (1.0 - smoothstep(0.007, 0.022 + beat * 0.006, length(p - tip))) * beat;
    }
    let contentGuard = smoothstep(0.24, 0.62, uv.x);
    let mark = (branches + nodes * (0.52 + params.energy * 0.5)) * contentGuard;
    let projectInk = mix(cream, paperInk, params.paper);
    color = mix(projectInk, signalOrange, 0.78) * mark;
    alpha = clamp(mark, 0.0, 0.84);
  }

  // CAPABILITIES — system layers lift and reconnect around the pointer.
  if (params.kind > 3.5 && params.kind < 4.5) {
    var layers = 0.0;
    var links = 0.0;
    for (var i = 0; i < 7; i += 1) {
      let fi = f32(i);
      let y = -0.37 + fi * 0.122;
      let lift = cursorField * sin(fi * 1.7 + params.time * 0.45) * 0.035;
      let left = vec2f(-params.aspect * 0.42 + fi * 0.018, y + lift);
      let right = vec2f(params.aspect * 0.42 - fi * 0.025, y - fi * 0.006 + lift);
      layers += lineMask(sdSegment(p, left, right), 0.0032) * (0.3 + fi * 0.055);
      if (i < 6) {
        let nextY = -0.37 + (fi + 1.0) * 0.122;
        links += lineMask(sdSegment(p, right, vec2f(right.x - 0.055, nextY)), 0.0024) * 0.34;
      }
    }
    let scan = pow(max(0.0, sin((uv.x - params.time * 0.07) * 18.0)), 30.0);
    let contentGuard = 0.14 + smoothstep(0.42, 0.78, uv.x) * 0.86;
    let mark = (layers + links + layers * scan * 0.48) * contentGuard;
    let capabilityInk = mix(cream, paperInk, params.paper);
    color = mix(capabilityInk, signalOrange, 0.58 + cursorField * 0.28) * mark;
    alpha = clamp(mark, 0.0, 0.78);
  }

  // CONTACT — independent build paths converge into one outgoing signal.
  if (params.kind > 4.5) {
    let destination = mix(vec2f(params.aspect * 0.28, 0.02), pointer, params.energy * 0.55);
    var routes = 0.0;
    var pulse = 0.0;
    for (var i = 0; i < 6; i += 1) {
      let fi = f32(i);
      let source = vec2f(-params.aspect * 0.48, -0.38 + fi * 0.15);
      let d = sdSegment(p, source, destination);
      routes += lineMask(d, 0.0018) * (0.3 + cursorField * 0.4);
      let travel = fract(uv.x * 2.2 - params.time * (0.16 + fi * 0.012) + fi * 0.13);
      pulse += lineMask(d, 0.004) * pow(max(0.0, sin(travel * 6.283)), 28.0);
    }
    let mark = routes + pulse * (0.38 + params.energy * 0.5);
    let contactInk = mix(cream, paperInk, params.paper);
    color = mix(contactInk, signalOrange, 0.72) * mark;
    alpha = clamp(mark, 0.0, 0.84);
  }

  return vec4f(max(color, vec3f(0.0)) * alpha, alpha);
}
