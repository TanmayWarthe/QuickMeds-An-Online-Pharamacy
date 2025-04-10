document.addEventListener('DOMContentLoaded', function() {
    // Sidebar Toggle Function
    window.toggleSidebar = function() {
        const sidebar = document.getElementById("sidebar");
        sidebar.classList.toggle('active');
    }

    // Menu button click handler
    const menuBtn = document.querySelector('.menu-btn');
    if (menuBtn) {
        menuBtn.addEventListener('click', function(e) {
            e.preventDefault();
            toggleSidebar();
        });
    }

    // Close sidebar when clicking outside
    document.addEventListener('click', function(e) {
        const sidebar = document.getElementById("sidebar");
        const menuBtn = document.querySelector('.menu-btn');
        
        if (sidebar && menuBtn && !sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    });

    // Initialize Bootstrap dropdowns
    if (typeof bootstrap !== 'undefined') {
        var dropdownElementList = [].slice.call(document.querySelectorAll('.dropdown-toggle'))
        var dropdownList = dropdownElementList.map(function (dropdownToggleEl) {
            return new bootstrap.Dropdown(dropdownToggleEl)
        });
    }

    // Tab Navigation
    const tabLinks = document.querySelectorAll('.profile-nav li[data-tab]');
    const tabs = document.querySelectorAll('.profile-tab');
    
    tabLinks.forEach(link => {
        link.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            
            tabLinks.forEach(l => l.classList.remove('active'));
            tabs.forEach(t => t.classList.remove('active'));
            
            this.classList.add('active');
            document.getElementById(tabId).classList.add('active');
            
            // Update URL without page reload
            history.pushState(null, '', `?tab=${tabId}`);
        });
    });
    
    // Handle browser back/forward
    window.addEventListener('popstate', function() {
        const tabId = new URLSearchParams(window.location.search).get('tab') || 'dashboard';
        switchTab(tabId);
    });

    // Field validations
    const inputs = document.querySelectorAll('.form-control');
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            this.classList.remove('is-invalid');
        });
    });
});

// Profile Icon Dropdown functionality
document.addEventListener('DOMContentLoaded', function() {
    const profileDropdown = document.querySelector('.profile-dropdown');
    const profileIcon = document.querySelector('.profile-icon');
    
    if (profileIcon && profileDropdown) {
        // Toggle dropdown on profile icon click
        profileIcon.addEventListener('click', function(e) {
            e.stopPropagation();
            profileDropdown.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!profileDropdown.contains(e.target) && !profileIcon.contains(e.target)) {
                profileDropdown.classList.remove('show');
            }
        });
    }
});

// Profile Image Upload
const profileImageUpload = document.getElementById('profile-image-upload');
const profileAvatar = document.querySelector('.profile-avatar img');

if (profileImageUpload && profileAvatar) {
    profileImageUpload.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (file) {
            const formData = new FormData();
            formData.append('profile_image', file);
            
            try {
                const response = await fetch('/update-profile-image/', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-CSRFToken': getCookie('csrftoken')
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    profileAvatar.src = data.image_url;
                    showNotification('Profile image updated successfully!', 'success');
                }
            } catch (error) {
                showNotification('Failed to update profile image', 'error');
            }
        }
    });
}

// Form Validations
const profileForm = document.getElementById('profile-form');
if (profileForm) {
    profileForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        if (validateProfileForm()) {
            const formData = new FormData(this);
            
            try {
                const response = await fetch('/update-profile/', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-CSRFToken': getCookie('csrftoken')
                    }
                });
                
                if (response.ok) {
                    showNotification('Profile updated successfully!', 'success');
                }
            } catch (error) {
                showNotification('Failed to update profile', 'error');
            }
        }
    });
}

// Address Management Functions
const addressForm = document.getElementById('address-form');
const addressFormContainer = document.querySelector('.address-form-container');
const addAddressBtn = document.getElementById('add-address-btn');
const cancelAddressBtn = document.getElementById('cancel-address-btn');

let currentEditingAddressId = null;

// Show/Hide Address Form
function showAddressForm() {
    if (addressFormContainer) {
        addressFormContainer.style.display = 'block';
        addressFormContainer.scrollIntoView({ behavior: 'smooth' });
        // Reset form when showing
        addressForm.reset();
        currentEditingAddressId = null;
    }
}

function hideAddressForm() {
    if (addressFormContainer) {
        addressFormContainer.style.display = 'none';
        // Reset form when hiding
        addressForm.reset();
        currentEditingAddressId = null;
    }
}

