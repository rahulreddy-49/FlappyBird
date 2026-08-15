/**
 * WingRush - Core Game Engine
 * Features responsive canvas scaling, parallax scrolling backgrounds, physics,
 * particles, collision checks, score progression, and local storage integration.
 */

// --- Constants & Config ---
const V_WIDTH = 450;
const V_HEIGHT = 800;
const GROUND_HEIGHT = 90;

const STATES = {
  START: 'START',
  PLAYING: 'PLAYING',
  GAMEOVER: 'GAMEOVER'
};

class Particle {
  constructor(x, y, color, speedX, speedY, size, maxLife) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.vx = speedX;
    this.vy = speedY;
    this.size = size;
    this.maxLife = maxLife;
    this.life = maxLife;
    this.alpha = 1;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    this.alpha = Math.max(0, this.life / this.maxLife);
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class ParallaxLayer {
  constructor(speed, drawFn) {
    this.speed = speed;
    this.x = 0;
    this.drawFn = drawFn;
  }

  update(dt, gameSpeed) {
    this.x -= this.speed * gameSpeed * dt;
    if (this.x <= -V_WIDTH) {
      this.x += V_WIDTH;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, 0);
    this.drawFn(ctx, 0);
    ctx.translate(V_WIDTH, 0);
    this.drawFn(ctx, V_WIDTH);
    ctx.restore();
  }
}

class Bird {
  constructor() {
    this.x = 120;
    this.y = V_HEIGHT / 2 - 50;
    this.radius = 18;
    this.velocity = 0;
    this.gravity = 0.44;
    this.jumpForce = -7.6;
    this.terminalVelocity = 11;
    this.rotation = 0;
    this.targetRotation = 0;
    
    // Wing animation
    this.wingAngle = 0;
    this.wingDirection = 1;
    this.wingSpeed = 0.28;

    // Thruster state
    this.thrustActive = 0; // frame count
    this.glowTimer = 0;
  }

  flap() {
    this.velocity = this.jumpForce;
    this.targetRotation = -0.5; // Rotate upward
    this.thrustActive = 12; // active thrust frames
    window.gameAudio.playFlap();
  }

