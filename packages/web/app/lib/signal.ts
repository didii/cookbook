/** Three short beeps on an audio context that the start tap created (browsers only allow sound after a gesture). */
function beep(audio: AudioContext) {
  for (const delay of [0, 0.3, 0.6]) {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.frequency.value = 880;
    osc.connect(gain);
    gain.connect(audio.destination);
    const t0 = audio.currentTime + delay;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.25, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);
    osc.start(t0);
    osc.stop(t0 + 0.25);
  }
}

/** Sound and vibration for a timer that ended, where the device has them. The title and the red state back them up. */
export function signalEnd(audio: AudioContext | undefined, nav: Pick<Navigator, 'vibrate'> | undefined = navigator) {
  if (audio) beep(audio);
  nav?.vibrate?.([200, 100, 200]);
}
