struct Params {
  time: f32,
  aspect: f32,
  pointer: vec2f,
  focus: vec2f,
  focusStrength: f32,
  scroll: f32,
  paper: f32,
  motion: f32,
}

@group(0) @binding(0) var<uniform> params: Params;

fn sdSegment(p: vec2f, a: vec2f, b: vec2f) -> f32 {
  let pa = p - a;
  let ba = b - a;
  let h = clamp(dot(pa, ba) / max(dot(ba, ba), 0.00001), 0.0, 1.0);
  return length(pa - ba * h);
}

fn ring(p: vec2f, center: vec2f, radius: f32, width: f32) -> f32 {
  let d = abs(length(p - center) - radius);
  return 1.0 - smoothstep(width, width + fwidth(d) * 1.4, d);
}

fn node(p: vec2f, center: vec2f, radius: f32) -> f32 {
  let d = length(p - center);
  return 1.0 - smoothstep(radius, radius + fwidth(d) * 1.5, d);
}

fn routePacket(
  phase: f32,
  source: vec2f,
  jointA: vec2f,
  jointB: vec2f,
  destination: vec2f
) -> vec2f {
  var packet = source;
  if (phase < 0.32) {
    packet = mix(source, jointA, phase / 0.32);
  } else if (phase < 0.67) {
    packet = mix(jointA, jointB, (phase - 0.32) / 0.35);
  } else {
    packet = mix(jointB, destination, (phase - 0.67) / 0.33);
  }
  return packet;
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let p = vec2f((uv.x - 0.5) * params.aspect, uv.y - 0.5);
  let pointer = vec2f(
    (params.pointer.x - 0.5) * params.aspect,
    params.pointer.y - 0.5
  );
  let focused = vec2f(
    (params.focus.x - 0.5) * params.aspect,
    params.focus.y - 0.5
  );
  let attention = smoothstep(0.0, 0.85, params.focusStrength);
  let destination = mix(pointer, focused, attention);
  let time = params.time * params.motion;

  var routeEnergy = 0.0;
  var nodeEnergy = 0.0;
  var signalEnergy = 0.0;

  for (var i = 0; i < 7; i = i + 1) {
    let fi = f32(i);
    let rightSide = fract(fi * 0.5) > 0.25;
    let side = select(-1.0, 1.0, rightSide);
    let source = vec2f(
      side * (params.aspect * 0.58 + 0.08),
      -0.39 + fi * 0.13 + sin(time * 0.16 + fi * 1.7) * 0.018
    );
    let jointA = vec2f(
      side * (0.25 + 0.045 * sin(fi * 2.1 + params.scroll * 4.0)),
      source.y
    );
    let destinationOffset = destination + vec2f(
      side * (0.012 + fi * 0.0015),
      (fi - 3.0) * 0.011
    );
    let jointB = vec2f(
      mix(jointA.x, destinationOffset.x, 0.52),
      destinationOffset.y + (fi - 3.0) * 0.032
    );

    let routeDistance = min(
      sdSegment(p, source, jointA),
      min(
        sdSegment(p, jointA, jointB),
        sdSegment(p, jointB, destinationOffset)
      )
    );
    let routeWidth = 0.00072 + attention * 0.00022;
    let route = 1.0 - smoothstep(
      routeWidth,
      routeWidth + max(fwidth(routeDistance) * 1.35, 0.00065),
      routeDistance
    );
    routeEnergy += route * (0.11 + attention * 0.055);

    nodeEnergy += node(p, jointA, 0.0027) * 0.24;
    nodeEnergy += ring(p, jointB, 0.0065, 0.0008) * 0.2;

    let phase = fract(
      time * (0.055 + fi * 0.003) + fi * 0.137 + params.scroll * 0.86
    );
    let packet = routePacket(phase, source, jointA, jointB, destinationOffset);
    let packetDistance = length(p - packet);
    let packetCore = 1.0 - smoothstep(0.003, 0.009, packetDistance);
    let packetGlow = exp(-packetDistance * 70.0);
    signalEnergy += packetCore * (0.62 + attention * 0.26);
    signalEnergy += packetGlow * (0.09 + attention * 0.08);
  }

  let focusDistance = length(p - destination);
  let focusHalo = exp(-focusDistance * (10.0 - attention * 2.0));
  let breathingRadius = 0.026 + sin(time * 1.15) * 0.004 * params.motion;
  let focusRing = ring(p, destination, breathingRadius, 0.0011);
  let cursorRing = ring(p, pointer, 0.012, 0.0007) * (1.0 - attention);
  signalEnergy += focusRing * (0.12 + attention * 0.34);
  signalEnergy += focusHalo * (0.018 + attention * 0.055);
  routeEnergy += cursorRing * 0.15;

  let edgeFade = smoothstep(0.0, 0.08, uv.x)
    * smoothstep(0.0, 0.08, 1.0 - uv.x)
    * smoothstep(0.0, 0.07, uv.y)
    * smoothstep(0.0, 0.07, 1.0 - uv.y);
  routeEnergy *= edgeFade;
  nodeEnergy *= edgeFade;
  signalEnergy *= edgeFade;

  let darkRoute = vec3f(0.82, 0.78, 0.7);
  let darkSignal = vec3f(1.0, 0.29, 0.075);
  let paperRoute = vec3f(0.19, 0.17, 0.145);
  let paperSignal = vec3f(0.76, 0.2, 0.035);
  let routeColor = mix(darkRoute, paperRoute, params.paper);
  let signalColor = mix(darkSignal, paperSignal, params.paper);
  let quiet = clamp(routeEnergy + nodeEnergy, 0.0, 0.34);
  let signal = clamp(signalEnergy, 0.0, 0.68);
  let alpha = clamp(quiet + signal, 0.0, 0.72);
  let rgb = min(
    routeColor * quiet + signalColor * signal,
    vec3f(alpha)
  );

  return vec4f(rgb, alpha);
}