  update(dt) {
    // Gravity
    this.velocity = Math.min(this.terminalVelocity, this.velocity + this.gravity * dt);
    this.y += this.velocity * dt;

    if (this.y < this.radius) {
      this.y = this.radius;
      this.velocity = 0;
    }

    if (this.thrustActive > 0) {
      this.thrustActive -= dt;
    }

    this.glowTimer += 0.15 * dt;

    // Nose direction
    if (this.velocity > 3) {
      this.targetRotation = Math.min(Math.PI / 3, this.targetRotation + 0.08 * dt);
    } else {
      this.targetRotation = Math.max(-Math.PI / 6, this.targetRotation - 0.04 * dt);
    }
    this.rotation += (this.targetRotation - this.rotation) * 0.18 * dt;

    // Wing oscillation
    this.wingAngle += this.wingSpeed * this.wingDirection * dt;
    if (Math.abs(this.wingAngle) > 0.55) {
      this.wingDirection *= -1;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    // Dynamic glowing thrusters
    const isThrusting = this.thrustActive > 0;
    const thrusterLen = isThrusting ? 35 + Math.sin(this.glowTimer * 2) * 8 : 12 + Math.sin(this.glowTimer) * 4;
    const flameColor = isThrusting ? '#00f0ff' : '#ff7300';
    const flameAccent = isThrusting ? '#ff2a5f' : '#ff2200';

    ctx.shadowBlur = isThrusting ? 20 : 10;
    ctx.shadowColor = flameColor;

    // Draw Upper & Lower Thruster Nozzles & Flames (cyber jet tail)
    const nozzleOffsets = [-6, 6];
    nozzleOffsets.forEach(offsetY => {
      // Flame
      const flameGrad = ctx.createLinearGradient(-35, offsetY, -12, offsetY);
      flameGrad.addColorStop(0, 'rgba(255, 42, 95, 0)');
      flameGrad.addColorStop(0.5, flameAccent);
      flameGrad.addColorStop(1, flameColor);
      ctx.fillStyle = flameGrad;
      
      ctx.beginPath();
      ctx.moveTo(-12, offsetY - 3);
      ctx.lineTo(-12 - thrusterLen, offsetY);
      ctx.lineTo(-12, offsetY + 3);
      ctx.closePath();
      ctx.fill();

      // Nozzle structure
      ctx.fillStyle = '#221936';
      ctx.strokeStyle = '#7b7890';
      ctx.lineWidth = 1.5;
      ctx.fillRect(-14, offsetY - 4, 4, 8);
      ctx.strokeRect(-14, offsetY - 4, 4, 8);
    });

    // Sleek Cyber Jet Fuselage (Cyan-Blue gradient body)
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00f0ff';
    const bodyGrad = ctx.createLinearGradient(-15, -12, 18, 12);
    bodyGrad.addColorStop(0, '#00f0ff');
    bodyGrad.addColorStop(0.4, '#0088ff');
    bodyGrad.addColorStop(1, '#0e0b30');
    ctx.fillStyle = bodyGrad;

    // Draw aerodynamic fighter shell
    ctx.beginPath();
    ctx.moveTo(-16, -10);
    ctx.lineTo(16, -2);
    ctx.lineTo(24, 0); // Pointy visor nose
    ctx.lineTo(16, 2);
    ctx.lineTo(-16, 10);
    ctx.quadraticCurveTo(-22, 0, -16, -10);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Secondary plating highlight (Metallic wing joints)
    ctx.fillStyle = '#110c26';
    ctx.beginPath();
    ctx.arc(-2, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Glowing Visor / Windshield (Front Cockpit)
    ctx.shadowColor = '#ff2a5f';
    const visorGrad = ctx.createLinearGradient(4, -5, 16, 0);
    visorGrad.addColorStop(0, '#ff2a5f');
    visorGrad.addColorStop(1, '#ffdd00');
    ctx.fillStyle = visorGrad;
    
    ctx.beginPath();
    ctx.moveTo(6, -5);
    ctx.lineTo(16, -2);
    ctx.lineTo(14, 3);
    ctx.lineTo(4, 2);
    ctx.closePath();
    ctx.fill();

    // Double-jointed cyber wings (animated)
    ctx.shadowColor = '#00f0ff';
    ctx.save();
    ctx.translate(-4, -1);
    ctx.rotate(this.wingAngle);

    // Wing segment 1: Inner wing bone
    const wingGrad1 = ctx.createLinearGradient(0, 0, -6, -20);
    wingGrad1.addColorStop(0, '#0088ff');
    wingGrad1.addColorStop(1, '#ffffff');
    ctx.fillStyle = wingGrad1;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-10, -18);
    ctx.lineTo(-2, -18);
    ctx.lineTo(4, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Wing segment 2: Outer wing tip (bends more!)
    ctx.translate(-6, -18);
    ctx.rotate(this.wingAngle * 0.4); // additional bending rotation

    const wingGrad2 = ctx.createLinearGradient(0, 0, 4, -16);
    wingGrad2.addColorStop(0, '#ffffff');
    wingGrad2.addColorStop(1, 'rgba(0, 240, 255, 0.2)');
    ctx.fillStyle = wingGrad2;

    ctx.beginPath();
    ctx.moveTo(-4, 0);
    ctx.lineTo(4, -16);
    ctx.lineTo(10, -16);
    ctx.lineTo(4, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
    ctx.restore();
  }
}

class Obstacle {
  constructor(x, gapY, gapHeight) {
    this.x = x;
    this.gapY = gapY;
    this.gapHeight = gapHeight;
    this.width = 75;
    this.passed = false;
    this.glowTimer = 0;
  }

  update(dt, speed) {
    this.x -= speed * dt;
    this.glowTimer += 0.05 * dt;
  }

  draw(ctx, birdX) {
    ctx.save();

    // Pulse neon border intensity
    const pulse = 10 + Math.sin(this.glowTimer) * 4;
    ctx.shadowBlur = pulse;

    // Shift border color cycle
    const colorVal = Math.sin(this.glowTimer * 0.4);
    const strokeColor = colorVal > 0 
      ? `rgba(0, 240, 255, ${0.85 + Math.abs(colorVal) * 0.15})`
      : `rgba(255, 42, 95, ${0.85 + Math.abs(colorVal) * 0.15})`;

    // Draw Top Pipe
    this._drawPillar(ctx, this.x, 0, this.width, this.gapY, true, strokeColor);

    // Draw Bottom Pipe
    const bottomHeight = V_HEIGHT - GROUND_HEIGHT - (this.gapY + this.gapHeight);
    this._drawPillar(ctx, this.x, this.gapY + this.gapHeight, this.width, bottomHeight, false, strokeColor);

    // Draw deactivating laser barrier in the gap
    this._drawLaserBarrier(ctx, birdX);

    ctx.restore();
  }

  _drawPillar(ctx, x, y, width, height, isTop, strokeColor) {
    // Dark core fill to stand out
    ctx.fillStyle = '#0a0514';
    ctx.fillRect(x, y, width, height);

    ctx.strokeStyle = strokeColor;
    ctx.shadowColor = strokeColor;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, width, height);

    // Internal scanner wires
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.shadowBlur = 0;
    for (let py = y + 12; py < y + height; py += 16) {
      ctx.beginPath();
      ctx.moveTo(x + 4, py);
      ctx.lineTo(x + width - 4, py);
      ctx.stroke();
    }
    ctx.restore();

    // Cap rim
    const capHeight = 22;
    const capExtraWidth = 6;
    const capX = x - capExtraWidth / 2;
    const capY = isTop ? y + height - capHeight : y;

    ctx.fillStyle = '#0a0514';
    ctx.fillRect(capX, capY, width + capExtraWidth, capHeight);

    ctx.strokeStyle = strokeColor;
    ctx.shadowColor = strokeColor;
    ctx.lineWidth = 3;
    ctx.strokeRect(capX, capY, width + capExtraWidth, capHeight);

    // Center core light
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 8;
    ctx.fillRect(capX + 12, capY + capHeight / 2 - 2, width + capExtraWidth - 24, 4);
  }

  _drawLaserBarrier(ctx, birdX) {
    const dist = this.x - birdX;
    let alpha = 0;
    if (dist > 0) {
      // Fade out from 0.35 down to 0 as bird approaches (from 240px away down to 70px away)
      alpha = Math.max(0, Math.min(0.35, (dist - 70) / 170));
    }

    if (alpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#ff2a5f';
    ctx.strokeStyle = '#ff2a5f';
    ctx.lineWidth = 2;

    // Draw horizontal laser grid lines inside the gap
    const startY = this.gapY + 8;
    const endY = this.gapY + this.gapHeight - 8;
    for (let ly = startY; ly <= endY; ly += 14) {
      ctx.beginPath();
      ctx.moveTo(this.x + 8, ly);
      ctx.lineTo(this.x + this.width - 8, ly);
      ctx.stroke();
    }

    // Small pulsing indicator dot in middle
    ctx.fillStyle = '#ff2a5f';
    ctx.beginPath();
    ctx.arc(this.x + this.width / 2, this.gapY + this.gapHeight / 2, 4 + Math.sin(this.glowTimer * 2) * 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  collidesWith(bird) {
    const closestX = Math.max(this.x, Math.min(bird.x, this.x + this.width));
    
    // Top obstacle check
    const closestYTop = Math.max(0, Math.min(bird.y, this.gapY));
    const distXTop = bird.x - closestX;
    const distYTop = bird.y - closestYTop;
    const distanceTop = Math.sqrt(distXTop * distXTop + distYTop * distYTop);

    if (distanceTop < bird.radius - 2) {
      return true;
    }

    // Bottom obstacle check
    const closestYBottom = Math.max(this.gapY + this.gapHeight, Math.min(bird.y, V_HEIGHT - GROUND_HEIGHT));
    const distXBottom = bird.x - closestX;
    const distYBottom = bird.y - closestYBottom;
    const distanceBottom = Math.sqrt(distXBottom * distXBottom + distYBottom * distYBottom);

    if (distanceBottom < bird.radius - 2) {
      return true;
    }

    return false;
  }
}

// --- Main Game Class ---
class GameEngine {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    
    // UI Elements
    this.startScreen = document.getElementById('start-screen');
    this.gameOverScreen = document.getElementById('game-over-screen');
    this.hud = document.getElementById('hud');
    this.playBtn = document.getElementById('play-btn');
    this.restartBtn = document.getElementById('restart-btn');
    this.muteBtn = document.getElementById('mute-btn');
    this.soundOnIcon = document.getElementById('sound-on-icon');
    this.soundOffIcon = document.getElementById('sound-off-icon');
    
    this.scoreText = document.getElementById('hud-score');
    this.bestText = document.getElementById('hud-best');
    this.goScoreText = document.getElementById('go-score');
    this.newHighScoreBanner = document.getElementById('new-high-score-banner');
    this.goComparisonText = document.getElementById('go-comparison');

    // Pilot Badge HUD
    this.hudPilotNameText = document.getElementById('hud-pilot-name');

    // Pilot Badge Start Screen
    this.startPilotNameText = document.getElementById('start-pilot-name');
    this.startPilotBestText = document.getElementById('start-pilot-best');
    this.startGlobalBestText = document.getElementById('start-global-best');

    // Pilot Badge Game Over Screen
    this.goPilotNameText = document.getElementById('go-pilot-name');
    this.goPilotBestText = document.getElementById('go-pilot-best');
    this.goGlobalBestText = document.getElementById('go-global-best');

    // Pilot Registry Elements
    this.pilotBtn = document.getElementById('pilot-registry-btn');
    this.goPilotBtn = document.getElementById('go-pilot-registry-btn');
    this.pilotScreen = document.getElementById('pilot-screen');
    this.pilotForm = document.getElementById('pilot-registration-form');
    this.pilotInput = document.getElementById('pilot-name-input');
    this.pilotList = document.getElementById('pilot-list');
    this.pilotCloseBtn = document.getElementById('pilot-close-btn');

    // Flight Logs Elements
    this.viewLogsBtn = document.getElementById('view-logs-btn');
    this.historyScreen = document.getElementById('history-screen');
    this.historyList = document.getElementById('history-list');
    this.historyCloseBtn = document.getElementById('history-close-btn');
    this.filterAllBtn = document.getElementById('filter-all-btn');
    this.filterPersonalBtn = document.getElementById('filter-personal-btn');
    this.summaryTotalRuns = document.getElementById('summary-total-runs');
    this.summaryAvgScore = document.getElementById('summary-avg-score');

    // Pause UI Elements
    this.pauseBtn = document.getElementById('pause-btn');
    this.resumeBtn = document.getElementById('resume-btn');
    this.pauseScreen = document.getElementById('pause-screen');

    // Settings UI Elements
    this.startSettingsBtn = document.getElementById('start-settings-btn');
    this.settingsScreen = document.getElementById('settings-screen');
    this.settingsSoundBtn = document.getElementById('settings-sound-btn');
    this.settingsCloseBtn = document.getElementById('settings-close-btn');

    // State Variables
    this.state = STATES.START;
    this.score = 0;
    this.isPaused = false;
    
    // Load Pilots, Active Pilot, and Game History
    this.pilots = [];
    this.activePilot = 'ACE';
    this.history = [];
    this.historyFilter = 'GLOBAL';

    try {
      const storedPilots = localStorage.getItem('wingrush_pilots');
      const storedActive = localStorage.getItem('wingrush_active_pilot');
      const storedHistory = localStorage.getItem('wingrush_history');

      if (storedPilots) {
        this.pilots = JSON.parse(storedPilots);
      }
      if (storedActive) {
        this.activePilot = storedActive;
      }
      if (storedHistory) {
        this.history = JSON.parse(storedHistory);
      }

      // Check migration from old wingrush_best
      const oldBest = parseInt(localStorage.getItem('wingrush_best')) || 0;
      if (this.pilots.length === 0) {
        this.activePilot = 'ACE';
        this.pilots.push({
          name: 'ACE',
          bestScore: oldBest,
          gamesPlayed: 0,
          totalScore: 0
        });
        localStorage.setItem('wingrush_pilots', JSON.stringify(this.pilots));
        localStorage.setItem('wingrush_active_pilot', this.activePilot);
      }

      this.highScore = Math.max(...this.pilots.map(p => p.bestScore), 0);
    } catch (e) {
      console.warn("localStorage read/migration failed:", e);
      this.pilots = [{ name: 'ACE', bestScore: 0, gamesPlayed: 0, totalScore: 0 }];
      this.activePilot = 'ACE';
      this.highScore = 0;
    }
    
    // Dynamic difficulty metrics
    this.gameSpeed = 3.0;
    this.obstacleSpacing = 280;

    // Game Feel Effects
    this.shakeTimer = 0;
    this.floatingTexts = [];
    this.energyGlows = []; // Gates cleared animation
    this.foregroundDust = [];
    this.gameOverTime = 0;

    // Initialize Foreground Dust
    for (let i = 0; i < 12; i++) {
      this.foregroundDust.push({
        x: Math.random() * V_WIDTH,
        y: Math.random() * (V_HEIGHT - GROUND_HEIGHT),
        vx: -1.5 - Math.random() * 2,
        size: 1 + Math.random() * 3,
        color: Math.random() > 0.5 ? 'rgba(0, 240, 255, 0.22)' : 'rgba(255, 42, 95, 0.22)'
      });
    }

    // Entities
    this.bird = null;
    this.obstacles = [];
    this.particles = [];
    this.parallaxLayers = [];

    // Timing
    this.lastTime = 0;
    
    // Layout and sizing setup
    this.setupCanvas();
    this.initBackground();
    this.initEventListeners();
    this.updateLeaderboard();

    // Start Loop
    requestAnimationFrame((t) => this.loop(t));
  }

  setupCanvas() {
    this.canvas.width = V_WIDTH;
    this.canvas.height = V_HEIGHT;
  }

  initBackground() {
    // Layer 1: Sky Grid & Synthwave Sun (Extremely Slow)
    this.parallaxLayers.push(new ParallaxLayer(0.05, (ctx, ox) => {
      ctx.fillStyle = '#05020c';
      ctx.fillRect(ox, 0, V_WIDTH, V_HEIGHT);
      
      // Draw Outrun Sunset Synthwave Sun
      const sunY = 320;
      const sunRadius = 90;
      ctx.save();
      const sunGrad = ctx.createLinearGradient(ox + 225, sunY - sunRadius, ox + 225, sunY + sunRadius);
      sunGrad.addColorStop(0, '#ff7300'); // neon orange top
      sunGrad.addColorStop(0.4, '#ff2a5f'); // pink mid
      sunGrad.addColorStop(1, '#05020c'); // blends with bottom sky
      ctx.fillStyle = sunGrad;
      ctx.shadowBlur = 35;
      ctx.shadowColor = '#ff2a5f';
      
      ctx.beginPath();
      ctx.arc(ox + 225, sunY, sunRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Sun slicing bars matching sunset scanlines
      ctx.fillStyle = '#05020c';
      for (let ly = sunY - sunRadius + 10; ly < sunY + sunRadius + 10; ly += 9) {
        const sliceHeight = Math.max(1.8, Math.min(5.5, (ly - (sunY - sunRadius)) / 25));
        ctx.fillRect(ox + 225 - sunRadius - 15, ly, sunRadius * 2 + 30, sliceHeight);
      }
      
      // Draw grid scanning lines for retro aesthetic
      ctx.strokeStyle = 'rgba(255, 42, 95, 0.035)';
      ctx.lineWidth = 1;
      for (let gx = 0; gx < V_WIDTH; gx += 40) {
        ctx.beginPath();
        ctx.moveTo(ox + gx, 0);
        ctx.lineTo(ox + gx, V_HEIGHT);
        ctx.stroke();
      }

      // Procedural neon stars
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.beginPath();
      const starOffsets = [
        [30, 80], [120, 150], [280, 70], [380, 190], [80, 240], 
        [220, 210], [340, 270], [160, 420], [290, 480], [50, 520]
      ];
      starOffsets.forEach(pos => {
        ctx.arc(ox + pos[0], pos[1], 1.5, 0, Math.PI * 2);
      });
      ctx.fill();
    }));

    // Layer 2: Cyber Distant Pyramids (Medium speed)
    this.parallaxLayers.push(new ParallaxLayer(0.18, (ctx, ox) => {
      ctx.fillStyle = 'rgba(22, 11, 42, 0.7)';
      ctx.beginPath();
      ctx.moveTo(ox, V_HEIGHT - GROUND_HEIGHT);
      
      // Cyber pyramids silhouettes
      ctx.lineTo(ox + 80, V_HEIGHT - GROUND_HEIGHT - 130);
      ctx.lineTo(ox + 160, V_HEIGHT - GROUND_HEIGHT);
      ctx.lineTo(ox + 220, V_HEIGHT - GROUND_HEIGHT - 80);
      ctx.lineTo(ox + 280, V_HEIGHT - GROUND_HEIGHT);
      ctx.lineTo(ox + 350, V_HEIGHT - GROUND_HEIGHT - 160);
      ctx.lineTo(ox + 430, V_HEIGHT - GROUND_HEIGHT - 40);
      ctx.lineTo(ox + V_WIDTH, V_HEIGHT - GROUND_HEIGHT);
      ctx.closePath();
      ctx.fill();

      // Cyber pyramids glowing grid outlines
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(ox + 10, V_HEIGHT - GROUND_HEIGHT - 16);
      ctx.lineTo(ox + 80, V_HEIGHT - GROUND_HEIGHT - 130);
      ctx.lineTo(ox + 150, V_HEIGHT - GROUND_HEIGHT - 16);
      
      ctx.moveTo(ox + 295, V_HEIGHT - GROUND_HEIGHT - 40);
      ctx.lineTo(ox + 350, V_HEIGHT - GROUND_HEIGHT - 160);
      ctx.lineTo(ox + 405, V_HEIGHT - GROUND_HEIGHT - 65);
      ctx.stroke();
    }));

    // Layer 3: Closer cyber mountains & fog grids (Faster speed)
    this.parallaxLayers.push(new ParallaxLayer(0.55, (ctx, ox) => {
      ctx.fillStyle = 'rgba(38, 15, 66, 0.4)';
      ctx.beginPath();
      ctx.moveTo(ox, V_HEIGHT - GROUND_HEIGHT);
      ctx.lineTo(ox + 100, V_HEIGHT - GROUND_HEIGHT - 70);
      ctx.lineTo(ox + 180, V_HEIGHT - GROUND_HEIGHT - 45);
      ctx.lineTo(ox + 250, V_HEIGHT - GROUND_HEIGHT - 90);
      ctx.lineTo(ox + 330, V_HEIGHT - GROUND_HEIGHT - 35);
      ctx.lineTo(ox + 400, V_HEIGHT - GROUND_HEIGHT - 80);
      ctx.lineTo(ox + V_WIDTH, V_HEIGHT - GROUND_HEIGHT);
      ctx.lineTo(ox + V_WIDTH, V_HEIGHT);
      ctx.lineTo(ox, V_HEIGHT);
      ctx.closePath();
      ctx.fill();

      // Draw secondary details like glowing nodes
      ctx.fillStyle = '#ff2a5f';
      ctx.beginPath();
      ctx.arc(ox + 100, V_HEIGHT - GROUND_HEIGHT - 70, 3, 0, Math.PI * 2);
      ctx.arc(ox + 250, V_HEIGHT - GROUND_HEIGHT - 90, 3, 0, Math.PI * 2);
      ctx.fill();
    }));
  }

  initEventListeners() {
    const handleAction = (e) => {
      if (e) {
        if (e.type === 'keydown') {
          if (e.code === 'KeyP') {
            e.preventDefault();
            this.togglePause();
            return;
          }
          if (e.code !== 'Space') return;
        }
        e.preventDefault();
      }

      if (this.isPaused) return;

      if (this.state === STATES.PLAYING) {
        this.bird.flap();
        // Emit speed trail particles
        for (let i = 0; i < 6; i++) {
          this.particles.push(new Particle(
            this.bird.x - 15,
            this.bird.y,
            Math.random() > 0.5 ? '#00f0ff' : '#ff2a5f',
            -3.5 - Math.random() * 4,
            (Math.random() - 0.5) * 4,
            2 + Math.random() * 3,
            14 + Math.random() * 8
          ));
        }
      } else if (this.state === STATES.GAMEOVER) {
        if (Date.now() - this.gameOverTime > 750) {
          window.gameAudio.playClick();
          this.startGame();
        }
      }
    };

    window.addEventListener('keydown', handleAction);
    
    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) { // Left click only
        handleAction(e);
      }
    });

    this.canvas.addEventListener('touchstart', (e) => {
      handleAction(e);
    }, { passive: false });

    // UI Buttons
    this.playBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      window.gameAudio.playClick();
      this.startGame();
    });

    this.restartBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      window.gameAudio.playClick();
      this.startGame();
    });

