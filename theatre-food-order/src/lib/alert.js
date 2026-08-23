let audioCtx = null

// Plays a short two-tone "ding-dong" using the Web Audio API.
// No mp3/wav file needed, and it works after any user tap unlocks audio on mobile.
export function playNewOrderSound() {
  try {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      audioCtx = new AudioContext()
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume()
    }
    const now = audioCtx.currentTime
    const tones = [880, 660]
    tones.forEach((freq, i) => {
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      const start = now + i * 0.18
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(0.35, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.32)
      osc.connect(gain)
      gain.connect(audioCtx.destination)
      osc.start(start)
      osc.stop(start + 0.35)
    })
  } catch (e) {
    // Web Audio not available — fail silently, vibration will still fire.
  }
}

export function vibrateNewOrder() {
  if (navigator.vibrate) {
    navigator.vibrate([200, 100, 200])
  }
}

export function unlockAudio() {
  try {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      audioCtx = new AudioContext()
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume()
    }
  } catch (e) {
    // ignore
  }
}
