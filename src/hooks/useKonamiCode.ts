'use client';

import { useEffect } from 'react';

export function useKonamiCode(callback: () => void) {
  useEffect(() => {
    const konamiCode = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65]; // up up down down left right left right B A
    let konamiIndex = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.keyCode === konamiCode[konamiIndex]) {
        konamiIndex++;

        if (konamiIndex === konamiCode.length) {
          callback();
          konamiIndex = 0;
        }
      } else {
        konamiIndex = 0;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [callback]);
}

// Store original text content with krakens
let originalPageContent: { node: Text; original: string }[] = [];

function hidePageKrakens() {
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT
  );
  let node: Node | null;
  while ((node = walker.nextNode())) {
    if (node.nodeValue?.includes('🦑')) {
      originalPageContent.push({
        node: node as Text,
        original: node.nodeValue,
      });
      node.nodeValue = node.nodeValue.replaceAll('🦑', '');
    }
  }
}

function restorePageKrakens() {
  originalPageContent.forEach((item) => {
    item.node.nodeValue = item.original;
  });
  originalPageContent = [];
}

function createTentacle() {
  const tentacle = document.createElement('div');
  tentacle.setAttribute('data-tentacle', 'true');
  tentacle.textContent = '🦑';
  tentacle.style.cssText = `
    position: fixed;
    top: -50px;
    left: ${Math.random() * 100}vw;
    font-size: ${Math.random() * 30 + 20}px;
    z-index: 9999;
    pointer-events: none;
    animation: fall ${Math.random() * 2 + 2}s linear forwards;
  `;

  document.body.appendChild(tentacle);

  setTimeout(() => {
    tentacle.remove();
  }, 4000);
}

export function activateKrakenMode() {
  const body = document.body;

  // Hide all page krakens and add Easter egg mode
  hidePageKrakens();
  body.classList.add('kraken-mode-theme');
  body.style.animation = 'krakenShake 0.5s';
  
  // Remove animation after it completes
  setTimeout(() => {
    body.style.animation = '';
  }, 500);

  // Create blurred background overlay
  const overlay = document.createElement('div');
  overlay.id = 'kraken-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(5px);
    z-index: 9998;
    animation: fadeIn 0.3s ease-in;
  `;
  document.body.appendChild(overlay);

  // Add tentacle emoji rain
  for (let i = 0; i < 20; i++) {
    setTimeout(() => {
      createTentacle();
    }, i * 100);
  }

  // Show message in center
  const message = document.createElement('div');
  message.id = 'kraken-message';
  message.textContent = '🦑 KRAKEN MODE ACTIVATED! 🦑';
  message.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(135deg, #00ffff, #ff00ff);
    color: #000;
    padding: 3rem 5rem;
    font-family: 'Bebas Neue', sans-serif;
    font-size: 4rem;
    letter-spacing: 0.2em;
    z-index: 10000;
    box-shadow: 0 0 80px rgba(0, 255, 255, 1), 0 0 120px rgba(255, 0, 255, 0.8);
    animation: krakenPulse 1s ease-in-out 3, krakenBounce 0.6s ease-in-out;
    border-radius: 10px;
    text-align: center;
    border: 3px solid #fff;
  `;
  document.body.appendChild(message);

  // Clean up after animation (but keep the theme)
  setTimeout(() => {
    const msg = document.getElementById('kraken-message');
    const ovr = document.getElementById('kraken-overlay');
    if (msg) msg.remove();
    if (ovr) ovr.remove();
    // Remove all tentacles
    document.querySelectorAll('[data-tentacle]').forEach((el) => el.remove());
    // Restore page krakens
    restorePageKrakens();
    // Keep kraken-mode-theme class active until page reload
  }, 3000);
}
