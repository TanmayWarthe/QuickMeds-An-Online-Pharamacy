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
            if (e.target.closest('.cart-button')) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            
            const productId = this.getAttribute('data-product-id');
            if (productId) {
                navigateToProduct(productId, e);
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
function cartClick(event, productId) {
    event.preventDefault();
    event.stopPropagation();
    
    const button = event.currentTarget;
    if (button.disabled || button.classList.contains('clicked')) {
        return;
    }
    
    button.classList.add('clicked');
    
    fetch(`/add-to-cart/${productId}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        credentials: 'same-origin'
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 403) {
                showNotification('Please login to add items to cart', 'error');
                setTimeout(() => {
                    window.location.href = '/login/';
                }, 2000);
                return;
            }
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Update cart count in header
            const cartBadge = document.querySelector('.cart-icon .badge');
            if (cartBadge && data.cart_count !== undefined) {
                cartBadge.textContent = data.cart_count;
            }
            
            // Show success notification
            showNotification('Added to cart successfully!', 'success');
            
            // Animate cart icon
            const cartIcon = document.querySelector('.cart-icon');
            if (cartIcon) {
                cartIcon.classList.add('bounce');
                setTimeout(() => {
                    cartIcon.classList.remove('bounce');
                }, 1000);
            }
        } else {
            throw new Error(data.message || 'Failed to add item to cart');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification(error.message || 'Failed to add item to cart', 'error');
    })
    .finally(() => {
        // Reset button animation after delay
        setTimeout(() => {
            button.classList.remove('clicked');
        }, 2000);
    });
}

// Attach click handlers to cart buttons
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.cart-button').forEach(button => {
        button.addEventListener('click', function(event) {
            const productId = this.getAttribute('data-product-id');
            if (productId) {
                cartClick(event, productId);
            }
        });
    });
});

function addToCart(productId, quantity = 1) {
    return new Promise((resolve, reject) => {
        fetch(`/add-to-cart/${productId}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken'),
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                quantity: quantity
            })
        })
        .then(response => {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return response.json().then(data => ({ status: response.status, data }));
            } else {
                throw new Error('Server returned invalid response format');
            }
        })
        .then(({ status, data }) => {
            if (status === 200 && data.success) {
                // Update cart count
                const cartBadge = document.querySelector('.cart-icon .badge');
                if (cartBadge && data.cart_count !== undefined) {
                    cartBadge.textContent = data.cart_count;
                }
                
                // Show success message
                showNotification('Added to cart successfully!', 'success');
                
                // Trigger cart animation
                const cartIcon = document.querySelector('.cart-icon');
                if (cartIcon) {
                    cartIcon.classList.add('cart-animation');
                    setTimeout(() => {
                        cartIcon.classList.remove('cart-animation');
                    }, 1000);
                }
                
                resolve(data);
            } else {
                // Handle error cases
                let errorMessage = 'Failed to add to cart';
                if (status === 404) {
                    errorMessage = 'Product not found';
                } else if (status === 400) {
                    errorMessage = data.error || 'Invalid request';
                } else if (!data.success) {
                    errorMessage = data.error || 'Failed to add to cart';
                }
                throw new Error(errorMessage);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification(error.message || 'An unexpected error occurred', 'error');
            reject(error);
        });
    });
}

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const messageSpan = document.getElementById('notification-message');
    
    if (notification && messageSpan) {
        notification.style.display = 'flex';
        notification.className = 'notification ' + type;
        messageSpan.textContent = message;
        
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.style.display = 'none';
            }, 300);
        }, 3000);
    }
}

function navigateToProduct(productId, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    window.location.href = `/product/${productId}/`;
}

function updateServerCart(productId) {
    fetch(`/add-to-cart/${productId}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({
            quantity: 1
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to add to cart');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            updateCartCount();
            showNotification('Item added to cart successfully', 'success');
        } else {
            throw new Error(data.message || 'Failed to add to cart');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification(error.message, 'error');
    });
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

function addToCart(productId, quantity = 1) {
    const addButton = document.querySelector(`button[data-product-id="${productId}"]`);
    
    if (addButton) {
        addButton.disabled = true;
        addButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
    }

    fetch(`/add-to-cart/${productId}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            quantity: quantity
        })
    })
    .then(response => {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return response.json().then(data => ({ status: response.status, data }));
        } else {
            throw new Error('Server returned invalid response format');
        }
    })
    .then(({ status, data }) => {
        if (status === 200 && data.success) {
            // Update cart count
            const cartBadge = document.querySelector('.cart-icon .badge');
            if (cartBadge && data.cart_count !== undefined) {
                cartBadge.textContent = data.cart_count;
            }
            
            // Show success message
            showNotification('Added to cart successfully!', 'success');
            
            // Trigger cart animation if available
            const cartIcon = document.querySelector('.cart-icon');
            if (cartIcon) {
                cartIcon.classList.add('cart-animation');
                setTimeout(() => {
                    cartIcon.classList.remove('cart-animation');
                }, 1000);
            }
        } else {
            // Handle error cases
            let errorMessage = 'Failed to add to cart';
            if (status === 404) {
                errorMessage = 'Product not found';
            } else if (status === 400) {
                errorMessage = data.error || 'Invalid request';
            } else if (!data.success) {
                errorMessage = data.error || 'Failed to add to cart';
            }
            throw new Error(errorMessage);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification(error.message || 'An unexpected error occurred', 'error');
    })
    .finally(() => {
        if (addButton) {
            addButton.disabled = false;
            addButton.innerHTML = '<i class="fas fa-cart-plus"></i> Add to Cart';
        }
    });
}
