// Product Detail Page JavaScript

// Global state
let currentQuantity = 1;
let isWishlisted = false;

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    loadRelatedProducts();
    updateCartCount();
});

function initializePage() {
    // Set initial quantity
    const quantityInput = document.getElementById('quantity');
    if (quantityInput) {
        currentQuantity = parseInt(quantityInput.value) || 1;
    }
    
    // Check if product is in wishlist
    checkWishlistStatus();
    
    // Add event listeners
    addEventListeners();
    
    // Initialize image gallery if needed
    initializeImageGallery();
}

function addEventListeners() {
    // Prevent form submission on Enter key in quantity input
    const quantityInput = document.getElementById('quantity');
    if (quantityInput) {
        quantityInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
            }
        });
    }
}

// Quantity Controls
function incrementQuantity() {
    const quantityInput = document.getElementById('quantity');
    const maxQuantity = parseInt(quantityInput.max);
    
    if (currentQuantity < maxQuantity) {
        currentQuantity++;
        quantityInput.value = currentQuantity;
    } else {
        showNotification(`Maximum ${maxQuantity} items available`, 'error');
    }
}

function decrementQuantity() {
    const quantityInput = document.getElementById('quantity');
    
    if (currentQuantity > 1) {
        currentQuantity--;
        quantityInput.value = currentQuantity;
    }
}

// Add to Cart
function addToCartFromDetail() {
    const button = event.currentTarget;
    
    if (button.disabled) {
        return;
    }
    
    // Disable button temporarily
    button.disabled = true;
    const originalHTML = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
    
    fetch(`/add-to-cart/${PRODUCT_ID}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({
            'product_id': PRODUCT_ID,
            'quantity': currentQuantity
        }),
        credentials: 'same-origin'
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 403) {
                showNotification('Please login to add items to cart', 'error');
                setTimeout(() => {
                    window.location.href = '/login/';
                }, 2000);
                throw new Error('Not authenticated');
            }
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            updateCartCount();
            showNotification(`${currentQuantity} item(s) added to cart!`, 'success');
            
            // Animate the button
            button.innerHTML = '<i class="fas fa-check"></i> Added!';
            button.style.background = '#4CAF50';
            
            // Animate cart icon
            const cartIcon = document.querySelector('.cart-icon');
            if (cartIcon) {
                cartIcon.classList.add('bounce');
                setTimeout(() => {
                    cartIcon.classList.remove('bounce');
                }, 1000);
            }
            
            // Reset button after delay
            setTimeout(() => {
                button.innerHTML = originalHTML;
                button.style.background = '';
                button.disabled = false;
            }, 2000);
        } else {
            throw new Error(data.message || 'Failed to add item to cart');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification(error.message || 'Failed to add to cart', 'error');
        button.innerHTML = originalHTML;
        button.disabled = false;
    });
}

// Buy Now
function buyNow() {
    const button = event.currentTarget;
    
    if (button.disabled) {
        return;
    }
    
    button.disabled = true;
    const originalHTML = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    
    fetch(`/add-to-cart/${PRODUCT_ID}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({
            'product_id': PRODUCT_ID,
            'quantity': currentQuantity,
            'buy_now': true
        }),
        credentials: 'same-origin'
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 403) {
                showNotification('Please login to continue', 'error');
                setTimeout(() => {
                    window.location.href = '/login/';
                }, 2000);
                throw new Error('Not authenticated');
            }
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Redirect to checkout
            window.location.href = '/checkout/';
        } else {
            throw new Error(data.message || 'Failed to process order');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification(error.message || 'Failed to process order', 'error');
        button.innerHTML = originalHTML;
        button.disabled = false;
    });
}

// Wishlist
function toggleWishlist() {
    const button = event.currentTarget;
    const icon = button.querySelector('i');
    
    if (isWishlisted) {
        // Remove from wishlist
        icon.classList.remove('fas');
        icon.classList.add('far');
        button.classList.remove('active');
        isWishlisted = false;
        showNotification('Removed from wishlist', 'success');
    } else {
        // Add to wishlist
        icon.classList.remove('far');
        icon.classList.add('fas');
        button.classList.add('active');
        isWishlisted = true;
        showNotification('Added to wishlist', 'success');
    }
}

