'use strict';

/**
 * Handles the Light/Dark mode theme toggling.
 * - Checks localStorage for a saved preference.
 * - Checks system preference (prefers-color-scheme) if no saved preference.
 * - Updates the `data-theme` attribute on the `<html>` tag.
 * - Updates the toggle button icon.
 */
(() => {
  /** @type {string} Key used for localStorage. */
  const THEME_KEY = 'yagilitzhak_theme_preference';
  /** @type {string} Constant for light theme string. */
  const LIGHT_THEME = 'light';
  /** @type {string} Constant for dark theme string. */
  const DARK_THEME = 'dark';
  /** @type {string} Icon displayed when in light mode. */
  const ICON_LIGHT = '🌙'; 
  /** @type {string} Icon displayed when in dark mode. */
  const ICON_DARK = '☀️';  

  // 1. Determine Initial Theme
  /** @type {string|null} The current resolved theme. */
  let currentTheme = localStorage.getItem(THEME_KEY);

  if (!currentTheme) {
    // Check system preference
    /** @type {boolean} Checks window preference for light mode natively. */
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    currentTheme = prefersLight ? LIGHT_THEME : DARK_THEME;
  }

  // Apply immediately to prevent flash
  applyTheme(currentTheme);

  // 2. Setup Toggle Button when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    /** @type {HTMLElement|null} The theme toggle button. */
    const toggleBtn = document.getElementById('theme-toggle');
    if (!toggleBtn) return;

    /** @type {HTMLElement|null} The span element holding the theme icon. */
    const iconSpan = toggleBtn.querySelector('.theme-icon');

    // Set initial icon
    if (iconSpan) {
      iconSpan.textContent = currentTheme === LIGHT_THEME ? ICON_LIGHT : ICON_DARK;
    }

    // Toggle event listener
    toggleBtn.addEventListener('click', () => {
      currentTheme = currentTheme === LIGHT_THEME ? DARK_THEME : LIGHT_THEME;
      
      applyTheme(currentTheme);
      localStorage.setItem(THEME_KEY, currentTheme);

      if (iconSpan) {
        iconSpan.textContent = currentTheme === LIGHT_THEME ? ICON_LIGHT : ICON_DARK;
      }
    });
  });

  /**
   * Applies the theme to the document element.
   * @param {string} theme The theme identifying string (e.g., 'light' or 'dark').
   * @returns {void}
   */
  function applyTheme(theme) {
    if (theme === LIGHT_THEME) {
      document.documentElement.setAttribute('data-theme', LIGHT_THEME);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }
})();
