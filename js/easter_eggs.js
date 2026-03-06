'use strict';

/**
 * Fun easter eggs for curious users and developers.
 *
 * Included:
 * 1. Console greeting
 * 2. Konami code (up, up, down, down, left, right, left, right, b, a) -> barrel roll
 * 3. Matrix code ("matrix") -> secret terminal theme
 */
(() => {
  // 1. Console Greeting
  console.log(
    '%cHello there, developer!',
    'color: #00d4ff; font-size: 24px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);'
  );
  console.log(
    '%cI see you checking under the hood. Feel free to explore the code. If you find any bugs, they were put there intentionally as features. 😉 \n\nTry typing the word "matrix" anywhere on the page, or enter the classic konami code...',
    'color: #e2e8f0; font-size: 14px;'
  );

  // 2. Secret Sequences (Konami & Matrix)
  /**
   * @typedef {Object} Sequence
   * @property {string[]} code - The sequence of keystrokes required.
   * @property {string[]} input - Current user input buffer.
   * @property {function} action - The function to execute on match.
   */

  /** @type {Object.<string, Sequence>} Dictionary of available easter egg sequences. */
  const sequences = {
    konami: {
      code: [
        'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
        'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
        'b', 'a'
      ],
      input: [],
      action: doBarrelRoll
    },
    matrix: {
      code: ['m', 'a', 't', 'r', 'i', 'x'],
      input: [],
      action: toggleTerminalTheme
    }
  };

  /**
   * Global keydown listener to track inputs for easter egg sequences.
   * @param {KeyboardEvent} e - The keyboard event.
   */
  document.addEventListener('keydown', (e) => {
    const key = e.key;

    // Check each sequence
    Object.keys(sequences).forEach(seqName => {
      const seq = sequences[seqName];
      seq.input.push(key);

      // Keep the input array the same length as the secret code
      if (seq.input.length > seq.code.length) {
        seq.input.shift();
      }

      // Check if the input matches the secret code
      if (seq.input.join('').toLowerCase() === seq.code.join('').toLowerCase()) {
        seq.action();
        seq.input = []; // Reset after trigger
      }
    });
  });

  /**
   * Applies the barrel-roll CSS class to the body.
   * @returns {void}
   */
  function doBarrelRoll() {
    if (document.body.classList.contains('barrel-roll')) return;
    
    document.body.classList.add('barrel-roll');
    
    // Remove the class after the animation completes so it can be triggered again
    setTimeout(() => {
      document.body.classList.remove('barrel-roll');
    }, 2000);
  }

  /**
   * Toggles the secret terminal theme via data-theme attribute.
   * @returns {void}
   */
  function toggleTerminalTheme() {
    /** @type {boolean} Checks if terminal theme is currently applied. */
    const isTerminal = document.documentElement.getAttribute('data-theme') === 'terminal';
    
    if (isTerminal) {
      // Revert to saved preference or default dark
      /** @type {string} LocalStorage key for themes. */
      const THEME_KEY = 'yagilitzhak_theme_preference';
      /** @type {string|null} Saved user preference. */
      const savedTheme = localStorage.getItem(THEME_KEY);
      
      if (savedTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
    } else {
      // Activate terminal theme
      document.documentElement.setAttribute('data-theme', 'terminal');
    }
  }

})();
