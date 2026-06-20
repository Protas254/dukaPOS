/**
 * Plays a subtle beep sound using the Web Audio API
 * @param {number} frequency - Frequency in Hz (880 for success, 220 for error)
 * @param {number} duration - Duration in seconds (default 0.15)
 * @param {number} volume - Volume 0-1 (default 0.3)
 */
export function playBeep(frequency = 880, duration = 0.15, volume = 0.3) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
    
    // Clean up after sound finishes
    setTimeout(() => ctx.close(), duration * 1000 + 100);
  } catch (error) {
    // Silently fail if audio context is not available
    console.debug('Audio beep failed:', error.message);
  }
}

/**
 * Plays a success beep (high-pitched, pleasant tone)
 */
export function playSuccessBeep() {
  playBeep(880, 0.12, 0.25);
}

/**
 * Plays an error beep (low-pitched warning tone)
 */
export function playErrorBeep() {
  playBeep(220, 0.25, 0.25);
}