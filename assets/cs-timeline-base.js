/* ============================================================================
   CS Timeline Base — Shared JavaScript Utilities
   Cyrasoul Timeline Sections
   ============================================================================ */

/**
 * IntersectionObserver wrapper for scroll-triggered reveal animations.
 * Adds `--visible` modifier class when element enters viewport.
 *
 * @param {string} selector - CSS selector for elements to observe
 * @param {Object} [options]
 * @param {number} [options.threshold=0.15] - Visibility threshold (0-1)
 * @param {string} [options.rootMargin='0px 0px -60px 0px'] - Root margin
 * @param {boolean} [options.once=true] - Unobserve after first trigger
 * @param {Function} [options.onReveal] - Callback when element is revealed
 * @returns {IntersectionObserver|null}
 */
function csTimelineReveal(selector, options = {}) {
  const {
    threshold = 0.15,
    rootMargin = '0px 0px -60px 0px',
    once = true,
    onReveal = null
  } = options;

  const elements = document.querySelectorAll(selector);
  if (!elements.length) return null;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    elements.forEach((el) => {
      el.classList.add('cs-timeline__reveal--visible');
      if (onReveal) onReveal(el);
    });
    return null;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('cs-timeline__reveal--visible');
          if (onReveal) onReveal(entry.target);
          if (once) observer.unobserve(entry.target);
        }
      });
    },
    { threshold, rootMargin }
  );

  elements.forEach((el) => observer.observe(el));
  return observer;
}

/**
 * Tracks scroll progress within a container element.
 * Calls back with a normalized 0-1 value as user scrolls through.
 *
 * @param {HTMLElement} container - The scrollable/trackable container
 * @param {Function} onProgress - Callback receiving progress (0-1)
 * @returns {Function} cleanup - Call to remove scroll listener
 */
function csTimelineScrollProgress(container, onProgress) {
  if (!container || typeof onProgress !== 'function') return () => {};

  let ticking = false;

  function update() {
    const rect = container.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const totalTravel = rect.height + viewportHeight;
    const traveled = viewportHeight - rect.top;
    const progress = Math.min(Math.max(traveled / totalTravel, 0), 1);
    onProgress(progress);
    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  update();

  return () => window.removeEventListener('scroll', onScroll);
}

/**
 * Auto-advance timer for cycling through items.
 * Pauses on interaction, resumes after idle period.
 *
 * @param {Object} options
 * @param {number} options.count - Total number of items
 * @param {number} [options.interval=4000] - Ms between advances
 * @param {number} [options.resumeDelay=8000] - Ms idle before auto-resume
 * @param {Function} options.onChange - Called with new index
 * @returns {{ pause: Function, resume: Function, goTo: Function, destroy: Function }}
 */
function csTimelineAutoAdvance(options) {
  const {
    count,
    interval = 4000,
    resumeDelay = 8000,
    onChange
  } = options;

  let current = 0;
  let timer = null;
  let resumeTimer = null;
  let paused = false;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    return {
      pause() {},
      resume() {},
      goTo(i) { current = i; onChange(current); },
      destroy() {}
    };
  }

  function advance() {
    current = (current + 1) % count;
    onChange(current);
  }

  function start() {
    stop();
    timer = setInterval(advance, interval);
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
  }

  function pause() {
    paused = true;
    stop();
    if (resumeTimer) clearTimeout(resumeTimer);
    resumeTimer = setTimeout(() => {
      paused = false;
      start();
    }, resumeDelay);
  }

  function resume() {
    paused = false;
    if (resumeTimer) clearTimeout(resumeTimer);
    start();
  }

  function goTo(index) {
    current = index;
    onChange(current);
    pause();
  }

  function destroy() {
    stop();
    if (resumeTimer) clearTimeout(resumeTimer);
  }

  start();

  return { pause, resume, goTo, destroy };
}

/**
 * Creates a staggered reveal for child elements within a container.
 *
 * @param {HTMLElement} container - Parent element
 * @param {string} childSelector - Selector for children to stagger
 * @param {number} [delayMs=80] - Delay between each child
 */
function csTimelineStaggerReveal(container, childSelector, delayMs = 80) {
  if (!container) return;

  const children = container.querySelectorAll(childSelector);
  children.forEach((child, i) => {
    child.style.transitionDelay = `${i * delayMs}ms`;
  });
}

/**
 * Debounce utility.
 *
 * @param {Function} fn
 * @param {number} wait
 * @returns {Function}
 */
function csTimelineDebounce(fn, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), wait);
  };
}

/**
 * Simple lerp (linear interpolation).
 *
 * @param {number} start
 * @param {number} end
 * @param {number} t - Progress 0-1
 * @returns {number}
 */
function csTimelineLerp(start, end, t) {
  return start + (end - start) * t;
}
