/**
 * Handles the typing animation effect for the Hero section.
 */
document.addEventListener('DOMContentLoaded', () => {
    /** @type {HTMLElement|null} The element where text is typed. */
    const textElement = document.getElementById('typing-text');
    
    /** @type {string[]} Array of phrases to cycle through. */
    const phrases = [
        "Full-Stack Developer",
        "Cybersecurity Enthusiast",
        "System Programmer"
    ];
    
    /** @type {number} Current index in the phrases array. */
    let phraseIndex = 0;
    
    /** @type {number} Current character index being typed or deleted. */
    let charIndex = 0;
    
    /** @type {boolean} Flag indicating whether the effect is currently deleting text. */
    let isDeleting = false;
    
    /** @type {number} Current speed of the typing effect in milliseconds. */
    let typeSpeed = 100;

    /**
     * Executes a single step of the typing or deleting animation loop.
     * Recursively calls itself via setTimeout.
     * @returns {void}
     */
    function type() {
        if (!textElement) return;

        const currentPhrase = phrases[phraseIndex];
        
        if (isDeleting) {
            textElement.textContent = currentPhrase.substring(0, charIndex - 1);
            charIndex--;
            typeSpeed = 50; // Faster when deleting
        } else {
            textElement.textContent = currentPhrase.substring(0, charIndex + 1);
            charIndex++;
            typeSpeed = 100; // Normal typing speed
        }

        if (!isDeleting && charIndex === currentPhrase.length) {
            // Finished typing phrase
            isDeleting = true;
            typeSpeed = 2000; // Pause at end
        } else if (isDeleting && charIndex === 0) {
            // Finished deleting phrase
            isDeleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
            typeSpeed = 500; // Short pause before next phrase
        }

        setTimeout(type, typeSpeed);
    }

    type();
});
