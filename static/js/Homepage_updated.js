// script.js
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('active');
}

/* filepath: static/js/Homepage.js */

// Add this code to the existing file
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all dropdowns
    var dropdownElementList = [].slice.call(document.querySelectorAll('[data-bs-toggle="dropdown"]'));
    var dropdownList = dropdownElementList.map(function (dropdownToggleEl) {
        return new bootstrap.Dropdown(dropdownToggleEl);
    });

    // Profile icon click handler
    const profileIcon = document.querySelector('.fa-user');
    if (profileIcon) {
        profileIcon.addEventListener('click', function(e) {
            e.preventDefault();
            const dropdownToggle = this.closest('.dropdown-toggle');
            if (dropdownToggle) {
                const dropdown = bootstrap.Dropdown.getInstance(dropdownToggle);
                if (dropdown) {
                    dropdown.toggle();
                }
            }
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.dropdown')) {
            const dropdowns = document.querySelectorAll('.dropdown-menu.show');
            dropdowns.forEach(function(dropdown) {
                dropdown.classList.remove('show');
            });
        }
    });

    // Initialize Category Slider
    initCategorySlider();

    // Initialize AOS
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            easing: 'ease-in-out',
            once: true
        });
    }

    // Sidebar toggle functionality
    function toggleSidebar() {
        const sidebar = document.getElementById("sidebar");
        if (sidebar) {
            sidebar.classList.toggle('active');
        }
    }

    // Close sidebar when clicking outside
    document.addEventListener('click', function(e) {
        const sidebar = document.getElementById("sidebar");
        const menuBtn = document.querySelector('.menu-btn');
        
        if (sidebar && menuBtn && !sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    });

    // Make toggleSidebar function globally available
    window.toggleSidebar = toggleSidebar;
});

// Category Slider Functionality
function initCategorySlider() {
    const slider = document.querySelector('.category-slider');
    const prevBtn = document.getElementById('prevCategory');
    const nextBtn = document.getElementById('nextCategory');
    const dots = document.querySelectorAll('.category-pagination-dot');
    
    if (!slider || !prevBtn || !nextBtn) return;
    
    const cardWidth = 300; // Width of card + gap
    const visibleCards = Math.floor(slider.offsetWidth / cardWidth);
    const totalCards = slider.querySelectorAll('.category-card').length;
    const maxScroll = (totalCards - visibleCards) * cardWidth;
    
    let currentScroll = 0;
    let currentPage = 0;
    const totalPages = Math.ceil(totalCards / visibleCards);
    
    // Update active dot
    function updateDots() {
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentPage);
        });
    }
    
    // Scroll to position
    function scrollTo(position) {
        slider.scrollTo({
            left: position,
            behavior: 'smooth'
        });
        currentScroll = position;
        currentPage = Math.round(currentScroll / (visibleCards * cardWidth));
        updateDots();
    }
    
    // Previous button click
    prevBtn.addEventListener('click', () => {
        const newPosition = Math.max(0, currentScroll - (visibleCards * cardWidth));
        scrollTo(newPosition);
    });
    
    // Next button click
    nextBtn.addEventListener('click', () => {
        const newPosition = Math.min(maxScroll, currentScroll + (visibleCards * cardWidth));
        scrollTo(newPosition);
    });
    
    // Dot click
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            const newPosition = Math.min(maxScroll, index * (visibleCards * cardWidth));
            scrollTo(newPosition);
        });
    });
    
    // Update on window resize
    window.addEventListener('resize', () => {
        const newVisibleCards = Math.floor(slider.offsetWidth / cardWidth);
        if (newVisibleCards !== visibleCards) {
            const newMaxScroll = (totalCards - newVisibleCards) * cardWidth;
            currentScroll = Math.min(currentScroll, newMaxScroll);
            scrollTo(currentScroll);
        }
    });
}

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
if (document.getElementById('scrollTopBtn')) {
    document.getElementById('scrollTopBtn').addEventListener('mouseenter', () => {
        document.getElementById('scrollTopBtn').style.transform = 'scale(1.1) translateY(-5px)';
    });

    document.getElementById('scrollTopBtn').addEventListener('mouseleave', () => {
        document.getElementById('scrollTopBtn').style.transform = 'scale(1) translateY(0)';
    });
}

// Add to Cart functionality
document.addEventListener('DOMContentLoaded', function() {
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.dataset.productId;
            
            // Check if user is logged in
            if (!isUserLoggedIn()) {
                window.location.href = '/login';
                return;
            }
            
            // Add to cart
            fetch('/add-to-cart/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
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
                    updateCartCount(data.cart_count);
                    // Show success message
                    showMessage('Product added to cart successfully!', 'success');
                } else {
                    showMessage(data.error || 'Failed to add product to cart', 'error');
                }
            })
            .catch(error => {
                showMessage('An error occurred. Please try again.', 'error');
            });
        });
    });
});

// Helper function to check if user is logged in
function isUserLoggedIn() {
    return document.querySelector('.nav-text.login') === null;
}

// Helper function to get CSRF token
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

