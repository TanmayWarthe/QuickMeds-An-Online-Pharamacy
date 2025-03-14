function scrollToCategory(categoryId) {
    const element = document.getElementById(categoryId);
    if (element) {
        const headerOffset = 100; // Adjust this value based on your header height
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }
}

// Slider functionality
function moveSlider(sliderId, direction) {
    const slider = document.getElementById(sliderId);
    if (!slider) return;

    const cardWidth = slider.querySelector('.product-card').offsetWidth;
    const gap = 16;
    const visibleWidth = slider.offsetWidth;
    const scrollAmount = Math.floor(visibleWidth / (cardWidth + gap)) * (cardWidth + gap);
    
    slider.scrollTo({
        left: slider.scrollLeft + (scrollAmount * direction),
        behavior: 'smooth'
    });

    setTimeout(() => updateSliderButtons(sliderId), 300);
}

function updateSliderButtons(sliderId) {
    const slider = document.getElementById(sliderId);
    if (!slider) return;

    const prevBtn = slider.parentElement.querySelector('.control-btn.prev');
    const nextBtn = slider.parentElement.querySelector('.control-btn.next');

    if (prevBtn) {
        prevBtn.disabled = slider.scrollLeft <= 0;
        prevBtn.style.opacity = slider.scrollLeft <= 0 ? '0.5' : '1';
    }
    if (nextBtn) {
        const isAtEnd = slider.scrollLeft + slider.offsetWidth >= slider.scrollWidth - 5;
        nextBtn.disabled = isAtEnd;
        nextBtn.style.opacity = isAtEnd ? '0.5' : '1';
    }
}

// Sidebar toggle functionality
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
    }
}

// Ensure the sidebar closes when clicking outside of it
document.addEventListener('click', (e) => {
    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.querySelector('.menu-btn');
    const closeBtn = document.querySelector('.close-btn');

    if (sidebar && menuBtn && closeBtn) {
        if (!sidebar.contains(e.target) && !menuBtn.contains(e.target) && !closeBtn.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    }
});

// Initialize sliders and category clicks
document.addEventListener('DOMContentLoaded', function() {
    // Add smooth scrolling to all category cards
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', function() {
            const categoryId = this.getAttribute('data-category-id');
            scrollToCategory(categoryId);
        });
    });

    // Initialize all sliders
    document.querySelectorAll('.product-slider').forEach(slider => {
        const sliderId = slider.id;
        updateSliderButtons(sliderId);

        // Update button states on scroll
        slider.addEventListener('scroll', () => {
            updateSliderButtons(sliderId);
        });

        // Add touch support
        let touchStartX = 0;
        let touchEndX = 0;
        
        slider.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        slider.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            const difference = touchStartX - touchEndX;
            
            if (Math.abs(difference) > 50) { // Minimum swipe distance
                moveSlider(slider.id, difference > 0 ? 1 : -1);
            }
        }, { passive: true });
    });

    // Handle product card clicks
    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', function(e) {
            // Don't navigate if clicking on buttons
            if (e.target.closest('.add-btn') || e.target.closest('.view-details-btn')) {
                return;
            }
            
            const viewDetailsBtn = this.querySelector('.view-details-btn');
            if (viewDetailsBtn) {
                window.location.href = viewDetailsBtn.href;
            }
        });
    });

    // Update slider buttons on window resize
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            document.querySelectorAll('.product-slider').forEach(slider => {
                updateSliderButtons(slider.id);
            });
        }, 250);
    });

    // Initialize product sliders
    initializeProductSliders();
    updateCartCount();

    // Initialize spotlight effect
    const productSections = document.querySelectorAll('.product-section');
    
    productSections.forEach(section => {
        const spotlight = section.querySelector('.spotlight');
        
        section.addEventListener('mousemove', (e) => {
            const rect = section.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            
            spotlight.style.setProperty('--x', `${x}%`);
            spotlight.style.setProperty('--y', `${y}%`);
        });
    });

    // Dropdown functionality for profile icon
    const dropdowns = document.querySelectorAll('.dropdown');
    dropdowns.forEach(dropdown => {
        const trigger = dropdown.querySelector('.nav-icon');
        const menu = dropdown.querySelector('.dropdown-menu');

        if (trigger && menu) {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                menu.classList.toggle('show');
            });

            document.addEventListener('click', (e) => {
                if (!dropdown.contains(e.target)) {
                    menu.classList.remove('show');
                }
            });
        }
    });

    // Initialize scroll-to-top button functionality after DOM is fully loaded
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
            
            // Add extra class when scrolling up
            if (currentScroll < lastScrollTop) {
                scrollTopBtn.classList.add('scroll-up');
            } else {
                scrollTopBtn.classList.remove('scroll-up');
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
            // Add click animation class
            scrollTopBtn.classList.add('clicked');
            
            // Smooth scroll to top
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
            
            // Remove click animation class after animation completes
            setTimeout(() => {
                scrollTopBtn.classList.remove('clicked');
            }, 300);
        });

        scrollTopBtn.addEventListener('mouseenter', () => {
            scrollTopBtn.style.transform = 'scale(1.1) translateY(-5px)';
        });

        scrollTopBtn.addEventListener('mouseleave', () => {
            scrollTopBtn.style.transform = 'scale(1) translateY(0)';
        });
    }

    updateCartCount(); // Call this function to set the initial cart count
});