    // Pause UI triggers
    this.pauseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.togglePause();
    });

    this.resumeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.togglePause();
    });

    // Settings UI triggers
    this.startSettingsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openSettings();
    });

    this.settingsCloseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeSettings();
    });

    this.settingsSoundBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleSettingsSound();
    });

    // HUD Mute Button
    this.muteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isMuted = window.gameAudio.toggleMute();
      if (isMuted) {
        this.muteBtn.classList.add('muted');
        this.soundOnIcon.classList.add('hidden');
        this.soundOffIcon.classList.remove('hidden');
      } else {
        this.muteBtn.classList.remove('muted');
        this.soundOnIcon.classList.remove('hidden');
        this.soundOffIcon.classList.add('hidden');
      }
    });

    // Pilot Registry Triggers
    this.pilotBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openPilotRegistry();
    });

    this.goPilotBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openPilotRegistry();
    });

    this.pilotCloseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closePilotRegistry();
    });

    this.pilotForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const newName = this.pilotInput.value.trim().toUpperCase();
      if (!newName) return;

      const alphaNumRegex = /^[A-Z0-9]{2,12}$/;
      if (!alphaNumRegex.test(newName)) {
        alert("REGISTRY DENIED\nCodename must be 2 to 12 letters/numbers only.");
        return;
      }

      const exists = this.pilots.some(p => p.name === newName);
      if (exists) {
        alert("REGISTRY DENIED\nCodename already exists in pilot database.");
        return;
      }

      this.registerPilot(newName);
    });

    // Flight Logs Triggers
    this.viewLogsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openHistory();
    });

    this.historyCloseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeHistory();
    });

    this.filterAllBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleHistoryFilter('GLOBAL');
    });

    this.filterPersonalBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleHistoryFilter('PERSONAL');
    });
  }

  togglePause() {
    if (this.state !== STATES.PLAYING) return;
    this.isPaused = !this.isPaused;
    
    if (this.isPaused) {
      this.pauseScreen.classList.remove('hidden');
    } else {
      this.pauseScreen.classList.add('hidden');
    }
    window.gameAudio.playClick();
  }

  openSettings() {
    if (this.state !== STATES.START) return;
    this.updateSettingsToggle();
    this.settingsScreen.classList.remove('hidden');
    window.gameAudio.playClick();
  }

  closeSettings() {
    this.settingsScreen.classList.add('hidden');
    window.gameAudio.playClick();
  }

  toggleSettingsSound() {
    const isMuted = window.gameAudio.toggleMute();
    this.updateSettingsToggle();
    
    if (isMuted) {
      this.muteBtn.classList.add('muted');
      this.soundOnIcon.classList.add('hidden');
      this.soundOffIcon.classList.remove('hidden');
    } else {
      this.muteBtn.classList.remove('muted');
      this.soundOnIcon.classList.remove('hidden');
      this.soundOffIcon.classList.add('hidden');
    }
    window.gameAudio.playClick();
  }

  updateSettingsToggle() {
    const isMuted = window.gameAudio.isMuted;
    if (isMuted) {
      this.settingsSoundBtn.innerText = "OFF";
      this.settingsSoundBtn.classList.add('off');
    } else {
      this.settingsSoundBtn.innerText = "ON";
      this.settingsSoundBtn.classList.remove('off');
    }
  }

  updateLeaderboard() {
    const active = this.getActivePilotObj();
    const globalBest = this.getGlobalBest();

    if (this.startPilotNameText) this.startPilotNameText.innerText = this.activePilot;
    if (this.startPilotBestText) this.startPilotBestText.innerText = active ? active.bestScore : 0;
    if (this.startGlobalBestText) this.startGlobalBestText.innerText = globalBest;

    if (this.hudPilotNameText) this.hudPilotNameText.innerText = this.activePilot;
    if (this.bestText) this.bestText.innerText = active ? active.bestScore : 0;

    if (this.goPilotNameText) this.goPilotNameText.innerText = this.activePilot;
    if (this.goPilotBestText) this.goPilotBestText.innerText = active ? active.bestScore : 0;
    if (this.goGlobalBestText) this.goGlobalBestText.innerText = globalBest;
  }

  startGame() {
    window.gameAudio.init();
    window.gameAudio.playStart();
    
    // Reset state
    this.bird = new Bird();
    this.obstacles = [];
    this.particles = [];
    this.floatingTexts = [];
    this.energyGlows = [];
    this.score = 0;
    
    // Reset difficulty
    this.gameSpeed = 3.0;
    this.obstacleSpacing = 280;
    this.isPaused = false;
    
    this.scoreText.innerText = '0';
    this.newHighScoreBanner.classList.add('hidden');
    this.shakeTimer = 0;

    this.state = STATES.PLAYING;

    // UI transition
    this.startScreen.classList.add('hidden');
    this.gameOverScreen.classList.add('hidden');
    this.pauseScreen.classList.add('hidden');
    this.hud.classList.remove('hidden');
  }

  triggerGameOver() {
    this.state = STATES.GAMEOVER;
    this.shakeTimer = 25; // Trigger heavy screen shake
    this.gameOverTime = Date.now();
    
    // Save Run History Record
    this.history.push({
      pilot: this.activePilot,
      score: this.score,
      timestamp: Date.now()
    });

    // Update pilot stats
    const active = this.getActivePilotObj();
    let isNewPersonalBest = false;
    let isNewGlobalRecord = false;

    if (active) {
      active.gamesPlayed++;
      active.totalScore += this.score;
      if (this.score > active.bestScore) {
        active.bestScore = this.score;
        isNewPersonalBest = true;
      }
    }

    // Check if new global runway record
    if (this.score > this.highScore) {
      isNewGlobalRecord = true;
    }

    // Save and sync updated leaderboard
    this.saveData();
    this.updateLeaderboard();

    // Sound rewards
    if (isNewGlobalRecord || isNewPersonalBest) {
      window.gameAudio.playHighScore();
    } else {
      window.gameAudio.playCollision();
    }

    // Trigger explosive visual debris particle shockwave
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 9;
      this.particles.push(new Particle(
        this.bird.x,
        this.bird.y,
        i % 3 === 0 ? '#ff2a5f' : (i % 3 === 1 ? '#00f0ff' : '#ffffff'),
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        3 + Math.random() * 4,
        28 + Math.random() * 22
      ));
    }

    // Populate Game Over Overlay
    this.goScoreText.innerText = this.score;
    this.goPilotNameText.innerText = this.activePilot;
    this.goPilotBestText.innerText = active ? active.bestScore : 0;
    this.goGlobalBestText.innerText = this.highScore;
    
    if (isNewGlobalRecord) {
      this.newHighScoreBanner.innerHTML = "<span>NEW RUNWAY RECORD!</span>";
      this.newHighScoreBanner.classList.remove('hidden');
      this.goComparisonText.innerHTML = "🏆 GLOBAL RECORD CONQUERED! YOU ARE THE SKY KING!";
    } else if (isNewPersonalBest) {
      this.newHighScoreBanner.innerHTML = "<span>NEW PILOT BEST!</span>";
      this.newHighScoreBanner.classList.remove('hidden');
      this.goComparisonText.innerHTML = `🎖️ Codename <span class="highlight-score">${this.activePilot}</span> set a new personal record!`;
    } else {
      this.newHighScoreBanner.classList.add('hidden');
      if (this.score === 0 && (active ? active.bestScore : 0) === 0) {
        this.goComparisonText.innerHTML = "Dodge the laser gates to log flight history.";
      } else {
        const activeBest = active ? active.bestScore : 0;
        const diff = activeBest - this.score;
        if (diff === 0) {
          this.goComparisonText.innerHTML = `Matched your personal best score of <span class="highlight-high">${activeBest}</span>!`;
        } else {
          this.goComparisonText.innerHTML = `You were <span class="highlight-score">${diff}</span> ${diff === 1 ? 'point' : 'points'} away from your best of <span class="highlight-high">${activeBest}</span>.`;
        }
      }
    }

    // Show Overlay
    this.hud.classList.add('hidden');
    this.gameOverScreen.classList.remove('hidden');
  }

  spawnObstacle() {
    const minGapY = 100;
    const maxGapY = V_HEIGHT - GROUND_HEIGHT - 260; // Leave buffer for bottom
    const gapY = minGapY + Math.random() * (maxGapY - minGapY);

    // Continuous, fair gap scaling based on score
    const gapHeight = Math.max(140, 175 - this.score * 0.85);

    const obstacleX = V_WIDTH + 100;
    this.obstacles.push(new Obstacle(obstacleX, gapY, gapHeight));
  }

  // --- Primary Game Loop ---
  loop(timestamp) {
    if (!this.lastTime) this.lastTime = timestamp;
    
    let dt = (timestamp - this.lastTime) / 16.666;
    if (dt > 4) dt = 4;
    this.lastTime = timestamp;

    // Render continues to paint even when paused, but physics skip
    this.update(dt);
    this.render();

    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    if (this.isPaused) return; // Freeze updates entirely when paused

    // Background parallax update
    const speedFactor = this.state === STATES.PLAYING ? 1 : 0.15;
    this.parallaxLayers.forEach(layer => layer.update(dt, this.gameSpeed * speedFactor));

    // Foreground Dust update
    this.foregroundDust.forEach(dust => {
      dust.x += dust.vx * dt * (this.state === STATES.PLAYING ? this.gameSpeed / 3.2 : 0.25);
      if (dust.x < -20) {
        dust.x = V_WIDTH + 20;
        dust.y = Math.random() * (V_HEIGHT - GROUND_HEIGHT);
      }
    });

    // Particle update
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update(dt);
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Floating text update
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.life -= dt;
      ft.alpha = Math.max(0, ft.life / ft.maxLife);
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // Energy gate cleared glows update
    for (let i = this.energyGlows.length - 1; i >= 0; i--) {
      const eg = this.energyGlows[i];
      eg.life -= dt;
      if (eg.life <= 0) {
        this.energyGlows.splice(i, 1);
      }
    }

    if (this.state === STATES.PLAYING) {
      // Smooth dynamic difficulty scaling based on score
      this.gameSpeed = 3.0 + Math.min(2.5, this.score * 0.055);
      this.obstacleSpacing = 280 - Math.min(45, this.score * 1.3);

      this.bird.update(dt);

      // Flap trail smoke spawn
      if (Math.random() < 0.22) {
        this.particles.push(new Particle(
          this.bird.x - 18,
          this.bird.y + (Math.random() - 0.5) * 8,
          'rgba(0, 240, 255, 0.4)',
          -this.gameSpeed - 0.5,
          (Math.random() - 0.5) * 0.8,
          1.5 + Math.random() * 2,
          15 + Math.random() * 10
        ));
      }

      // Check ground/ceiling crash
      if (this.bird.y + this.bird.radius >= V_HEIGHT - GROUND_HEIGHT) {
        this.triggerGameOver();
        return;
      }

      // Obstacle spawner check
      let needSpawn = false;
      if (this.obstacles.length === 0) {
        needSpawn = true;
      } else {
        const lastObstacle = this.obstacles[this.obstacles.length - 1];
        if (lastObstacle.x < V_WIDTH - this.obstacleSpacing) {
          needSpawn = true;
        }
      }

      if (needSpawn) {
        this.spawnObstacle();
      }

      for (let i = this.obstacles.length - 1; i >= 0; i--) {
        const obs = this.obstacles[i];
        obs.update(dt, this.gameSpeed);

        // Scoring triggers
        if (!obs.passed && obs.x + obs.width < this.bird.x) {
          obs.passed = true;
          this.score++;
          this.scoreText.innerText = this.score;
          
          this.scoreText.classList.remove('scale-up');
          void this.scoreText.offsetWidth; // Force CSS reflow
          this.scoreText.classList.add('scale-up');

          window.gameAudio.playScore();

          // Push score popup text
          this.floatingTexts.push({
            x: obs.x + obs.width / 2,
            y: obs.gapY + obs.gapHeight / 2,
            text: "+1",
            vy: -1.8,
            alpha: 1,
            life: 25,
            maxLife: 25
          });

          // Check for combo/streak milestone every 5 gates cleared
          if (this.score > 0 && this.score % 5 === 0) {
            this.floatingTexts.push({
              x: V_WIDTH / 2,
              y: 240,
              text: `${this.score} STREAK!`,
              vy: -0.4,
              alpha: 1,
              life: 55,
              maxLife: 55,
              isStreak: true
            });
          }

          // Push gate surge flash
          this.energyGlows.push({
            x: obs.x,
            y: obs.gapY,
            w: obs.width,
            h: obs.gapHeight,
            life: 12,
            maxLife: 12
          });

          // Spawn star sparkles on clear
          for (let p = 0; p < 8; p++) {
            this.particles.push(new Particle(
              this.bird.x + 30,
              this.bird.y - 10,
              '#00f0ff',
              (Math.random() - 0.5) * 4,
              -1 - Math.random() * 4,
              2 + Math.random() * 2,
              20 + Math.random() * 15
            ));
          }
        }

        if (obs.collidesWith(this.bird)) {
          this.triggerGameOver();
          return;
        }

        if (obs.x + obs.width < -100) {
          this.obstacles.splice(i, 1);
        }
      }
    }
  }

  render() {
    this.ctx.clearRect(0, 0, V_WIDTH, V_HEIGHT);

    // Save context for screen shake
    this.ctx.save();
    if (this.shakeTimer > 0) {
      this.shakeTimer--;
      const dx = (Math.random() - 0.5) * 14;
      const dy = (Math.random() - 0.5) * 14;
      this.ctx.translate(dx, dy);
    }

    // Draw Parallax background layers
    this.parallaxLayers.forEach(layer => layer.draw(this.ctx));

    // Draw energy surge flashes
    this.energyGlows.forEach(eg => {
      this.ctx.save();
      const alpha = eg.life / eg.maxLife;
      this.ctx.globalAlpha = alpha;
      this.ctx.shadowBlur = 18;
      this.ctx.shadowColor = '#00f0ff';
      this.ctx.strokeStyle = '#00f0ff';
      this.ctx.lineWidth = 4;
      
      // Draw flashing top/bottom laser gates
      this.ctx.beginPath();
      this.ctx.moveTo(eg.x, eg.y);
      this.ctx.lineTo(eg.x + eg.w, eg.y);
      this.ctx.moveTo(eg.x, eg.y + eg.h);
      this.ctx.lineTo(eg.x + eg.w, eg.y + eg.h);
      this.ctx.stroke();

      // Middle horizontal beam
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 2;
      this.ctx.shadowBlur = 8;
      this.ctx.beginPath();
      this.ctx.moveTo(eg.x - 15, eg.y + eg.h / 2);
      this.ctx.lineTo(eg.x + eg.w + 15, eg.y + eg.h / 2);
      this.ctx.stroke();
      this.ctx.restore();
    });

    // Draw Obstacles (laser barrier fades based on bird X)
    this.obstacles.forEach(obs => obs.draw(this.ctx, this.bird ? this.bird.x : 0));

    // Draw Particles
    this.particles.forEach(p => p.draw(this.ctx));

    // Draw Floating Text Popups
    this.floatingTexts.forEach(ft => {
      this.ctx.save();
      this.ctx.globalAlpha = ft.alpha;
      this.ctx.textAlign = 'center';
      
      if (ft.isStreak) {
        this.ctx.fillStyle = '#ff2a5f';
        this.ctx.shadowBlur = 18;
        this.ctx.shadowColor = '#00f0ff';
        this.ctx.font = '900 28px "Orbitron", sans-serif';
      } else {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#00f0ff';
        this.ctx.font = '900 24px "Orbitron", sans-serif';
      }
      
      this.ctx.fillText(ft.text, ft.x, ft.y);
      this.ctx.restore();
    });

    // Draw Bird
    if (this.state === STATES.PLAYING || this.state === STATES.GAMEOVER) {
      this.bird.draw(this.ctx);
    }

    // Draw Foreground space dust
    this.foregroundDust.forEach(dust => {
      this.ctx.save();
      this.ctx.fillStyle = dust.color;
      this.ctx.shadowBlur = 4;
      this.ctx.shadowColor = dust.color;
      this.ctx.beginPath();
      this.ctx.arc(dust.x, dust.y, dust.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });

    // Draw Ground with neon grid strip (Cyberpunk runway style)
    this.renderGround();

    // Restore screen shake context
    this.ctx.restore();
  }

  renderGround() {
    const gy = V_HEIGHT - GROUND_HEIGHT;
    
    // Solid runway dark background
    this.ctx.fillStyle = '#0b0617';
    this.ctx.fillRect(0, gy, V_WIDTH, GROUND_HEIGHT);

    // Top Neon Cyber Line separating playfield and runway
    this.ctx.save();
    this.ctx.strokeStyle = '#ff2a5f';
    this.ctx.shadowBlur = 12;
    this.ctx.shadowColor = '#ff2a5f';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(0, gy);
    this.ctx.lineTo(V_WIDTH, gy);
    this.ctx.stroke();
    this.ctx.restore();

    // Secondary cyber runway details inside the ground
    this.ctx.fillStyle = '#1c0a2f';
    this.ctx.fillRect(0, gy + 3, V_WIDTH, 4);

    // Diagonal runway hazard marker stripes
    ctxStripOffset = (ctxStripOffset || 0) + (this.state === STATES.PLAYING ? this.gameSpeed : 0.5);
    if (ctxStripOffset > 30) ctxStripOffset = 0;

    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(255, 42, 95, 0.15)';
    this.ctx.lineWidth = 4;
    for (let sx = -30; sx < V_WIDTH + 30; sx += 30) {
      this.ctx.beginPath();
      this.ctx.moveTo(sx - ctxStripOffset, gy + 15);
      this.ctx.lineTo(sx - ctxStripOffset + 15, gy + GROUND_HEIGHT - 15);
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  // --- Pilot Registry & History Helpers ---

  saveData() {
    try {
      localStorage.setItem('wingrush_pilots', JSON.stringify(this.pilots));
      localStorage.setItem('wingrush_active_pilot', this.activePilot);
      localStorage.setItem('wingrush_history', JSON.stringify(this.history));
      const globalBest = this.getGlobalBest();
      localStorage.setItem('wingrush_best', globalBest);
      this.highScore = globalBest;
    } catch (e) {
      console.warn("Storage write failed", e);
    }
  }

  getGlobalBest() {
    if (this.pilots.length === 0) return 0;
    return Math.max(...this.pilots.map(p => p.bestScore), 0);
  }

  getActivePilotObj() {
    return this.pilots.find(p => p.name === this.activePilot) || this.pilots[0];
  }

  openPilotRegistry() {
    this.renderPilotsList();
    this.pilotScreen.classList.remove('hidden');
    window.gameAudio.playClick();
  }

  closePilotRegistry() {
    this.pilotScreen.classList.add('hidden');
    window.gameAudio.playClick();
  }

  registerPilot(name) {
    this.pilots.push({
      name: name,
      bestScore: 0,
      gamesPlayed: 0,
      totalScore: 0
    });
    this.activePilot = name;
    this.saveData();
    this.updateLeaderboard();
    this.pilotInput.value = '';
    this.renderPilotsList();
    window.gameAudio.playStart();
  }

  deletePilot(name, e) {
    e.stopPropagation();
    if (this.pilots.length <= 1) {
      alert("REGISTRY ERROR\nAt least one active pilot must remain registered.");
      return;
    }
    const confirmed = confirm(`DE-REGISTER PILOT: ${name}\nThis will permanently delete this codename and all their flight logs. Proceed?`);
    if (!confirmed) return;

    this.pilots = this.pilots.filter(p => p.name !== name);
    this.history = this.history.filter(h => h.pilot !== name);

    if (this.activePilot === name) {
      this.activePilot = this.pilots[0].name;
    }

    this.saveData();
    this.updateLeaderboard();
    this.renderPilotsList();
    window.gameAudio.playClick();
  }

  selectPilot(name) {
    this.activePilot = name;
    this.saveData();
    this.updateLeaderboard();
    this.renderPilotsList();
    window.gameAudio.playClick();
    this.closePilotRegistry();
  }

  renderPilotsList() {
    this.pilotList.innerHTML = '';
    const sorted = [...this.pilots].sort((a, b) => {
      if (b.bestScore !== a.bestScore) return b.bestScore - a.bestScore;
      return a.name.localeCompare(b.name);
    });

    sorted.forEach(pilot => {
      const isActive = pilot.name === this.activePilot;
      
      const row = document.createElement('div');
      row.className = `pilot-row ${isActive ? 'active' : ''}`;
      row.addEventListener('click', () => this.selectPilot(pilot.name));

      const left = document.createElement('div');
      left.className = 'pilot-row-left';
      
      const indicator = document.createElement('div');
      indicator.className = 'pilot-row-indicator';
      
      const nameSpan = document.createElement('span');
      nameSpan.className = 'pilot-row-name';
      nameSpan.innerText = pilot.name;

      left.appendChild(indicator);
      left.appendChild(nameSpan);

      const right = document.createElement('div');
      right.className = 'pilot-row-right';

      const scoreSpan = document.createElement('span');
      scoreSpan.className = 'pilot-row-score';
      scoreSpan.innerText = `BEST: ${pilot.bestScore}`;

      right.appendChild(scoreSpan);

      if (this.pilots.length > 1) {
        const delBtn = document.createElement('button');
        delBtn.className = 'pilot-delete-btn';
        delBtn.ariaLabel = `Delete Pilot ${pilot.name}`;
        delBtn.innerHTML = `
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
          </svg>
        `;
        delBtn.addEventListener('click', (e) => this.deletePilot(pilot.name, e));
        right.appendChild(delBtn);
      }

      row.appendChild(left);
      row.appendChild(right);
      this.pilotList.appendChild(row);
    });
  }

  openHistory() {
    this.historyFilter = 'GLOBAL';
    this.filterAllBtn.classList.add('active');
    this.filterPersonalBtn.classList.remove('active');
    this.renderHistoryList();
    
    this.pilotScreen.classList.add('hidden');
    this.historyScreen.classList.remove('hidden');
    window.gameAudio.playClick();
  }

  closeHistory() {
    this.historyScreen.classList.add('hidden');
    this.pilotScreen.classList.remove('hidden');
    this.renderPilotsList();
    window.gameAudio.playClick();
  }

  toggleHistoryFilter(filter) {
    this.historyFilter = filter;
    if (filter === 'GLOBAL') {
      this.filterAllBtn.classList.add('active');
      this.filterPersonalBtn.classList.remove('active');
    } else {
      this.filterAllBtn.classList.remove('active');
      this.filterPersonalBtn.classList.add('active');
    }
    this.renderHistoryList();
    window.gameAudio.playClick();
  }

  renderHistoryList() {
    this.historyList.innerHTML = '';
    
    const filtered = this.history.filter(run => {
      if (this.historyFilter === 'GLOBAL') return true;
      return run.pilot === this.activePilot;
    });

    const sorted = [...filtered].sort((a, b) => b.timestamp - a.timestamp);

    const totalRuns = sorted.length;
    let avgScore = 0.0;
    if (totalRuns > 0) {
      const sum = sorted.reduce((acc, curr) => acc + curr.score, 0);
      avgScore = (sum / totalRuns).toFixed(1);
    }

    this.summaryTotalRuns.innerText = totalRuns;
    this.summaryAvgScore.innerText = avgScore;

    if (sorted.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'history-empty';
      empty.innerText = "No flight logs recorded yet.";
      this.historyList.appendChild(empty);
      return;
    }

    const maxGlobalScore = this.history.length > 0 ? Math.max(...this.history.map(h => h.score)) : 0;

    sorted.forEach(run => {
      const isGlobalRecord = run.score > 0 && run.score === maxGlobalScore;
      
      const row = document.createElement('div');
      row.className = `history-row ${isGlobalRecord ? 'record-holder' : ''}`;

      const left = document.createElement('div');
      left.className = 'history-left';

      const nameSpan = document.createElement('span');
      nameSpan.className = 'history-name';
      nameSpan.innerText = run.pilot;

      const dateSpan = document.createElement('span');
      dateSpan.className = 'history-date';
      dateSpan.innerText = this.formatDate(run.timestamp);

      left.appendChild(nameSpan);
      left.appendChild(dateSpan);

      const right = document.createElement('div');
      right.className = 'history-right';

      const scoreSpan = document.createElement('span');
      scoreSpan.className = 'history-score-val';
      scoreSpan.innerText = run.score;

      right.appendChild(scoreSpan);

      if (run.score > 0) {
        if (run.score === maxGlobalScore) {
          const medal = document.createElement('span');
          medal.className = 'history-medal';
          medal.title = "Global Record";
          medal.innerText = "🏆";
          right.appendChild(medal);
        } else {
          const pilotRuns = this.history.filter(h => h.pilot === run.pilot);
          const pilotBest = pilotRuns.length > 0 ? Math.max(...pilotRuns.map(h => h.score)) : 0;
          if (run.score === pilotBest) {
            const medal = document.createElement('span');
            medal.className = 'history-medal';
            medal.title = "Personal Best";
            medal.innerText = "⭐";
            right.appendChild(medal);
          }
        }
      }

      row.appendChild(left);
      row.appendChild(right);
      this.historyList.appendChild(row);
    });
  }

  formatDate(timestamp) {
    const d = new Date(timestamp);
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const pad = (n) => n < 10 ? '0' + n : n;
    return `${months[d.getMonth()]} ${d.getDate()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}

// Global offset tracker for scrolling stripes on the ground
let ctxStripOffset = 0;

// Initialize when DOM is fully prepared
document.addEventListener('DOMContentLoaded', () => {
  new GameEngine();
});
