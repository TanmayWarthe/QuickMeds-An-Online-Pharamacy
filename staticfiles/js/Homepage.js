// script.js
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('active');
}



/* filepath: static/js/Homepage.js */

// Add this code to the existing file
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all dropdowns
    var dropdownElementList = [].slice.call(document.querySelectorAll('.dropdown-toggle'))
    var dropdownList = dropdownElementList.map(function (dropdownToggleEl) {
        return new bootstrap.Dropdown(dropdownToggleEl)
    });
});






// Make sure this code is running after DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const scrollTopBtn = document.getElementById('scrollTopBtn');
    let lastScrollTop = 0;
    let scrollTimeout;

    if (scrollTopBtn) {
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            
            const currentScroll = window.pageYOffset;
            
            // Show/hide button based on scroll position
            if (currentScroll > 300) {
                scrollTopBtn.classList.add('visible');
            } else {
                scrollTopBtn.classList.remove('visible');
            }
            
            lastScrollTop = currentScroll;
            
            // Hide button after 2 seconds of no scrolling
            scrollTimeout = setTimeout(() => {
                if (currentScroll < 300) {
                    scrollTopBtn.classList.remove('visible');
                }
            }, 2000);
        });

        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
});
// Add hover sound effect (optional)
scrollTopBtn.addEventListener('mouseenter', () => {
    scrollTopBtn.style.transform = 'scale(1.1) translateY(-5px)';
});

scrollTopBtn.addEventListener('mouseleave', () => {
    scrollTopBtn.style.transform = 'scale(1) translateY(0)';
});