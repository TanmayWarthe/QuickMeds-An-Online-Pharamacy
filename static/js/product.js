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
    const gap = 16; // Gap between cards
    const visibleWidth = slider.offsetWidth;
    const scrollAmount = Math.floor(visibleWidth / (cardWidth + gap)) * (cardWidth + gap);
    
    const newScrollPosition = slider.scrollLeft + (scrollAmount * direction);
    
    slider.scrollTo({
        left: newScrollPosition,
        behavior: 'smooth'
    });

    // Update button states after scroll
    setTimeout(() => updateSliderButtons(sliderId), 300);
}

function updateSliderButtons(sliderId) {
    const slider = document.getElementById(sliderId);
    if (!slider) return;

    const prevBtn = slider.parentElement.querySelector('.control-btn.prev');
    const nextBtn = slider.parentElement.querySelector('.control-btn.next');

    if (prevBtn) {
        prevBtn.disabled = slider.scrollLeft <= 0;
    }
    if (nextBtn) {
        nextBtn.disabled = slider.scrollLeft + slider.offsetWidth >= slider.scrollWidth - 5;
    }
}

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
    const productSections = document.querySelectorAll('.product-section');
    
    productSections.forEach((section, index) => {
        const counter = index + 1;
        const slider = document.getElementById(`productSlider${counter}`);
        const prevBtn = document.getElementById(`prevBtn${counter}`);
        const nextBtn = document.getElementById(`nextBtn${counter}`);

        if (!slider || !prevBtn || !nextBtn) return;

        const cardWidth = 300; // Width + gap

        const updateButtonStates = () => {
            const isAtStart = slider.scrollLeft <= 0;
            const isAtEnd = slider.scrollLeft >= slider.scrollWidth - slider.offsetWidth;
            
            prevBtn.disabled = isAtStart;
            nextBtn.disabled = isAtEnd;
            prevBtn.style.opacity = isAtStart ? '0.5' : '1';
            nextBtn.style.opacity = isAtEnd ? '0.5' : '1';
        };

        nextBtn.addEventListener('click', () => {
            slider.scrollBy({
                left: cardWidth * 2,
                behavior: 'smooth'
            });
            setTimeout(updateButtonStates, 100);
        });

        prevBtn.addEventListener('click', () => {
            slider.scrollBy({
                left: -cardWidth * 2,
                behavior: 'smooth'
            });
            setTimeout(updateButtonStates, 100);
        });

        slider.addEventListener('scroll', updateButtonStates);
        window.addEventListener('resize', updateButtonStates);
        updateButtonStates();
    });
}

// Cart Management
let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];

function addToCart(productId) {
    // Disable the button to prevent multiple clicks
    const addButton = document.querySelector(`[data-product-id="${productId}"] .add-btn`);
    if (addButton) {
        addButton.disabled = true;
        addButton.style.opacity = '0.7';
        // Add animation class
        addButton.classList.add('adding-to-cart');
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
            // Update cart count with animation
            const cartCount = document.querySelector('.cart-count');
            if (cartCount) {
                cartCount.textContent = data.cart_count;
                cartCount.classList.add('cart-updated');
                setTimeout(() => cartCount.classList.remove('cart-updated'), 300);
            }
            
            // Add success animation to button
            if (addButton) {
                addButton.classList.add('added-to-cart');
                setTimeout(() => addButton.classList.remove('added-to-cart'), 1000);
            }
        } else {
            throw new Error(data.error || 'Failed to add to cart');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        // Show error message only for actual errors
        showNotification(error.message || 'An error occurred. Please try again.', 'error');
    })
    .finally(() => {
        // Re-enable the button
        if (addButton) {
            addButton.disabled = false;
            addButton.style.opacity = '1';
            addButton.classList.remove('adding-to-cart');
        }
    });
}

function showNotification(message, type = 'success') {
    // Remove any existing notifications first
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add an icon based on the type
    const icon = document.createElement('i');
    icon.className = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
    icon.style.marginRight = '8px';
    notification.insertBefore(icon, notification.firstChild);
    
    document.body.appendChild(notification);
    
    // Enhanced CSS for notifications
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.padding = '15px 25px';
    notification.style.borderRadius = '4px';
    notification.style.backgroundColor = type === 'success' ? '#4CAF50' : '#f44336';
    notification.style.color = 'white';
    notification.style.zIndex = '1000';
    notification.style.display = 'flex';
    notification.style.alignItems = 'center';
    notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    notification.style.animation = 'slideIn 0.3s ease-out';
    
    // Add animation keyframes if they don't exist
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
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
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
        const count = cartItems.reduce((total, item) => total + item.quantity, 0);
        cartCount.textContent = count;
    }
}
