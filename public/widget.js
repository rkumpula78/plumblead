/**
 * PlumbLead.ai Embeddable Widget v1.0
 * Drop this on any plumber website to add an AI quote chat bubble.
 *
 * Usage:
 * <script
 *   src="https://plumblead.ai/widget.js"
 *   data-client="CLIENT_ID"
 *   data-color="#F5A623"
 *   data-position="right"
 *   data-lang="en"
 * ></script>
 */
(function () {
  'use strict';

  // ─── Config ──────────────────────────────────────────────────────────────────
  var script = document.currentScript ||
    (function () {
      var scripts = document.getElementsByTagName('script');
      return scripts[scripts.length - 1];
    })();

  var config = {
    clientId:  script.getAttribute('data-client')   || 'default',
    color:     script.getAttribute('data-color')    || '#F5A623',
    position:  script.getAttribute('data-position') || 'right',
    lang:      script.getAttribute('data-lang')     || 'en',
    baseUrl:   script.getAttribute('data-base-url') || 'https://plumblead.ai',
  };

  // Don't load twice
  if (window.__plumblead_loaded) return;
  window.__plumblead_loaded = true;

  // ─── Styles ──────────────────────────────────────────────────────────────────
  var css = [
    /* Bubble button */
    '.pl-bubble {',
    '  position: fixed;',
    '  bottom: 24px;',
    '  ' + (config.position === 'left' ? 'left' : 'right') + ': 24px;',
    '  width: 60px;',
    '  height: 60px;',
    '  border-radius: 50%;',
    '  background: ' + config.color + ';',
    '  border: none;',
    '  cursor: pointer;',
    '  box-shadow: 0 4px 24px rgba(0,0,0,0.25);',
    '  z-index: 999998;',
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '  transition: transform 0.2s ease, box-shadow 0.2s ease;',
    '  outline: none;',
    '  font-family: sans-serif;',
    '}',
    '.pl-bubble:hover {',
    '  transform: scale(1.08);',
    '  box-shadow: 0 6px 32px rgba(0,0,0,0.3);',
    '}',
    '.pl-bubble svg { pointer-events: none; }',

    /* Notification dot */
    '.pl-dot {',
    '  position: absolute;',
    '  top: 4px;',
    '  right: 4px;',
    '  width: 14px;',
    '  height: 14px;',
    '  background: #D83030;',
    '  border-radius: 50%;',
    '  border: 2px solid #fff;',
    '  animation: pl-pulse 2s infinite;',
    '}',
    '@keyframes pl-pulse {',
    '  0%, 100% { transform: scale(1); opacity: 1; }',
    '  50% { transform: scale(1.2); opacity: 0.8; }',
    '}',

    /* Tooltip */
    '.pl-tooltip {',
    '  position: fixed;',
    '  bottom: 96px;',
    '  ' + (config.position === 'left' ? 'left' : 'right') + ': 24px;',
    '  background: #0D0D0D;',
    '  color: #fff;',
    '  padding: 10px 16px;',
    '  font-size: 13px;',
    '  font-weight: 600;',
    '  font-family: sans-serif;',
    '  white-space: nowrap;',
    '  z-index: 999997;',
    '  box-shadow: 0 4px 16px rgba(0,0,0,0.2);',
    '  opacity: 0;',
    '  transform: translateY(6px);',
    '  transition: opacity 0.25s ease, transform 0.25s ease;',
    '  pointer-events: none;',
    '}',
    '.pl-tooltip::after {',
    '  content: "";',
    '  position: absolute;',
    '  bottom: -6px;',
    '  ' + (config.position === 'left' ? 'left' : 'right') + ': 22px;',
    '  border-left: 6px solid transparent;',
    '  border-right: 6px solid transparent;',
    '  border-top: 6px solid #0D0D0D;',
    '}',
    '.pl-tooltip.pl-show {',
    '  opacity: 1;',
    '  transform: translateY(0);',
    '}',

    /* Modal overlay */
    '.pl-overlay {',
    '  position: fixed;',
    '  inset: 0;',
    '  background: rgba(0,0,0,0.5);',
    '  z-index: 999998;',
    '  opacity: 0;',
    '  transition: opacity 0.25s ease;',
    '  pointer-events: none;',
    '}',
    '.pl-overlay.pl-open {',
    '  opacity: 1;',
    '  pointer-events: all;',
    '}',

    /* Modal panel */
    '.pl-panel {',
    '  position: fixed;',
    '  z-index: 999999;',
    '  background: #fff;',
    '  box-shadow: 0 8px 48px rgba(0,0,0,0.3);',
    '  display: flex;',
    '  flex-direction: column;',
    '  overflow: hidden;',
    '  transform: translateY(20px) scale(0.97);',
    '  opacity: 0;',
    '  transition: transform 0.25s ease, opacity 0.25s ease;',
    '  /* Desktop: anchored bottom-right */,',
    '  bottom: 96px;',
    '  ' + (config.position === 'left' ? 'left' : 'right') + ': 24px;',
    '  width: 420px;',
    '  height: 620px;',
    '  border-top: 4px solid ' + config.color + ';',
    '}',
    '.pl-panel.pl-open {',
    '  transform: translateY(0) scale(1);',
    '  opacity: 1;',
    '}',

    /* Mobile: full screen */
    '@media (max-width: 520px) {',
    '  .pl-panel {',
    '    inset: 0 !important;',
    '    width: 100% !important;',
    '    height: 100% !important;',
    '    bottom: 0 !important;',
    '    right: 0 !important;',
    '    left: 0 !important;',
    '    border-radius: 0 !important;',
    '    border-top-width: 4px;',
    '  }',
    '  .pl-bubble {',
    '    bottom: 16px;',
    '    ' + (config.position === 'left' ? 'left' : 'right') + ': 16px;',
    '  }',
    '}',

    /* Panel header */
    '.pl-header {',
    '  background: #0D0D0D;',
    '  padding: 14px 20px;',
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: space-between;',
    '  flex-shrink: 0;',
    '}',
    '.pl-header-left { display: flex; align-items: center; gap: 10px; }',
    '.pl-logo {',
    '  width: 32px; height: 32px; border-radius: 50%;',
    '  background: ' + config.color + ';',
    '  display: flex; align-items: center; justify-content: center;',
    '  font-size: 11px; font-weight: 700; color: #000; font-family: sans-serif;',
    '}',
    '.pl-header-text { display: flex; flex-direction: column; gap: 1px; }',
    '.pl-header-name { font-size: 13px; font-weight: 700; color: #fff; font-family: sans-serif; }',
    '.pl-header-status { font-size: 11px; color: #4CAF50; font-family: sans-serif; }',
    '.pl-close {',
    '  background: none; border: none; cursor: pointer;',
    '  color: #5C5A53; font-size: 20px; line-height: 1;',
    '  padding: 4px; transition: color 0.15s;',
    '}',
    '.pl-close:hover { color: #fff; }',

    /* iFrame */
    '.pl-iframe {',
    '  flex: 1;',
    '  border: none;',
    '  width: 100%;',
    '  display: block;',
    '}',

    /* Footer */
    '.pl-footer {',
    '  background: #0D0D0D;',
    '  padding: 8px 16px;',
    '  text-align: center;',
    '  font-size: 10px;',
    '  color: #5C5A53;',
    '  font-family: sans-serif;',
    '  flex-shrink: 0;',
    '}',
    '.pl-footer a { color: ' + config.color + '; text-decoration: none; }',
  ].join('\n');

  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // ─── Build DOM ───────────────────────────────────────────────────────────────

  // Overlay (click to close)
  var overlay = document.createElement('div');
  overlay.className = 'pl-overlay';

  // Panel
  var panel = document.createElement('div');
  panel.className = 'pl-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'PlumbLead.ai Instant Quote');

  // Header
  var header = document.createElement('div');
  header.className = 'pl-header';
  header.innerHTML = [
    '<div class="pl-header-left">',
    '  <div class="pl-logo">PL</div>',
    '  <div class="pl-header-text">',
    '    <span class="pl-header-name">PlumbLead.ai</span>',
    '    <span class="pl-header-status">&#9679; Online Now</span>',
    '  </div>',
    '</div>',
    '<button class="pl-close" aria-label="Close">&#10005;</button>',
  ].join('');

  // iFrame — points to the quote tool
  var iframeUrl = config.baseUrl + '/quote?widget=1&client=' + encodeURIComponent(config.clientId) + '&lang=' + config.lang;
  var iframe = document.createElement('iframe');
  iframe.className = 'pl-iframe';
  iframe.setAttribute('src', iframeUrl);
  iframe.setAttribute('title', 'PlumbLead.ai Instant Quote');
  iframe.setAttribute('loading', 'lazy');
  iframe.setAttribute('allow', 'forms');

  // Footer
  var footer = document.createElement('div');
  footer.className = 'pl-footer';
  footer.innerHTML = 'Powered by <a href="https://plumblead.ai" target="_blank" rel="noopener">PlumbLead.ai</a>';

  panel.appendChild(header);
  panel.appendChild(iframe);
  panel.appendChild(footer);

  // Tooltip
  var tooltip = document.createElement('div');
  tooltip.className = 'pl-tooltip';
  tooltip.textContent = config.lang === 'es' ? 'Obtener cotización gratis' : 'Get a Free Instant Quote';

  // Bubble button
  var bubble = document.createElement('button');
  bubble.className = 'pl-bubble';
  bubble.setAttribute('aria-label', 'Open PlumbLead.ai Quote Tool');
  bubble.setAttribute('aria-expanded', 'false');
  bubble.innerHTML = [
    /* Chat icon (closed state) */
    '<svg class="pl-icon-chat" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
    '  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    '</svg>',
    /* X icon (open state) — hidden by default */
    '<svg class="pl-icon-close" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2.5" stroke-linecap="round" style="display:none">',
    '  <line x1="18" y1="6" x2="6" y2="18"/>',
    '  <line x1="6" y1="6" x2="18" y2="18"/>',
    '</svg>',
    '<div class="pl-dot"></div>',
  ].join('');

  // ─── State ───────────────────────────────────────────────────────────────────
  var isOpen = false;
  var tooltipTimer = null;

  function openWidget() {
    isOpen = true;
    panel.classList.add('pl-open');
    overlay.classList.add('pl-open');
    bubble.setAttribute('aria-expanded', 'true');
    bubble.querySelector('.pl-icon-chat').style.display = 'none';
    bubble.querySelector('.pl-icon-close').style.display = 'block';
    bubble.querySelector('.pl-dot').style.display = 'none';
    hideTooltip();
    // Trap focus in panel
    panel.querySelector('.pl-close').focus();
  }

  function closeWidget() {
    isOpen = false;
    panel.classList.remove('pl-open');
    overlay.classList.remove('pl-open');
    bubble.setAttribute('aria-expanded', 'false');
    bubble.querySelector('.pl-icon-chat').style.display = 'block';
    bubble.querySelector('.pl-icon-close').style.display = 'none';
    bubble.focus();
  }

  function showTooltip() {
    tooltip.classList.add('pl-show');
  }

  function hideTooltip() {
    tooltip.classList.remove('pl-show');
  }

  // ─── Event Listeners ─────────────────────────────────────────────────────────
  bubble.addEventListener('click', function () {
    isOpen ? closeWidget() : openWidget();
  });

  // Close button inside panel header
  header.querySelector('.pl-close').addEventListener('click', function () {
    closeWidget();
  });

  // Click overlay to close
  overlay.addEventListener('click', function () {
    closeWidget();
  });

  // Escape key to close
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen) closeWidget();
  });

  // Tooltip: show after 3 seconds on page load, hide after 5s
  window.addEventListener('load', function () {
    tooltipTimer = setTimeout(function () {
      if (!isOpen) showTooltip();
      setTimeout(hideTooltip, 5000);
    }, 3000);
  });

  // Tooltip on hover
  bubble.addEventListener('mouseenter', function () {
    if (!isOpen) showTooltip();
  });
  bubble.addEventListener('mouseleave', function () {
    hideTooltip();
  });

  // ─── Mount ───────────────────────────────────────────────────────────────────
  function mount() {
    document.body.appendChild(overlay);
    document.body.appendChild(panel);
    document.body.appendChild(tooltip);
    document.body.appendChild(bubble);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }

})();
