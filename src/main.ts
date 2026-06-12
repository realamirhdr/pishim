import './style.css';
import { sendTelegram } from './telegram';

interface Question {
  text: string;
  sticker: string;
  yesLabel: string;
  noLabel: string;
  yesResponse: string;
  noResponse: string;
  noThreshold?: number;
}

const questions: Question[] = [
  {
    text: 'آشتی باشیم؟',
    sticker: '/sticker231.webp',
    yesLabel: 'هیم:))',
    noLabel: 'نه ',
    yesResponse: 'توروخدا اینطوری هیچوقت باهام قهر نکن',
    noResponse: ':)',
  },
  {
    text: 'انقد؟',
    sticker: '/sticker.webp',
    yesLabel: 'اره',
    noLabel: 'نه',
    yesResponse: 'توروخدا اینطوری هیچوقت باهام قهر نکن',
    noResponse: ':)',
    noThreshold: 1,
  },
];

let questionIndex = 0;

type CardState = 'asking' | 'yes' | 'no';

let state: CardState = 'asking';

function currentQuestion(): Question {
  return questions[questionIndex];
}

function renderCard(): string {
  const q = currentQuestion();

  if (state === 'asking') {
    return `
      <div class="card" id="card">
        <img src="${q.sticker}" class="card-sticker" alt="" />
        <p class="question-text">${q.text}</p>
        <div class="button-row">
          <button class="btn btn-yes" id="btn-yes">${q.yesLabel}</button>
          <button class="btn btn-no" id="btn-no">${q.noLabel}</button>
        </div>
      </div>
    `;
  }

  const message = state === 'yes' ? q.yesResponse : q.noResponse;
  const iconClass = state === 'yes' ? 'icon-yes' : 'icon-no';

  const collage = state === 'yes' ? `
    <div class="sticker-collage">
      <img src="/sticker1.webp" alt="" class="collage-img collage-img-1" />
      <img src="/sticker2.webp" alt="" class="collage-img collage-img-2" />
      <img src="/sticker3.webp" alt="" class="collage-img collage-img-3" />
      <img src="/sticker4.webp" alt="" class="collage-img collage-img-4" />
    </div>
  ` : `
    <div class="response-icon ${iconClass}">♡</div>
  `;

  const telegramBtn = state === 'yes'
    ? `<a class="btn btn-telegram" href="tg://user?id=565577159" target="_blank">your juj is cheshm entezar</a>`
    : '';

  return `
    <div class="card card-answered" id="card">
      ${collage}
      <p class="response-text">${message}</p>
      ${telegramBtn}
    </div>
  `;
}

function mount(): void {
  stopYesCelebration();
  const app = document.querySelector<HTMLDivElement>('#app')!;
  app.innerHTML = `<main class="page">${renderCard()}</main>`;
  attachListeners();
  if (state === 'yes') startYesCelebration();
}

let stopDodge: (() => void) | null = null;

function attachListeners(): void {
  if (stopDodge) { stopDodge(); stopDodge = null; }

  const q = currentQuestion();

  document.getElementById('btn-yes')?.addEventListener('click', () => {
    const isConfirmingNo = questionIndex > 0;
    state = isConfirmingNo ? 'no' : 'yes';
    sendTelegram(isConfirmingNo ? 'she hates you' : 'she is ashti');
    animateOut(() => mount());
  });

  const btnNo = document.getElementById('btn-no');
  if (btnNo) stopDodge = makeDodgy(btnNo, q.noThreshold ?? 23, () => {
    if (questionIndex < questions.length - 1) {
      questionIndex++;
    } else {
      questionIndex = 0;
    }
    animateOut(() => mount());
  });

}

