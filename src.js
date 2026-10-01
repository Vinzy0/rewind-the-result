import './style.css';
import { gsap } from 'gsap';

const $ = (selector) => document.querySelector(selector);
const stage = $('#stage');
const planes = [...document.querySelectorAll('.plane')];
const state = { rewind: 0, focus: -1, focusAmount: 0, ai: false };
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const titles = ['The input', 'The context', 'The automation', 'The result'];
const descriptions = [
  'A customer asks a question.\nThe system has something to work with.',
  'Relevant business knowledge gives\nthe AI something useful to say.',
  'Enquiry, retrieval, and drafting\nbecome one coordinated workflow.',
  'A useful action on the surface.\nA whole system underneath.',
];
let open = false;
let active = 3;
let lineLength = 0;
let pulse = 0;
let animation;
let focusAnimation;
let queryTimer;
let scale = 1;

function updateCaption(index, all = false) {
  active = index;
  $('#observation-title').textContent = all ? 'The system underneath' : titles[index];
  $('#observation-copy').innerText = all ? 'One result, four connected moments.\nChoose a moment to look closer.' : descriptions[index];
  document.querySelectorAll('[data-focus]').forEach(b => b.classList.toggle('current', !all && Number(b.dataset.focus) === index));
}

function drawThread() {
  const rect = stage.getBoundingClientRect();
  const points = planes.map(plane => {
    const anchor = plane.querySelector('.signal-anchor').getBoundingClientRect();
    return { x: anchor.left + anchor.width / 2 - rect.left, y: anchor.top + anchor.height / 2 - rect.top };
  });
  const d = points.map((p, i) => {
    if (!i) return `M${p.x},${p.y}`;
    const prev = points[i - 1];
    return `C${prev.x + 35 * scale},${prev.y - 30 * scale} ${p.x - 35 * scale},${p.y + 30 * scale} ${p.x},${p.y}`;
  }).join(' ');
  $('#thread-base').setAttribute('d', d);
  $('#thread-active').setAttribute('d', d);
  lineLength = $('#thread-active').getTotalLength();
  $('#thread-active').style.strokeDasharray = `${lineLength}`;
  $('#thread-active').style.strokeDashoffset = `${lineLength * (1 - state.rewind)}`;
}

function render() {
  const p = state.rewind;
  const mobile = stage.clientWidth < 600;
  const a = state.focusAmount;
  scale = Math.min(1.14, stage.clientWidth / (mobile ? 630 : 820));
  const fannedScale = scale * (mobile ? 0.66 : 0.49);
  const restScale = Math.min(0.98, (stage.clientWidth - 95) / planes[0].offsetWidth, (stage.clientHeight - 130) / planes[0].offsetHeight);
  planes.forEach((plane, i) => {
    const n = i - 1.5;
    const selected = i === state.focus;
    const targetX = mobile ? n * 36 : n * 122;
    const targetY = mobile ? -n * 100 : -n * 42;
    let x = 8 + (3 - i) * -5 * (1 - p) + targetX * scale * p;
    let y = 7 + (3 - i) * 4 * (1 - p) + targetY * scale * p;
    let z = i * 4 + i * (mobile ? 10 : 22) * p;
    let rx = 9 + 32 * p;
    let ry = -8 - 2 * p;
    let rz = -4 - 11 * p;
    let s = restScale + (fannedScale - restScale) * p;
    if (a > 0) {
      if (selected) {
        x += ((mobile ? -5 : state.ai ? -130 : -20) - x) * a;
        y += ((mobile && state.ai ? -37 : 0) - y) * a;
        z += (280 - z) * a;
        rx *= 1 - a;
        ry *= 1 - a;
        rz *= 1 - a;
        const focusScale = Math.min(mobile ? state.ai ? 0.34 : 0.45 : state.ai ? 0.55 : 0.73, (stage.clientHeight - 140) / plane.offsetHeight * 0.78);
        s += (focusScale - s) * a;
      } else {
        x += n * 75 * scale * a;
        y += (i < state.focus ? 42 : -42) * scale * a;
        s *= 1 - a * 0.15;
      }
    }
    gsap.set(plane, { x, y, z, rotationX: rx, rotationY: ry, rotationZ: rz, scale: s });
    plane.style.setProperty('--dim', `${selected ? 0 : a * 0.57 + (i === 3 ? 0 : (1 - p) * 0.12)}`);
  });
  $('#stage-note').style.opacity = 0;
  $('#thread').style.opacity = p * (1 - a * 0.85);
  const time = a > 0.5 ? state.focus / 3 : 1 - p;
  $('#scrubber').value = Math.round(time * 1000);
  $('#timeline-fill').style.width = `${time * 100}%`;
  drawThread();
}

