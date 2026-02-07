/**
 * Simple Mobile Slideshow
 * Adds Prev/Next buttons to horizontally scrolling grids on mobile.
 */

document.addEventListener('DOMContentLoaded', () => {
    const grids = document.querySelectorAll('.project-grid, .skills-grid, .article-list, .honors-grid');
    
    // Only run on mobile/tablet or small screens
    if (window.innerWidth > 768) return;

    grids.forEach(grid => {
        // Create wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'slideshow-wrapper';
        
        // Insert wrapper before grid
        grid.parentNode.insertBefore(wrapper, grid);
        wrapper.appendChild(grid);

        // Create controls
        const prevBtn = document.createElement('button');
        prevBtn.className = 'slide-btn prev';
        prevBtn.innerHTML = '&#10094;'; // Left arrow
        prevBtn.ariaLabel = "Previous Slide";

        const nextBtn = document.createElement('button');
        nextBtn.className = 'slide-btn next';
        nextBtn.innerHTML = '&#10095;'; // Right arrow
        nextBtn.ariaLabel = "Next Slide";

        wrapper.appendChild(prevBtn);
        wrapper.appendChild(nextBtn);

        // Scroll logic
        const scrollAmount = grid.clientWidth * 0.85; // Move by one card width roughly

        prevBtn.addEventListener('click', () => {
            grid.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        });

        nextBtn.addEventListener('click', () => {
            grid.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        });

        // Hide buttons at ends (optional, nice to have)
        grid.addEventListener('scroll', () => {
            const tolerance = 10;
            const maxScroll = grid.scrollWidth - grid.clientWidth;
            
            prevBtn.style.opacity = grid.scrollLeft < tolerance ? '0.3' : '1';
            nextBtn.style.opacity = grid.scrollLeft > maxScroll - tolerance ? '0.3' : '1';
            
            prevBtn.style.pointerEvents = grid.scrollLeft < tolerance ? 'none' : 'auto';
            nextBtn.style.pointerEvents = grid.scrollLeft > maxScroll - tolerance ? 'none' : 'auto';
        });

        // Trigger scroll event to set initial state
        grid.dispatchEvent(new Event('scroll'));
    });
});
