function moveSlider(sliderId, direction) {
    const slider = document.getElementById(sliderId);
    if (!slider) return;

    const cardWidth = slider.querySelector('.product-card').offsetWidth;
    const gap = 20; // Gap between cards
    const scrollAmount = (cardWidth + gap) * 2; // Scroll 2 cards at a time

    slider.scrollBy({
        left: direction * scrollAmount,
        behavior: 'smooth'
    });

    // Update button states after scrolling
    setTimeout(() => {
        const isAtStart = slider.scrollLeft <= 0;
        const isAtEnd = slider.scrollLeft >= slider.scrollWidth - slider.offsetWidth;
        
        const prevBtn = slider.parentElement.querySelector('.prev');
        const nextBtn = slider.parentElement.querySelector('.next');
        
        if (prevBtn) {
            prevBtn.disabled = isAtStart;
            prevBtn.style.opacity = isAtStart ? '0.5' : '1';
        }
        
        if (nextBtn) {
            nextBtn.disabled = isAtEnd;
            nextBtn.style.opacity = isAtEnd ? '0.5' : '1';
        }
    }, 300);
}

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
document.addEventListener('DOMContentLoaded', function() {
    initializeProductSliders();
    updateCartCount();
});

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
            const cartCount = document.querySelector('.cart-count');
            if (cartCount) {
                cartCount.textContent = data.cart_count;
            }
            
            // Show success message
            showNotification('Added to cart successfully!', 'success');
        } else {
            throw new Error(data.error || 'Failed to add to cart');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification(error.message || 'An error occurred. Please try again.', 'error');
    })
    .finally(() => {
        // Re-enable the button
        if (addButton) {
            addButton.disabled = false;
            addButton.style.opacity = '1';
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
