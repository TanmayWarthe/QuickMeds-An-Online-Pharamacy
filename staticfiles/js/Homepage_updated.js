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
    function addToCart(productId, event) {
        // Add animation to cart button
        function addCartAnimation(button) {
            button.classList.add('clicked');
            setTimeout(() => {
                button.classList.remove('clicked');
            }, 800);
        }

        // Update the cart click handler
        function cartClick(event, productId) {
            event.preventDefault();
            event.stopPropagation();
            
            const button = event.currentTarget;
            if (button.disabled) return;
            
            button.disabled = true;
            addCartAnimation(button);
            
            // Add to cart logic
            fetch(`/add-to-cart/${productId}/`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                },
                credentials: 'same-origin'  // This will send cookies including sessionid
            })
            .then(response => {
                if (!response.ok) {
                    if (response.status === 403) {
                        showNotification('<i class="fas fa-exclamation-circle"></i> Please login or sign up to add items to cart', 'warning');
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
                    
                    // Show success message
                    showNotification('<i class="fas fa-check-circle"></i> Item added successfully', 'success');

                    // Reset button after animation
                    setTimeout(() => {
                        const buttons = document.querySelectorAll('.cart-button');
                        for (const button of buttons) {
                            const productCard = button.closest('.product-card');
                            if (productCard && productCard.dataset.productId == productId) {
                                button.classList.remove('clicked');
                                break;
                            }
                        }
                    }, 2000);
                } else {
                    throw new Error(data.message || 'Failed to add item to cart');
                }
                button.disabled = false;
            })
            .catch(error => {
                console.error('Error:', error);
                const buttons = document.querySelectorAll('.cart-button');
                for (const button of buttons) {
                    const productCard = button.closest('.product-card');
                    if (productCard && productCard.dataset.productId == productId) {
                        button.classList.remove('clicked');
                        break;
                    }
                }
                showNotification(error.message || 'Failed to add item to cart', 'error');
                button.disabled = false;
            });
        }

        // If event is not provided, it means it was called from an onclick attribute
        if (!event) {
            // Find the button that was clicked based on productId
            const buttons = document.querySelectorAll('.cart-button');
            let clickedButton = null;
            
            for (const button of buttons) {
                const productCard = button.closest('.product-card');
                if (productCard && productCard.dataset.productId == productId) {
                    clickedButton = button;
                    break;
                }
            }
            
            if (clickedButton) {
                if (clickedButton.disabled || clickedButton.classList.contains('clicked')) {
                    return;
                }
                cartClick({ preventDefault: () => {}, stopPropagation: () => {}, currentTarget: clickedButton }, productId);
            }
        } else {
            cartClick(event, productId);
        }
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

    // Notification function
    function showNotification(message, type = 'success') {
        // Remove any existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        // Create more engaging messages for success
        let displayMessage = message;
        let icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
        
        if (type === 'success' && message.includes('added to cart')) {
            // Random success messages for cart additions
            const successMessages = [
                "Great choice! Added to your cart ",
                "Item added! Your health is our priority ",
                "Added to cart! Ready for checkout when you are ",
                "Success! Your medicine cabinet is growing ",
                "Added to cart! Quick healing starts here "
            ];
            displayMessage = successMessages[Math.floor(Math.random() * successMessages.length)];
            icon = 'fa-cart-plus';
        }
        
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${icon}"></i>
                <div>
                    <strong>${type === 'success' ? 'Success!' : 'Error!'}</strong>
                    <p>${displayMessage}</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Remove notification after delay
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 500);
        }, 4000);
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