// Add touch support for mobile devices
document.addEventListener('DOMContentLoaded', function() {
    const sliders = document.querySelectorAll('.product-slider');
    
    sliders.forEach(slider => {
        let touchStartX = 0;
        let touchEndX = 0;
        
        slider.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        slider.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            const difference = touchStartX - touchEndX;
            
            if (Math.abs(difference) > 50) { // Minimum swipe distance
                moveSlider(slider.id, difference > 0 ? 1 : -1);
            }
        }, { passive: true });
    });
});

// Product Slider Functionality
function initializeProductSliders() {
    const sliders = document.querySelectorAll('.product-slider');
    
    sliders.forEach(slider => {
        const sliderId = slider.id;
        const prevBtn = slider.parentElement.querySelector('.control-btn.prev');
        const nextBtn = slider.parentElement.querySelector('.control-btn.next');
        
        // Initialize slider buttons
        updateSliderButtons(sliderId);
        
        // Add scroll event listener
        slider.addEventListener('scroll', () => {
            updateSliderButtons(sliderId);
        });
        
        // Add touch support
        let touchStartX = 0;
        let touchEndX = 0;
        
        slider.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        slider.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            const difference = touchStartX - touchEndX;
            
            if (Math.abs(difference) > 50) {
                moveSlider(sliderId, difference > 0 ? 1 : -1);
            }
        }, { passive: true });
    });
}

// Cart Management
let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];

function addToCart(productId) {
    const button = document.querySelector(`[data-product-id="${productId}"] .add-btn`);
    if (button) {
        button.classList.add('clicked'); // Add clicked class for animation
        button.disabled = true; // Disable button during the process
    }

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
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Update cart count
            const cartBadge = document.querySelector('.cart-icon .badge');
            if (cartBadge) {
                cartBadge.textContent = data.cart_count;
            }
            // Reset button after animation
            setTimeout(() => {
                if (button) {
                    button.classList.remove('clicked');
                    button.disabled = false;
                }
            }, 2000); // Reset after 2 seconds
            showNotification('Added to cart successfully!', 'success');
        } else {
            throw new Error(data.error || 'Failed to add to cart');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        if (button) {
            button.classList.remove('clicked');
            button.disabled = false;
        }
        showNotification(error.message || 'An error occurred. Please try again.', 'error');
    });
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }, 100);
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

function updateServerCart(productId) {
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
        if (data.success) updateCartCount();
    })
    .catch(error => console.error('Error:', error));
}

function updateCartCount() {
    fetch('/get-cart-count/') // Ensure this endpoint returns the current cart count
        .then(response => response.json())
        .then(data => {
            const cartCount = document.querySelector('.cart-count');
            if (cartCount) {
                cartCount.textContent = data.cart_count; // Set the initial count
            }
        })
        .catch(error => console.error('Error fetching cart count:', error));
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeProductSliders();
    
    // Update slider buttons on window resize
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            document.querySelectorAll('.product-slider').forEach(slider => {
                updateSliderButtons(slider.id);
            });
        }, 250);
    });
});