// Helper function to update cart count
function updateCartCount(count) {
    const cartBadge = document.querySelector('.badge.rounded-pill');
    if (cartBadge) {
        cartBadge.textContent = count;
    }
}

// Helper function to show messages
function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `alert alert-${type === 'success' ? 'success' : 'danger'} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    messageDiv.style.zIndex = '1000';
    messageDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(messageDiv);
    
    // Auto dismiss after 3 seconds
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// Initialize Product Carousel
document.addEventListener('DOMContentLoaded', function() {
    var productCarousel = new bootstrap.Carousel(document.getElementById('productCarousel'), {
        interval: 3000, // 3 second interval
        wrap: true,
        touch: false // Disable touch/swipe
    });

    // Add click event to product cards
    document.querySelectorAll('.product-card').forEach(function(card) {
        card.addEventListener('click', function() {
            window.location.href = this.dataset.url;
        });
    });

    // Email subscription form handler
    const emailSubscriptionForm = document.getElementById('emailSubscriptionForm');
    if (emailSubscriptionForm) {
        emailSubscriptionForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = emailSubscriptionForm.querySelector('input[type="email"]').value;
            
            // Here you can add AJAX call to your backend to handle the subscription
            showMessage('Thank you for subscribing! You will receive your discount code shortly.', 'success');
            emailSubscriptionForm.reset();
        });
    }
});

// Product Slider Functionality
document.addEventListener('DOMContentLoaded', function() {
    const slider = document.querySelector('.product-slider');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    const slides = document.querySelectorAll('.product-slide');
    
    let currentPosition = 0;
    let slideWidth = 0;
    let slidesPerView = 5;
    let maxPosition = 0;
    
    // Calculate dimensions and limits
    function calculateDimensions() {
        const containerWidth = slider.parentElement.offsetWidth;
        slideWidth = containerWidth / slidesPerView;
        
        // Update slidesPerView based on screen width
        if (window.innerWidth <= 576) {
            slidesPerView = 1;
        } else if (window.innerWidth <= 992) {
            slidesPerView = 2;
        } else if (window.innerWidth <= 1200) {
            slidesPerView = 3;
        } else if (window.innerWidth <= 1400) {
            slidesPerView = 4;
        } else {
            slidesPerView = 5;
        }
        
        // Calculate max position (prevent white space at the end)
        maxPosition = Math.max(0, slides.length - slidesPerView);
        updateSliderPosition();
        updateButtonStates();
    }
    
    function updateSliderPosition() {
        const position = -currentPosition * (slideWidth + 20); // 20px is the gap
        slider.style.transform = `translate3d(${position}px, 0, 0)`;
    }
    
    function updateButtonStates() {
        prevBtn.classList.toggle('disabled', currentPosition <= 0);
        nextBtn.classList.toggle('disabled', currentPosition >= maxPosition);
    }
    
    function slideNext() {
        if (currentPosition < maxPosition) {
            currentPosition++;
            updateSliderPosition();
            updateButtonStates();
        }
    }
    
    function slidePrev() {
        if (currentPosition > 0) {
            currentPosition--;
            updateSliderPosition();
            updateButtonStates();
        }
    }
    
    // Event Listeners
    nextBtn.addEventListener('click', slideNext);
    prevBtn.addEventListener('click', slidePrev);
    
    // Touch Events
    let touchStartX = 0;
    let touchEndX = 0;
    
    slider.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
    }, { passive: true });
    
    slider.addEventListener('touchmove', (e) => {
        touchEndX = e.touches[0].clientX;
    }, { passive: true });
    
    slider.addEventListener('touchend', () => {
        const touchDiff = touchStartX - touchEndX;
        if (Math.abs(touchDiff) > 50) { // Minimum swipe distance
            if (touchDiff > 0) {
                slideNext();
            } else {
                slidePrev();
            }
        }
    });
    
    // Handle product card clicks
    slides.forEach(slide => {
        const card = slide.querySelector('.product-card');
        const addToCartBtn = slide.querySelector('.add-to-cart-btn');
        
        addToCartBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent card click when clicking the button
            const productId = addToCartBtn.dataset.productId;
            addToCart(productId);
        });
        
        card.addEventListener('click', () => {
            const productId = card.dataset.productId;
            if (productId) {
                window.location.href = `/product/${productId}/`;
            }
        });
    });
    
    // Initialize and handle resize
    calculateDimensions();
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(calculateDimensions, 100);
    });
});

function addToCart(productId) {
    // Check if user is logged in
    if (!isUserLoggedIn()) {
        window.location.href = '/login';
        return;
    }
    
    // Add to cart
    fetch('/add-to-cart/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
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
            const cartBadge = document.querySelector('.badge.rounded-pill');
            if (cartBadge) {
                cartBadge.textContent = data.items_count;
            }
            // Show success message
            showMessage('Product added to cart successfully!', 'success');
        } else {
            showMessage(data.error || 'Failed to add product to cart', 'error');
        }
    })
    .catch(error => {
        showMessage('An error occurred. Please try again.', 'error');
    });
} 