// Initialize Address Form Events
if (addressForm) {
    addressForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!validateAddressForm()) {
            return;
        }

        const formData = new FormData(this);
        const formDataObject = {};
        formData.forEach((value, key) => {
            if (key !== 'csrfmiddlewaretoken') {
                formDataObject[key] = value;
            }
        });

        try {
            const response = await fetch(currentEditingAddressId 
                ? `/address/${currentEditingAddressId}/update/`
                : '/address/add/', {
                method: currentEditingAddressId ? 'PUT' : 'POST',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken'),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formDataObject)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save address');
            }

            const data = await response.json();
            
            showNotification(
                currentEditingAddressId 
                    ? 'Address updated successfully!' 
                    : 'New address added successfully!',
                'success'
            );
            hideAddressForm();
            window.location.reload(); // Refresh to show updated addresses
        } catch (error) {
            showNotification(error.message || 'Failed to save address. Please try again.', 'error');
            console.error('Error:', error);
        }
    });
}

// Edit Address
async function editAddress(addressId) {
    try {
        const response = await fetch(`/address/${addressId}/`);
        if (!response.ok) {
            throw new Error('Failed to fetch address details');
        }

        const address = await response.json();
        currentEditingAddressId = addressId;
        
        // Populate form fields
        const form = document.getElementById('address-form');
        if (form) {
            form.elements['full_name'].value = address.full_name;
            form.elements['phone_number'].value = address.phone_number;
            form.elements['type'].value = address.type;
            form.elements['street_address'].value = address.street_address;
            form.elements['city'].value = address.city;
            form.elements['state'].value = address.state;
            form.elements['postal_code'].value = address.postal_code;
            form.elements['is_default'].checked = address.is_default;
        }
        
        showAddressForm();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// Delete Address
async function deleteAddress(addressId) {
    if (!confirm('Are you sure you want to delete this address?')) {
        return;
    }

    try {
        const response = await fetch(`/address/${addressId}/delete/`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Failed to delete address');
        }

        showNotification('Address deleted successfully!', 'success');
        
        // Remove the address card from DOM
        const addressCard = document.querySelector(`.address-card[data-id="${addressId}"]`);
        if (addressCard) {
            addressCard.remove();
        } else {
            window.location.reload(); // Fallback: refresh the page
        }
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// Set Default Address
async function setDefaultAddress(addressId) {
    try {
        const response = await fetch(`/address/${addressId}/set-default/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken'),
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Failed to set default address');
        }

        showNotification('Default address updated successfully!', 'success');
        window.location.reload(); // Refresh to update UI
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// Validate Address Form
function validateAddressForm() {
    const form = document.getElementById('address-form');
    let isValid = true;

    // Required fields
    const requiredFields = ['full_name', 'phone_number', 'street_address', 'city', 'state', 'postal_code'];
    requiredFields.forEach(field => {
        const input = form.elements[field];
        if (!input.value.trim()) {
            showFieldError(input, 'This field is required');
            isValid = false;
        } else {
            input.classList.remove('is-invalid');
            const feedback = input.nextElementSibling;
            if (feedback && feedback.classList.contains('invalid-feedback')) {
                feedback.textContent = '';
            }
        }
    });

    // Phone number validation
    const phoneInput = form.elements['phone_number'];
    if (phoneInput.value && !/^\d{10}$/.test(phoneInput.value.trim())) {
        showFieldError(phoneInput, 'Please enter a valid 10-digit phone number');
        isValid = false;
    }

    // Postal code validation
    const postalInput = form.elements['postal_code'];
    if (postalInput.value && !/^\d{6}$/.test(postalInput.value.trim())) {
        showFieldError(postalInput, 'Please enter a valid 6-digit postal code');
        isValid = false;
    }

    return isValid;
}

// Show field error
function showFieldError(field, message) {
    field.classList.add('is-invalid');
    const feedback = field.nextElementSibling;
    if (feedback && feedback.classList.contains('invalid-feedback')) {
        feedback.textContent = message;
    }
}

// Reset form fields
function resetAddressForm() {
    const form = document.getElementById('address-form');
    if (form) {
        form.reset();
        const invalidFields = form.querySelectorAll('.is-invalid');
        invalidFields.forEach(field => {
            field.classList.remove('is-invalid');
            const feedback = field.nextElementSibling;
            if (feedback && feedback.classList.contains('invalid-feedback')) {
                feedback.textContent = '';
            }
        });
    }
}

// Event Listeners for Address Management
document.addEventListener('DOMContentLoaded', function() {
    // Add Address button
    if (addAddressBtn) {
        addAddressBtn.addEventListener('click', showAddressForm);
    }

    // Cancel button
    if (cancelAddressBtn) {
        cancelAddressBtn.addEventListener('click', hideAddressForm);
    }

    // Form field validation
    const addressFormInputs = document.querySelectorAll('#address-form .form-control');
    addressFormInputs.forEach(input => {
        input.addEventListener('input', function() {
            this.classList.remove('is-invalid');
            const feedback = this.nextElementSibling;
            if (feedback && feedback.classList.contains('invalid-feedback')) {
                feedback.textContent = '';
            }
        });
    });
});

// Password Change
const passwordForm = document.getElementById('password-form');
if (passwordForm) {
    passwordForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        if (validatePasswordForm()) {
            const formData = new FormData(this);
            
            try {
                const response = await fetch('/change-password/', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-CSRFToken': getCookie('csrftoken')
                    }
                });
                
                if (response.ok) {
                    showNotification('Password changed successfully!', 'success');
                    this.reset();
                }
            } catch (error) {
                showNotification('Failed to change password', 'error');
            }
        }
    });
}

// Cancel Order Function
function cancelOrder(orderId) {
    if (!confirm('Are you sure you want to cancel this order?')) {
        return;
    }

    const csrftoken = getCookie('csrftoken');
    
    fetch(`/orders/${orderId}/cancel/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrftoken,
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            showNotification('Order cancelled successfully', 'success');
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } else {
            showNotification(data.message || 'Failed to cancel order', 'error');
        }
    })
    .catch(error => {
        showNotification('An error occurred. Please try again.', 'error');
        console.error('Error:', error);
    });
}

// Utility Functions
function validateProfileForm() {
    let isValid = true;
    const phone = document.getElementById('phone');
    
    if (phone && !/^\d{10}$/.test(phone.value)) {
        showFieldError(phone, 'Please enter a valid 10-digit phone number');
        isValid = false;
    }
    
    return isValid;
}

function validatePasswordForm() {
    const newPassword = document.getElementById('new_password');
    const confirmPassword = document.getElementById('confirm_password');
    let isValid = true;
    
    if (newPassword.value !== confirmPassword.value) {
        showFieldError(confirmPassword, 'Passwords do not match');
        isValid = false;
    }
    
    if (newPassword.value.length < 8) {
        showFieldError(newPassword, 'Password must be at least 8 characters long');
        isValid = false;
    }
    
    return isValid;
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Trigger animation
    requestAnimationFrame(() => {
        notification.classList.add('show');
    });
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.classList.add('hide');
        setTimeout(() => {
            notification.remove();
        }, 300);
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

function switchTab(tabId) {
    const tab = document.querySelector(`.profile-nav li[data-tab="${tabId}"]`);
    if (tab) {
        tab.click();
    }
}

// Add animation to stat cards when they come into view
function animateStatCards() {
    const statCards = document.querySelectorAll('.stat-card');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                
                // Animate progress bar
                const progressBar = entry.target.querySelector('.progress-bar');
                if (progressBar) {
                    const width = progressBar.style.width;
                    progressBar.style.width = '0%';
                    setTimeout(() => {
                        progressBar.style.width = width;
                    }, 100);
                }
                
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });

    statCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'all 0.6s ease-out';
        observer.observe(card);
    });
}

