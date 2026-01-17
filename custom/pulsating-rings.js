// custom/pulsating-rings.js - Audio-reactive pulsing glow/rings around native VDO.Ninja avatar (when no cam)

let audioCtx = null;
let analyser = null;
let animationFrameId = null;
let pulseElements = [];  // Store created ring elements

// Config
const PULSE_COLOR = 'rgba(0, 255, 100, 0.7)';  // green glow; change to your brand
const MAX_RINGS = 3;  // number of concentric pulsing rings
const PULSE_INTENSITY = 1.8;  // higher = more dramatic

async function startPulseRings() {
  // Prevent multiple instances
  if (pulseElements.length > 0) return;

  // Find the avatar container (refine selector by inspecting DOM in a room with avatar active)
  const avatarContainers = document.querySelectorAll('.videoTile img, [style*="background-image"], .guestVideo, video + div'); // broad; test and narrow

  if (avatarContainers.length === 0) {
    console.log("No avatar elements found for pulsing");
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioCtx.createMediaStreamSource(stream);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);

    // Create pulsing rings around each avatar
    avatarContainers.forEach(container => {
      if (!container.parentElement) return;

      const ringContainer = document.createElement('div');
      ringContainer.style.cssText = `
        position: absolute; inset: 0; pointer-events: none; z-index: 1;
        border-radius: 50%; overflow: hidden;
      `;
      container.parentElement.style.position = 'relative';  // ensure parent can contain absolute rings
      container.parentElement.appendChild(ringContainer);

      // Create multiple rings
      for (let i = 0; i < MAX_RINGS; i++) {
        const ring = document.createElement('div');
        ring.style.cssText = `
          position: absolute; inset: ${i * 15}px; border: 3px solid ${PULSE_COLOR};
          border-radius: 50%; opacity: 0; transition: opacity 0.3s, transform 0.2s;
        `;
        ringContainer.appendChild(ring);
        pulseElements.push(ring);
      }
    });

    function pulse() {
      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length / 255;
      const intensity = avg * PULSE_INTENSITY;

      pulseElements.forEach((ring, idx) => {
        const delay = idx * 0.15;
        ring.style.opacity = intensity * (1 - idx * 0.3);  // fade outer rings
        ring.style.transform = `scale(${1 + intensity * (0.5 + idx * 0.2)})`;
      });

      animationFrameId = requestAnimationFrame(pulse);
    }
    pulse();
  } catch (err) {
    console.error("Mic access failed for rings pulse:", err);
  }
}

function stopPulseRings() {
  pulseElements.forEach(el => el.remove());
  pulseElements = [];
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  if (audioCtx) audioCtx.close();
}

// Detection: Run when avatar is visible (no cam active)
function checkForAvatar() {
  // Detect if avatar is shown (e.g., img[src] with placeholder or bgimage style)
  const hasAvatar = document.querySelector('img[src*="avatar"], [style*="background-image"]');
  const hasCam = document.querySelector('video[srcObject] video-track-active'); // rough; refine

  if (hasAvatar && !hasCam) {
    startPulseRings();
  } else {
    stopPulseRings();
  }
}

setInterval(checkForAvatar, 800);
// Optional: Listen for DOM changes if avatars load dynamically
const observer = new MutationObserver(checkForAvatar);
observer.observe(document.body, { childList: true, subtree: true });

console.log("Pulsating rings around native avatar loaded");