function checkWishlistStatus() {
    // This would typically check against a server endpoint
    // For now, we'll check localStorage
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    isWishlisted = wishlist.includes(PRODUCT_ID);
    
    if (isWishlisted) {
        const button = document.querySelector('.btn-wishlist');
        const icon = button?.querySelector('i');
        if (icon) {
            icon.classList.remove('far');
            icon.classList.add('fas');
            button.classList.add('active');
        }
    }
}

// Notify When Available
function notifyWhenAvailable() {
    showNotification('You will be notified when this product is back in stock', 'success');
}

// Tab Switching
function switchTab(tabName) {
    // Remove active class from all tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Add active class to selected tab
    const selectedBtn = event.currentTarget;
    selectedBtn.classList.add('active');
    
    const selectedContent = document.getElementById(tabName);
    if (selectedContent) {
        selectedContent.classList.add('active');
    }
}

// Image Zoom
function toggleImageZoom() {
    const modal = document.getElementById('imageZoomModal');
    const mainImage = document.getElementById('mainImage');
    const zoomedImage = document.getElementById('zoomedImage');
    
    if (modal && mainImage && zoomedImage) {
        zoomedImage.src = mainImage.src;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeImageZoom() {
    const modal = document.getElementById('imageZoomModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Share Menu
function toggleShareMenu() {
    const shareMenu = document.getElementById('shareMenu');
    if (shareMenu) {
        shareMenu.classList.toggle('active');
    }
}

// Share Product
function shareVia(platform) {
    const url = window.location.href;
    const title = document.querySelector('.product-title')?.textContent || 'Check out this product';
    const text = `${title} - QuickMeds`;
    
    let shareUrl = '';
    
    switch(platform) {
        case 'whatsapp':
            shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
            break;
        case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
            break;
        case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
            break;
        case 'copy':
            navigator.clipboard.writeText(url).then(() => {
                showNotification('Link copied to clipboard!', 'success');
                toggleShareMenu();
            }).catch(err => {
                console.error('Failed to copy:', err);
                showNotification('Failed to copy link', 'error');
            });
            return;
    }
    
    if (shareUrl) {
        window.open(shareUrl, '_blank', 'width=600,height=400');
        toggleShareMenu();
    }
}

// Close share menu when clicking outside
document.addEventListener('click', function(event) {
    const shareMenu = document.getElementById('shareMenu');
    const shareBtn = document.querySelector('.share-btn');
    
    if (shareMenu && shareBtn) {
        if (!shareMenu.contains(event.target) && !shareBtn.contains(event.target)) {
            shareMenu.classList.remove('active');
        }
    }
});

// Close zoom modal on Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeImageZoom();
    }
});

// Image Gallery
function initializeImageGallery() {
    // This function would initialize a thumbnail gallery if multiple images exist
    // For now, it's a placeholder for future implementation
    const thumbnailGallery = document.getElementById('thumbnailGallery');
    
    // Example: If there were multiple images, we'd show the gallery
    // For single image products, keep it hidden
}

// Load Related Products
function loadRelatedProducts() {
    const container = document.getElementById('relatedProducts');
    
    if (!container) {
        return;
    }
    
    // Show loading state
    container.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
    
    // Fetch related products from the same category
    fetch(`/api/related-products/${PRODUCT_ID}/?category_id=${PRODUCT_CATEGORY_ID}`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        },
        credentials: 'same-origin'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to load related products');
        }
        return response.json();
    })
    .then(data => {
        if (data.success && data.products && data.products.length > 0) {
            displayRelatedProducts(data.products);
        } else {
            // If no related products, hide the section
            container.innerHTML = '<p style="text-align: center; color: #757575;">No related products found</p>';
        }
    })
    .catch(error => {
        console.error('Error loading related products:', error);
        container.innerHTML = '<p style="text-align: center; color: #757575;">Unable to load related products</p>';
    });
}

