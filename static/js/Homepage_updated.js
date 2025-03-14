document.addEventListener('DOMContentLoaded', function() {
    // Sidebar Functionality
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const toggleBtn = document.getElementById('sidebarToggle');
    const closeBtn = document.getElementById('closeSidebar');
    
    function toggleSidebar() {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    }

    function closeSidebar() {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    }

    // Sidebar Event Listeners
    if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleSidebar();
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', closeSidebar);
    }

    if (overlay) {
        overlay.addEventListener('click', closeSidebar);
    }

    // Close sidebar when clicking on navigation links
    const navLinks = document.querySelectorAll('.sidebar .nav-item');
    navLinks.forEach(link => {
        link.addEventListener('click', closeSidebar);
    });

    // Close sidebar on outside click
    document.addEventListener('click', (e) => {
        if (sidebar && sidebar.classList.contains('active') &&
            !sidebar.contains(e.target) &&
            !toggleBtn.contains(e.target)) {
            closeSidebar();
        }
    });

    // Close sidebar on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar && sidebar.classList.contains('active')) {
            closeSidebar();
        }
    });

    // Product Slider Configuration
    const slider = document.getElementById('productSlider');
    const prevBtn = document.getElementById('prevProduct');
    const nextBtn = document.getElementById('nextProduct');
    let slideIndex = 0;
    let slidesToShow = getSlidesToShow();
    let autoSlideInterval;
    let isHovered = false;
    let progressDots = [];

    // Responsive slides calculation
    function getSlidesToShow() {
        if (window.innerWidth <= 576) return 1;
        if (window.innerWidth <= 768) return 2;
        if (window.innerWidth <= 992) return 3;
        if (window.innerWidth <= 1200) return 4;
        return 5;
    }

    // Slider Position Update
    function updateSliderPosition(smooth = true) {
        if (!slider) return;
        const slideWidth = slider.querySelector('.product-slide')?.offsetWidth || 0;
        slider.style.transition = smooth ? 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)' : 'none';
        slider.style.transform = `translateX(-${slideIndex * slideWidth}px)`;
        updateProgressDots();
    }

    // Progress Dots
    function createProgressDots() {
        if (!slider) return;
        
        const dotsContainer = document.createElement('div');
        dotsContainer.className = 'progress-dots';
        const totalDots = Math.ceil((slider.children.length || 0) / slidesToShow);
        
        for (let i = 0; i < totalDots; i++) {
            const dot = document.createElement('button');
            dot.className = 'progress-dot';
            dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
            dot.addEventListener('click', () => {
                slideIndex = i;
                updateSliderPosition();
            });
            dotsContainer.appendChild(dot);
            progressDots.push(dot);
        }
        
        slider.parentElement?.appendChild(dotsContainer);
        updateProgressDots();
    }

    function updateProgressDots() {
        progressDots.forEach((dot, index) => {
            dot.classList.toggle('active', index === slideIndex);
        });
    }

    // Auto Slide Functionality
    function startAutoSlide() {
        stopAutoSlide();
        autoSlideInterval = setInterval(() => {
            if (!isHovered && slider) {
                const maxSlideIndex = (slider.children.length || 0) - slidesToShow;
                if (slideIndex >= maxSlideIndex) {
                    slideIndex = 0;
                } else {
                    slideIndex++;
                }
                updateSliderPosition();
            }
        }, 5000);
    }

    function stopAutoSlide() {
        if (autoSlideInterval) {
            clearInterval(autoSlideInterval);
        }
    }

    // Slider Event Listeners
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (slideIndex > 0) {
                slideIndex--;
                updateSliderPosition();
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (!slider) return;
            const maxSlideIndex = (slider.children.length || 0) - slidesToShow;
            if (slideIndex < maxSlideIndex) {
                slideIndex++;
                updateSliderPosition();
            }
        });
    }

    // Handle slider hover states
    if (slider?.parentElement) {
        slider.parentElement.addEventListener('mouseenter', () => {
            isHovered = true;
        });

        slider.parentElement.addEventListener('mouseleave', () => {
            isHovered = false;
        });
    }

    // Cart Functionality
    function addToCart(productId) {
        const button = document.querySelector(`[data-product-id="${productId}"]`);
        if (!button || button.disabled) return;

        button.classList.add('loading');
        
        fetch('/add-to-cart/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken'),
            },
            body: JSON.stringify({
                product_id: productId,
                quantity: 1
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                button.classList.remove('loading');
                button.classList.add('success');
                
                // Update cart count
                const cartBadge = document.querySelector('.cart-icon .badge');
                if (cartBadge) {
                    cartBadge.textContent = data.cart_count;
                }

                // Reset button after animation
                setTimeout(() => {
                    button.classList.remove('success');
                }, 2000);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            button.classList.remove('loading');
        });
    }

    // Search Functionality Enhancement
    const searchForm = document.querySelector('.search-box-container');
    const searchInput = document.querySelector('.search-box');

    if (searchForm && searchInput) {
        searchInput.addEventListener('input', debounce(function(e) {
            // Add search suggestions logic here if needed
        }, 300));
    }

    // Utility Functions
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    // Initialize
    window.addEventListener('resize', debounce(() => {
        const newSlidesToShow = getSlidesToShow();
        if (newSlidesToShow !== slidesToShow) {
            slidesToShow = newSlidesToShow;
            slideIndex = 0;
            updateSliderPosition(false);
        }
    }, 250));

    // Initialize components
    if (slider) {
        createProgressDots();
        updateSliderPosition();
        startAutoSlide();
    }

    // Make addToCart function globally available
    window.addToCart = addToCart;
});

