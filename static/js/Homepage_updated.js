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
    const slider = document.querySelector('.product-slider');
    if (!slider) return;

    let slideIndex = 0;
    let slidesToShow = getSlidesToShow();
    let autoSlideInterval;
    let isHovered = false;

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
    const prevBtn = document.getElementById('prevProduct');
    const nextBtn = document.getElementById('nextProduct');

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
    slider.parentElement.addEventListener('mouseenter', () => {
        isHovered = true;
    });

    slider.parentElement.addEventListener('mouseleave', () => {
        isHovered = false;
    });

    // Cart Functionality
    function addToCart(productId) {
        const button = event.target.closest('.cart-button');
        if (button.disabled) return;
        
        button.disabled = true;

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
                // Update cart count
                const cartBadge = document.querySelector('.cart-icon .badge');
                if (cartBadge) {
                    cartBadge.textContent = data.cart_count;
                }
                button.disabled = false;
            } else {
                button.disabled = false;
                showNotification('Failed to add item to cart', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            button.disabled = false;
            showNotification('Error adding item to cart', 'error');
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
    updateSliderPosition();
    startAutoSlide();

    // Make addToCart function globally available
    window.addToCart = addToCart;
});

// Profile Icon Dropdown functionality
document.addEventListener('DOMContentLoaded', function() {
    const userIcon = document.querySelector('.user-icon');
    const dropdownMenu = document.querySelector('.user-icon + .dropdown-menu');
    
    if (userIcon && dropdownMenu) {
        // Toggle dropdown on icon click
        userIcon.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Close any other open dropdowns first
            const allDropdowns = document.querySelectorAll('.dropdown-menu');
            allDropdowns.forEach(dropdown => {
                if (dropdown !== dropdownMenu) {
                    dropdown.classList.remove('show');
                }
            });
            
            dropdownMenu.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!userIcon.contains(e.target) && !dropdownMenu.contains(e.target)) {
                dropdownMenu.classList.remove('show');
            }
        });

        // Close dropdown when pressing Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && dropdownMenu.classList.contains('show')) {
                dropdownMenu.classList.remove('show');
            }
        });
    }
});