function displayRelatedProducts(products) {
    const container = document.getElementById('relatedProducts');
    
    if (!container) {
        return;
    }
    
    container.innerHTML = products.slice(0, 4).map(product => `
        <div class="product-card" onclick="navigateToProduct(${product.id}, event)" data-product-id="${product.id}">
            <div class="product-image-wrapper">
                <img src="${product.image_url || '/static/img/medicines-icon.png'}" alt="${product.name}" class="product-image">
                ${product.discount_percentage > 0 ? `<span class="discount-badge">-${product.discount_percentage}%</span>` : ''}
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <div class="product-price">
                    <span class="current-price">₹${product.price}</span>
                    ${product.original_price && product.original_price > product.price ? 
                        `<span class="original-price">₹${product.original_price}</span>` : ''}
                </div>
                ${product.stock > 0 ? 
                    `<button class="btn-add-cart" onclick="addToCartQuick(event, ${product.id})">
                        <i class="fas fa-shopping-cart"></i> Add to Cart
                    </button>` :
                    `<button class="btn-out-of-stock" disabled>Out of Stock</button>`
                }
            </div>
        </div>
    `).join('');
}

// Quick add to cart for related products
function addToCartQuick(event, productId) {
    event.stopPropagation();
    event.preventDefault();
    
    const button = event.currentTarget;
    const originalHTML = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    button.disabled = true;
    
    fetch(`/add-to-cart/${productId}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({
            'product_id': productId,
            'quantity': 1
        }),
        credentials: 'same-origin'
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 403) {
                showNotification('Please login to add items to cart', 'error');
                setTimeout(() => {
                    window.location.href = '/login/';
                }, 2000);
                throw new Error('Not authenticated');
            }
            throw new Error('Failed to add to cart');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            updateCartCount();
            showNotification('Added to cart successfully!', 'success');
            button.innerHTML = '<i class="fas fa-check"></i> Added';
            
            setTimeout(() => {
                button.innerHTML = originalHTML;
                button.disabled = false;
            }, 2000);
        } else {
            throw new Error(data.message || 'Failed to add to cart');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification(error.message || 'Failed to add to cart', 'error');
        button.innerHTML = originalHTML;
        button.disabled = false;
    });
}

// Navigate to Product
function navigateToProduct(productId, event) {
    if (event) {
        // Don't navigate if clicking on the add to cart button
        if (event.target.closest('.btn-add-cart')) {
            return;
        }
    }
    // Open in same tab
    window.location.href = `/product/${productId}/`;
}

// Update Cart Count
function updateCartCount() {
    fetch('/get-cart-count/', {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        credentials: 'same-origin'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to get cart count');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            updateCartBadge(data.cart_count);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// Update Cart Badge
function updateCartBadge(count) {
    const cartBadge = document.querySelector('.cart-badge');
    if (cartBadge) {
        if (count > 0) {
            cartBadge.textContent = count;
            cartBadge.style.display = 'flex';
            // Add bounce animation
            cartBadge.classList.add('bounce');
            setTimeout(() => {
                cartBadge.classList.remove('bounce');
            }, 500);
        } else {
            cartBadge.style.display = 'none';
        }
    }
}

// Notification System
// Notification System
function showNotification(message, type = 'success') {
    // Toast notification removed as per request.
    // Logging to console for debugging purposes.
    console.log(`Notification (${type}): ${message}`);
}

// Get CSRF Token
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

// Scroll to top functionality
window.addEventListener('scroll', function() {
    const scrollBtn = document.getElementById('scrollTopBtn');
    if (scrollBtn) {
        if (window.pageYOffset > 300) {
            scrollBtn.classList.add('visible');
        } else {
            scrollBtn.classList.remove('visible');
        }
    }
});

// End of product-detail.js