function makeDodgy(btn: HTMLElement, threshold: number, onThreshold: () => void): () => void {
  const RADIUS = 130;
  const MARGIN = 20;
  const THRESHOLD = threshold;

  const orig = btn.getBoundingClientRect();
  let ox = 0;
  let oy = 0;
  let dodgeCount = 0;
  let attempts = 0;

  function recordAttempt(): boolean {
    attempts++;
    spawnFloatingText('نداریم تموم شده');
    if (attempts >= THRESHOLD) {
      onThreshold();
      return true;
    }
    btn.textContent = currentQuestion().noLabel.trim() + ' ' + '!'.repeat(attempts);
    return false;
  }

  btn.style.transition = 'transform 0.12s ease-out';

  function dodge(clientX: number, clientY: number, speed: number): void {
    const centerX = orig.left + ox + orig.width / 2;
    const centerY = orig.top + oy + orig.height / 2;
    const dx = centerX - clientX;
    const dy = centerY - clientY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > RADIUS) return;

    let fx: number;
    let fy: number;
    if (dist < 1) {
      const tcx = window.innerWidth  / 2 - centerX;
      const tcy = window.innerHeight / 2 - centerY;
      const tl  = Math.sqrt(tcx * tcx + tcy * tcy) || 1;
      fx = tcx / tl;
      fy = tcy / tl;
    } else {
      fx = dx / dist;
      fy = dy / dist;
    }

    const len = Math.sqrt(fx * fx + fy * fy) || 1;

    const minOx = MARGIN - orig.left;
    const maxOx = window.innerWidth  - MARGIN - orig.right;
    const minOy = MARGIN - orig.top;
    const maxOy = window.innerHeight - MARGIN - orig.bottom;

    const prevOx = ox;
    const prevOy = oy;

    let newOx = ox + (fx / len) * speed;
    let newOy = oy + (fy / len) * speed;

    if (newOx < minOx) newOx = minOx + (minOx - newOx);
    if (newOx > maxOx) newOx = maxOx - (newOx - maxOx);
    if (newOy < minOy) newOy = minOy + (minOy - newOy);
    if (newOy > maxOy) newOy = maxOy - (newOy - maxOy);

    ox = Math.max(minOx, Math.min(maxOx, newOx));
    oy = Math.max(minOy, Math.min(maxOy, newOy));

    if (Math.abs(ox - prevOx) > 2 || Math.abs(oy - prevOy) > 2) {
      dodgeCount++;
      const noScale = Math.max(1 - dodgeCount * 0.03, 0.35);
      btn.style.transform = `translate(${ox}px, ${oy}px) scale(${noScale})`;

      const btnYes = document.getElementById('btn-yes');
      if (btnYes) {
        const yesScale = Math.min(1 + dodgeCount * 0.06, 2.8);
        btnYes.style.setProperty('--yes-scale', String(yesScale));
      }
    } else {
      btn.style.transform = `translate(${ox}px, ${oy}px)`;
    }
  }

  function onMouseMove(e: MouseEvent): void {
    dodge(e.clientX, e.clientY, 150);
  }

  function onTouchMove(e: TouchEvent): void {
    const t = e.touches[0];
    if (t) dodge(t.clientX, t.clientY, 200);
  }

  function onTouchStart(e: TouchEvent): void {
    e.preventDefault();
    if (recordAttempt()) return;
    const t = e.touches[0];
    if (t) dodge(t.clientX, t.clientY, 250);
  }

  function onMouseDown(): void {
    if (recordAttempt()) return;
  }

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('touchmove', onTouchMove, { passive: true });
  btn.addEventListener('touchstart', onTouchStart, { passive: false });
  btn.addEventListener('mousedown', onMouseDown);

  return () => {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('touchmove', onTouchMove);
    btn.removeEventListener('touchstart', onTouchStart);
    btn.removeEventListener('mousedown', onMouseDown);
    btn.style.transform = '';
    btn.style.transition = '';
  };
}

let celebrationTimers: number[] = [];

function startYesCelebration(): void {
  celebrationTimers.push(window.setInterval(() => spawnCelebrationText('عاشقتم ابسولوت اینفینیتی'), 350));
  celebrationTimers.push(window.setInterval(() => spawnHeart(), 120));
  celebrationTimers.push(window.setInterval(() => spawnCelebrationGif(), 600));
}

function stopYesCelebration(): void {
  celebrationTimers.forEach(id => clearInterval(id));
  celebrationTimers = [];
  document.querySelectorAll('.celebration-text, .rain-heart').forEach(el => el.remove());
}

function spawnCelebrationText(text: string): void {
  const el = document.createElement('div');
  el.className = 'celebration-text';
  el.textContent = text;
  el.style.left = `${Math.random() * 80 + 10}vw`;
  el.style.top  = `${Math.random() * 80 + 10}vh`;
  document.body.appendChild(el);
  el.addEventListener('animationend', () => el.remove(), { once: true });
}

function spawnHeart(): void {
  const glyphs = ['♥', '💕', '💗', '💖', '💝', '❤️'];
  const el = document.createElement('div');
  el.className = 'rain-heart';
  el.textContent = glyphs[Math.floor(Math.random() * glyphs.length)];
  el.style.left = `${Math.random() * 100}vw`;
  el.style.fontSize = `${Math.random() * 1.4 + 0.9}rem`;
  el.style.animationDuration = `${Math.random() * 2 + 1.5}s`;
  document.body.appendChild(el);
  el.addEventListener('animationend', () => el.remove(), { once: true });
}

function spawnCelebrationGif(): void {
  const el = document.createElement('img');
  el.className = 'celebration-gif';
  el.src = '/200w.gif';
  el.style.left = `${Math.random() * 85 + 5}vw`;
  el.style.top  = `${Math.random() * 85 + 5}vh`;
  el.style.width = `${Math.random() * 60 + 60}px`;
  document.body.appendChild(el);
  el.addEventListener('animationend', () => el.remove(), { once: true });
}

function spawnFloatingText(text: string): void {
  const el = document.createElement('div');
  el.className = 'floating-no';
  el.textContent = text;
  el.style.left = `${Math.random() * 80 + 10}vw`;
  el.style.top  = `${Math.random() * 80 + 10}vh`;
  document.body.appendChild(el);
  el.addEventListener('animationend', () => el.remove(), { once: true });
}

function animateOut(callback: () => void): void {
  const card = document.getElementById('card');
  if (!card) { callback(); return; }
  card.classList.add('card-exit');
  card.addEventListener('animationend', () => callback(), { once: true });
}

mount();