// Add hover effects to action buttons
function initializeActionButtons() {
    const actionButtons = document.querySelectorAll('.action-btn');
    
    actionButtons.forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            const icon = btn.querySelector('i');
            if (icon) {
                icon.style.transform = 'scale(1.2) rotate(5deg)';
            }
        });
        
        btn.addEventListener('mouseleave', () => {
            const icon = btn.querySelector('i');
            if (icon) {
                icon.style.transform = 'scale(1) rotate(0)';
            }
        });
    });
}

// Animate activity timeline items
function animateActivityTimeline() {
    const activityItems = document.querySelectorAll('.activity-item');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateX(0)';
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });

    activityItems.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateX(-20px)';
        item.style.transition = `all 0.5s ease-out ${index * 0.1}s`;
        observer.observe(item);
    });
}

// Initialize dashboard
function initializeDashboard() {
    animateStatCards();
    initializeActionButtons();
    animateActivityTimeline();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    
    // Tab switching with smooth transitions
    const tabLinks = document.querySelectorAll('.profile-nav li[data-tab]');
    const tabs = document.querySelectorAll('.profile-tab');
    
    tabLinks.forEach(link => {
        link.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            
            // Remove active classes
            tabLinks.forEach(l => l.classList.remove('active'));
            tabs.forEach(t => {
                t.style.opacity = '0';
                t.classList.remove('active');
            });
            
            // Add active classes
            this.classList.add('active');
            const activeTab = document.getElementById(tabId);
            activeTab.classList.add('active');
            
            // Animate new tab
            setTimeout(() => {
                activeTab.style.opacity = '1';
                if (tabId === 'dashboard') {
                    initializeDashboard();
                }
            }, 50);
            
            // Update URL without page reload
            history.pushState(null, '', `?tab=${tabId}`);
        });
    });
    
    // Handle browser back/forward
    window.addEventListener('popstate', function() {
        const tabId = new URLSearchParams(window.location.search).get('tab') || 'dashboard';
        switchTab(tabId);
    });
});
