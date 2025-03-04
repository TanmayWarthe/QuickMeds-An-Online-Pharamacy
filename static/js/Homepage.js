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