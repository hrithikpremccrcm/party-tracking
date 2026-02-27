// Trigger canvas-confetti for celebrations
let confetti;

const loadConfetti = async () => {
  if (!confetti) {
    const module = await import('canvas-confetti');
    confetti = module.default;
  }
  return confetti;
};

export const fireConfetti = async () => {
  const cf = await loadConfetti();
  
  // Big burst
  cf({
    particleCount: 150,
    spread: 100,
    origin: { y: 0.5 },
    colors: ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#845ec2', '#ff6bca'],
    gravity: 0.8,
    scalar: 1.2,
  });

  // Side cannons
  setTimeout(() => {
    cf({ particleCount: 80, angle: 60, spread: 55, origin: { x: 0, y: 0.7 } });
    cf({ particleCount: 80, angle: 120, spread: 55, origin: { x: 1, y: 0.7 } });
  }, 300);

  // Extra burst
  setTimeout(() => {
    cf({
      particleCount: 100,
      spread: 120,
      origin: { y: 0.3 },
      startVelocity: 30,
      shapes: ['star', 'circle'],
      colors: ['#ff6b6b', '#ffd93d', '#6bcb77'],
    });
  }, 600);
};

export const fireSmallConfetti = async () => {
  const cf = await loadConfetti();
  cf({
    particleCount: 60,
    spread: 70,
    origin: { y: 0.7 },
    colors: ['#ff6b6b', '#ffd93d', '#6bcb77'],
  });
};

export const fireRainbow = async () => {
  const cf = await loadConfetti();
  const end = Date.now() + 3000;
  const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#845ec2'];
  
  const frame = () => {
    cf({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors });
    cf({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
};
