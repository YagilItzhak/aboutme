'use strict';

/**
 * Small UI behaviors for a marketing style site:
 * - Mobile hamburger menu toggle
 * - Smooth scrolling for anchor links
 * - Navbar and scroll-to-top button scroll effects
 * - Scroll-to-top button behavior
 * - Fade-in sections as they enter the viewport
 *
 * Assumptions:
 * - #mobile-menu is the hamburger button
 * - #nav-menu is the menu container
 * - #navbar is the top nav
 * - #scrollTop is the scroll-to-top button
 * - Sections are <section> elements
 */
(() => {
  document.addEventListener('DOMContentLoaded', () => initUI());

  /**
   * Initializes all UI features.
   * Safe to call even if some DOM elements are missing.
   * @returns {void}
   */
  function initUI() {
    setupMobileMenu();
    setupSmoothScroll();
    setupScrollEffects();
    setupScrollToTop();
    setupSectionFadeIn();
  }

  /**
   * Wires up the mobile menu toggle button and closes the menu on link click.
   * Adds keyboard accessibility for Enter and Space.
   * @returns {void}
   */
  function setupMobileMenu() {
    /** @type {HTMLElement|null} */
    const toggle = document.getElementById('mobile-menu');

    /** @type {HTMLElement|null} */
    const menu = document.getElementById('nav-menu');

    if (!toggle || !menu) return;

    /**
     * Updates visual and accessibility state for the menu.
     * @returns {void}
     */
    function toggleMenu() {
      const isOpen = toggle.classList.toggle('is-active');
      menu.classList.toggle('active', isOpen);
      toggle.setAttribute('aria-expanded', String(isOpen));
    }

    toggle.addEventListener('click', toggleMenu);

    toggle.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      toggleMenu();
    });

    closeMenuOnNavLinkClick(toggle, menu);
  }

  /**
   * Closes the mobile menu when any navigation link is clicked.
   * @param {HTMLElement} toggle
   * @param {HTMLElement} menu
   * @returns {void}
   */
  function closeMenuOnNavLinkClick(toggle, menu) {
    /** @type {NodeListOf<HTMLAnchorElement>} */
    const links = document.querySelectorAll('.nav-menu a');

    if (!links.length) return;

    links.forEach((link) => {
      link.addEventListener('click', () => {
        toggle.classList.remove('is-active');
        menu.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /**
   * Enables smooth scrolling for on-page anchor links.
   * Only targets links with href beginning with "#".
   * @returns {void}
   */
  function setupSmoothScroll() {
    /** @type {NodeListOf<HTMLAnchorElement>} */
    const anchors = document.querySelectorAll('a[href^="#"]');

    anchors.forEach((anchor) => {
      anchor.addEventListener('click', (e) => {
        const href = anchor.getAttribute('href');
        if (!href || href === '#') return;

        /** @type {HTMLElement|null} */
        const target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  /**
   * Adds scroll-based UI effects:
   * - navbar gets "scrolled" class after 100px
   * - scroll-to-top button gets "visible" class after 500px
   *
   * Uses requestAnimationFrame to avoid doing DOM work too often.
   * @returns {void}
   */
  function setupScrollEffects() {
    /** @type {HTMLElement|null} */
    const navbar = document.getElementById('navbar');

    /** @type {HTMLElement|null} */
    const scrollBtn = document.getElementById('scrollTop');

    if (!navbar || !scrollBtn) return;

    /** @type {boolean} */
    let scheduled = false;

    window.addEventListener(
      'scroll',
      () => {
        if (scheduled) return;
        scheduled = true;

        window.requestAnimationFrame(() => {
          const y = window.scrollY;
          navbar.classList.toggle('scrolled', y > 100);
          scrollBtn.classList.toggle('visible', y > 500);
          scheduled = false;
        });
      },
      { passive: true }
    );
  }

  /**
   * Makes the "scroll to top" button work via click and keyboard.
   * @returns {void}
   */
  function setupScrollToTop() {
    /** @type {HTMLElement|null} */
    const btn = document.getElementById('scrollTop');
    if (!btn) return;

    /**
     * Scrolls smoothly to the top of the page.
     * @returns {void}
     */
    function scrollToTop() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    btn.addEventListener('click', scrollToTop);

    btn.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      scrollToTop();
    });
  }

  /**
   * Fades in each <section> when it becomes visible.
   * Uses IntersectionObserver for efficiency.
   * @returns {void}
   */
  function setupSectionFadeIn() {
    if (!('IntersectionObserver' in window)) {
      showSectionsImmediately();
      return;
    }

    /** @type {IntersectionObserver} */
    const observer = new IntersectionObserver(onIntersections, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
    });

    /** @type {NodeListOf<HTMLElement>} */
    const sections = document.querySelectorAll('section');

    sections.forEach((section) => {
      prepareSectionForFadeIn(section);
      observer.observe(section);
    });

    /**
     * IntersectionObserver callback.
     * @param {IntersectionObserverEntry[]} entries
     * @returns {void}
     */
    function onIntersections(entries) {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        /** @type {HTMLElement} */
        const el = /** @type {HTMLElement} */ (entry.target);
        revealSection(el);

        observer.unobserve(el);
      });
    }
  }

  /**
   * Sets initial styles for the fade-in effect.
   * @param {HTMLElement} section
   * @returns {void}
   */
  function prepareSectionForFadeIn(section) {
    section.style.opacity = '0';
    section.style.transform = 'translateY(30px)';
    section.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
  }

  /**
   * Reveals a section by applying visible styles.
   * @param {HTMLElement} section
   * @returns {void}
   */
  function revealSection(section) {
    section.style.opacity = '1';
    section.style.transform = 'translateY(0)';
  }

  /**
   * Fallback for very old browsers, shows all sections immediately.
   * @returns {void}
   */
  function showSectionsImmediately() {
    /** @type {NodeListOf<HTMLElement>} */
    const sections = document.querySelectorAll('section');
    sections.forEach((section) => {
      section.style.opacity = '1';
      section.style.transform = 'none';
      section.style.transition = 'none';
    });
  }
})();
