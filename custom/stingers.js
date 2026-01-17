// custom/stingers.js - Triggerable overlay videos from list

const STINGER_VIDEOS = [
  "https://helpsolve.github.io/vdo.ninja/custom/media/1.mp4",     // update these URLs

  // Add your own; host in /media/ folder or external CDN
];

let activeStinger = null;

function playStinger(index = 0) {
  if (index < 0 || index >= STINGER_VIDEOS.length) return;
  if (activeStinger) activeStinger.remove();

  const vid = document.createElement('video');
  vid.src = STINGER_VIDEOS[index];
  vid.autoplay = true;
  vid.muted = false;  // true for silent
  vid.loop = false;
  vid.style.cssText = 'position:fixed; inset:0; width:100vw; height:100vh; object-fit:cover; z-index:99999; pointer-events:none;';
  document.body.appendChild(vid);
  activeStinger = vid;

  vid.onended = () => {
    vid.remove();
    activeStinger = null;
  };
}

// Expose globally for console testing or future triggers
window.playStinger = playStinger;

console.log("Stingers module loaded");