function animateRewind(value, duration = 2.25, completion) {
  animation?.kill();
  animation = gsap.to(state, { rewind: value, duration: reduced ? 0 : duration, ease: 'power3.inOut', onUpdate: render, onComplete: () => { render(); completion?.(); } });
}

function unfocus(duration = 0.6) {
  focusAnimation?.kill();
  focusAnimation = gsap.to(state, { focusAmount: 0, duration: reduced ? 0 : duration, ease: 'power3.out', onUpdate: render, onComplete: () => { state.focus = -1; } });
}

function reveal() {
  open = true;
  $('#timeline').hidden = false;
  $('#restore').hidden = false;
  $('#instrument-hint').hidden = true;
  $('#rewind span').textContent = 'Rewind again';
  $('#mode-label').textContent = 'SYSTEM VIEW';
  $('#stage-bottom-text').textContent = 'Drag through time. Select a moment to inspect.';
  $('#ai-annotation').hidden = true;
  unfocus(0.45);
  updateCaption(0, true);
  animateRewind(1);
}

function focusLayer(index, ai = false) {
  animation?.kill();
  state.ai = ai;
  state.focus = index;
  updateCaption(index);
  $('#mode-label').textContent = ai ? 'AI OBSERVATION' : `INSPECTING ${titles[index].replace('The ', '').toUpperCase()}`;
  if (!open) {
    open = true;
    $('#timeline').hidden = false;
    $('#restore').hidden = false;
    $('#instrument-hint').hidden = true;
    $('#rewind span').textContent = 'Rewind again';
  }
  focusAnimation?.kill();
  focusAnimation = gsap.to(state, { rewind: 1, focusAmount: 1, duration: reduced ? 0 : 1.35, ease: 'power3.inOut', onUpdate: render });
  $('#stage-bottom-text').textContent = 'An observation of the same system.';
  if (!ai) $('#ai-annotation').hidden = true;
}

function restore() {
  clearTimeout(queryTimer);
  $('#ask-form button[type=submit]').disabled = false;
  $('#ai-annotation').hidden = true;
  $('#mode-label').textContent = 'RESULT VIEW';
  $('#stage-bottom-text').textContent = 'A completed result. An invisible process.';
  updateCaption(3);
  unfocus(0.65);
  animateRewind(0, 1.7, () => {
    open = false;
    $('#timeline').hidden = true;
    $('#restore').hidden = true;
    $('#instrument-hint').hidden = false;
    $('#rewind span').textContent = 'See how this happened';
  });
}

$('#rewind').addEventListener('click', () => {
  if (open && state.rewind > 0.8) {
    unfocus();
    animateRewind(0, 0.85, reveal);
  } else reveal();
});
$('#restore').addEventListener('click', restore);
$('#tavo-select').addEventListener('click', restore);
$('#scrubber').addEventListener('input', e => {
  animation?.kill(); focusAnimation?.kill();
  state.focusAmount = 0; state.focus = -1;
  state.rewind = 1 - Number(e.target.value) / 1000;
  $('#ai-annotation').hidden = true;
  $('#mode-label').textContent = 'REWINDING';
  updateCaption(Math.min(3, Math.floor(Number(e.target.value) / 250)));
  render();
});
document.querySelectorAll('[data-focus]').forEach(b => b.addEventListener('click', () => focusLayer(Number(b.dataset.focus))));

