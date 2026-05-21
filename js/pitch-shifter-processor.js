/**
 * Dual-tap overlap pitch shifter — changes pitch, not a fixed Hz frequency shift.
 */
class PitchShifterProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.pitchRatio = 1;
    this.delaySize = 16384;
    this.halfDelay = this.delaySize * 0.5;
    this.delay = new Float32Array(this.delaySize);
    this.writeIndex = 0;
    this.readIndexA = 0;
    this.readIndexB = this.halfDelay;
    this.crossfade = 0;
    this.crossfadeInc = (2 * Math.PI) / sampleRate;

    this.port.onmessage = ({ data }) => {
      if (typeof data.pitchRatio === "number" && data.pitchRatio > 0) {
        this.pitchRatio = Math.max(0.25, Math.min(4, data.pitchRatio));
      }
    };
  }

  readDelay(index) {
    const i0 = Math.floor(index) % this.delaySize;
    const frac = index - Math.floor(index);
    const i1 = (i0 + 1) % this.delaySize;
    return this.delay[i0] * (1 - frac) + this.delay[i1] * frac;
  }

  process(inputs, outputs) {
    const input = inputs[0]?.[0];
    const output = outputs[0]?.[0];
    if (!output) return true;

    const ratio = this.pitchRatio;

    for (let i = 0; i < output.length; i++) {
      this.delay[this.writeIndex % this.delaySize] = input?.[i] ?? 0;
      this.writeIndex++;

      const fade = (Math.sin(this.crossfade) + 1) * 0.5;
      output[i] =
        this.readDelay(this.readIndexA) * fade + this.readDelay(this.readIndexB) * (1 - fade);

      this.readIndexA += ratio;
      this.readIndexB += ratio;
      this.crossfade += this.crossfadeInc;

      if (this.readIndexA >= this.writeIndex) this.readIndexA -= this.halfDelay;
      if (this.readIndexB >= this.writeIndex) this.readIndexB -= this.halfDelay;
    }

    return true;
  }
}

registerProcessor("pitch-shifter-processor", PitchShifterProcessor);
