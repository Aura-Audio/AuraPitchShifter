const $ = (id) => document.getElementById(id);

const state = {
  audioContext: null,
  pitchNode: null,
  sourceNode: null,
  gainNode: null,
  monitorGain: null,
  stream: null,
  mode: "mic",
  running: false,
  testOsc: null,
  testGain: null,
};

function semitonesToRatio(semitones) {
  return Math.pow(2, semitones / 12);
}

function updatePitchRatio() {
  const semitones = parseFloat($("semitones").value);
  const cents = parseFloat($("cents").value);
  const ratio = semitonesToRatio(semitones + cents / 100);
  $("pitch-label").textContent = `${semitones >= 0 ? "+" : ""}${semitones} st · ${cents >= 0 ? "+" : ""}${cents} ct`;
  $("ratio-label").textContent = `×${ratio.toFixed(3)}`;
  if (state.pitchNode) {
    state.pitchNode.port.postMessage({ pitchRatio: ratio });
  }
}

async function ensureAudio() {
  if (state.audioContext) return;
  state.audioContext = new AudioContext({ latencyHint: "interactive" });
  await state.audioContext.audioWorklet.addModule("./js/pitch-shifter-processor.js");

  state.pitchNode = new AudioWorkletNode(state.audioContext, "pitch-shifter-processor", {
    numberOfInputs: 1,
    numberOfOutputs: 1,
    outputChannelCount: [1],
  });

  state.gainNode = state.audioContext.createGain();
  state.monitorGain = state.audioContext.createGain();
  state.monitorGain.gain.value = 0.9;

  state.pitchNode.connect(state.gainNode);
  state.gainNode.connect(state.monitorGain);
  state.monitorGain.connect(state.audioContext.destination);

  updatePitchRatio();
  setWetDry();
}

function setWetDry() {
  const wet = parseFloat($("wet-dry").value) / 100;
  const label = $("wet-dry").closest(".field")?.querySelector("label span");
  if (label) label.textContent = `${Math.round(wet * 100)}%`;
  if (state.gainNode) state.gainNode.gain.value = wet;
}

async function stopSource() {
  if (state.testOsc) {
    try {
      state.testOsc.stop();
    } catch (_) {}
    state.testOsc.disconnect();
    state.testOsc = null;
  }
  if (state.testGain) {
    state.testGain.disconnect();
    state.testGain = null;
  }
  if (state.sourceNode) {
    state.sourceNode.disconnect();
    state.sourceNode = null;
  }
  if (state.stream) {
    state.stream.getTracks().forEach((t) => t.stop());
    state.stream = null;
  }
}

async function startMic() {
  await ensureAudio();
  await stopSource();
  state.mode = "mic";
  state.stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
    video: false,
  });
  state.sourceNode = state.audioContext.createMediaStreamSource(state.stream);
  state.sourceNode.connect(state.pitchNode);
}

async function startTestTone() {
  await ensureAudio();
  await stopSource();
  state.mode = "test";
  const freq = parseFloat($("test-freq").value);
  const wave = $("test-wave").value;

  state.testOsc = state.audioContext.createOscillator();
  state.testOsc.type = wave;
  state.testOsc.frequency.value = freq;

  state.testGain = state.audioContext.createGain();
  state.testGain.gain.value = 0.35;

  state.testOsc.connect(state.testGain);
  state.testGain.connect(state.pitchNode);
  state.testOsc.start();
}

async function start() {
  $("status").textContent = "Starting…";
  $("status").className = "status starting";
  try {
    if ($("source-mic").checked) {
      await startMic();
    } else {
      await startTestTone();
    }
    if (state.audioContext.state === "suspended") {
      await state.audioContext.resume();
    }
    state.running = true;
    $("start-btn").disabled = true;
    $("stop-btn").disabled = false;
    $("status").textContent = state.mode === "mic" ? "Live mic · pitch shifted" : "Test tone · pitch shifted";
    $("status").className = "status active";
  } catch (err) {
    state.running = false;
    $("status").textContent = `Error: ${err.message}`;
    $("status").className = "status error";
    console.error(err);
  }
}

async function stop() {
  await stopSource();
  state.running = false;
  $("start-btn").disabled = false;
  $("stop-btn").disabled = true;
  $("status").textContent = "Stopped";
  $("status").className = "status idle";
}

function bindUi() {
  $("semitones").addEventListener("input", updatePitchRatio);
  $("cents").addEventListener("input", updatePitchRatio);
  $("wet-dry").addEventListener("input", setWetDry);
  $("start-btn").addEventListener("click", start);
  $("stop-btn").addEventListener("click", stop);

  document.querySelectorAll('input[name="source"]').forEach((el) => {
    el.addEventListener("change", () => {
      const isTest = $("source-test").checked;
      $("test-controls").hidden = !isTest;
      if (state.running) stop().then(start);
    });
  });

  $("test-freq").addEventListener("input", () => {
    if (state.testOsc) state.testOsc.frequency.value = parseFloat($("test-freq").value);
    $("freq-label").textContent = `${$("test-freq").value} Hz`;
  });

  $("test-wave").addEventListener("change", () => {
    if (state.running && state.mode === "test") {
      stop().then(startTestTone);
    }
  });

  $("preset-up").addEventListener("click", () => {
    $("semitones").value = 7;
    $("cents").value = 0;
    updatePitchRatio();
  });
  $("preset-down").addEventListener("click", () => {
    $("semitones").value = -7;
    $("cents").value = 0;
    updatePitchRatio();
  });
  $("preset-reset").addEventListener("click", () => {
    $("semitones").value = 0;
    $("cents").value = 0;
    updatePitchRatio();
  });

  $("stop-btn").disabled = true;
  $("test-controls").hidden = true;
  updatePitchRatio();
  $("freq-label").textContent = `${$("test-freq").value} Hz`;
}

bindUi();
