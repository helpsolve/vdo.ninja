// custom/pulsating-avatar.js - Pulsating avatar on cam off

const AVATAR_IMAGE = "https://helpsolve.github.io/vdo.ninja/media/avatar.png";  // your PNG

let pulseAvatar = null;
let audioCtx = null;
let analyser = null;
let animationFrameId = null;

async function startPulse() {
  if (pulseAvatar) return;

  pulseAvatar = document.createElement('img');
  pulseAvatar.src = AVATAR_IMAGE;
  pulseAvatar.style.cssText = 'position:fixed; bottom:30px; right:30px; width:180px; z-index:10000; border-radius:50%; box-shadow:0 0 20px rgba(0,255,0,0.6); transition:transform 0.08s;';
  document.body.appendChild(pulseAvatar);

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioCtx.createMediaStreamSource(stream);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);

    function pulse() {
      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b) / data.length / 255;
      const scale = 1 + avg * 1.5;  // tune this
      pulseAvatar.style.transform = `scale(${scale})`;
      animationFrameId = requestAnimationFrame(pulse);
    }
    pulse();
  } catch (err) {
    console.error("Mic access failed for pulse:", err);
  }
}

function stopPulse() {
  if (pulseAvatar) {
    pulseAvatar.remove();
    pulseAvatar = null;
  }
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  if (audioCtx) audioCtx.close();
}

// Cam status check (polling + track events)
function checkCam() {
  const localVid = document.querySelector('video[srcObject]');  // broad selector; refine if needed (inspect DOM)
  const hasCam = localVid && localVid.srcObject && localVid.srcObject.getVideoTracks().some(t => t.enabled && t.readyState === 'live');
  if (!hasCam) startPulse();
  else stopPulse();
}

setInterval(checkCam, 600);
document.addEventListener('trackenabled', checkCam, true);
document.addEventListener('trackdisabled', checkCam, true);

console.log("Pulsating avatar module loaded");