$('#ask-toggle').addEventListener('click', () => {
  const showing = $('#ask-form').hidden;
  $('#ask-form').hidden = !showing;
  $('#ask-toggle').setAttribute('aria-expanded', showing);
  if (showing) $('#ask-input').focus({ preventScroll: true });
});

function answer(query) {
  if (!query.trim()) { $('#ask-input').focus(); return; }
  clearTimeout(queryTimer);
  $('#ask-input').value = query;
  $('#mode-label').textContent = 'FINDING AN OBSERVATION';
  $('#ask-form button[type=submit]').disabled = true;
  const lower = query.toLowerCase();
  let result;
  if (/automat|workflow|integrat|api/.test(lower)) {
    result = { layer: 2, title: 'The action is a sequence.', copy: 'In this illustrative workflow, an enquiry triggers retrieval, an AI draft, and a review step. The automation coordinates them; AI is one part of the system.' };
  } else if (/vince|build|backend|project|skill/.test(lower)) {
    result = { layer: 3, title: 'Useful software, end to end.', copy: 'Vince focuses on backend systems, AI and LLM applications, automation, RAG, APIs, and full-stack development. Tavo brings those interests into an AI-assisted CRM.' };
  } else {
    result = { layer: 1, title: 'Context before generation.', copy: 'This example shows relevant business knowledge being retrieved before a reply is drafted. Inspect the source excerpt: it gives the response a purpose beyond fluent words.' };
  }
  queryTimer = setTimeout(() => {
    focusLayer(result.layer, true);
    $('#ai-title').textContent = result.title;
    $('#ai-copy').textContent = result.copy;
    $('#ai-annotation').hidden = false;
    gsap.fromTo($('#ai-annotation'), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: reduced ? 0 : 0.7, delay: reduced ? 0 : 0.65, ease: 'power3.out' });
    $('#ask-form button[type=submit]').disabled = false;
    $('#ask-form').hidden = true;
    $('#ask-toggle').setAttribute('aria-expanded', 'false');
  }, reduced ? 0 : 650);
}
$('#ask-form').addEventListener('submit', e => { e.preventDefault(); answer($('#ask-input').value); });
document.querySelectorAll('[data-query]').forEach(b => b.addEventListener('click', () => answer(b.dataset.query)));
$('#ai-clear').addEventListener('click', () => { $('#ai-annotation').hidden = true; unfocus(); updateCaption(0, true); $('#mode-label').textContent = 'SYSTEM VIEW'; });

const information = {
  profile: ['Hello, I’m Vince.', 'Computer Science student and developer focused on backend systems, AI and LLM applications, automation, full-stack development, RAG, APIs, and integrations. Tavo is my AI-assisted CRM and business automation project.'],
  resume: ['Résumé', 'The full portfolio will link to Vince’s résumé here. This short concept study contains the Tavo interaction.'],
  contact: ['Let’s build something useful.', 'Contact information will be available here in the full portfolio. For this concept study, explore Tavo and the systems behind it.'],
};
document.querySelectorAll('[data-info]').forEach(button => button.addEventListener('click', () => {
  const info = information[button.dataset.info];
  $('#info-title').textContent = info[0]; $('#info-copy').textContent = info[1]; $('#info-dialog').showModal();
}));
$('.dialog-close').addEventListener('click', () => $('#info-dialog').close());
$('#info-dialog').addEventListener('click', e => { if (e.target === $('#info-dialog')) $('#info-dialog').close(); });
window.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#info-dialog').open) { $('#ask-form').hidden = true; $('#ask-toggle').setAttribute('aria-expanded', 'false'); if (!$('#ai-annotation').hidden) $('#ai-clear').click(); else if (state.focusAmount > 0) unfocus(); } });

gsap.ticker.add(() => {
  if (state.rewind > 0.1 && state.focusAmount < 0.5 && lineLength > 0 && !reduced) {
    pulse = (pulse + 0.003) % 1;
    const point = $('#thread-active').getPointAtLength(lineLength * (1 - pulse));
    $('#thread-dot').setAttribute('cx', point.x); $('#thread-dot').setAttribute('cy', point.y);
  }
});
new ResizeObserver(render).observe(stage);
document.fonts.ready.then(render);
render();
