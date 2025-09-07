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

    // Optimize tab switching
    const tabLinks = document.querySelectorAll('.profile-nav li[data-tab]');
    const tabs = document.querySelectorAll('.profile-tab');
    
    function switchTab(tabId) {
        tabLinks.forEach(l => l.classList.remove('active'));
        tabs.forEach(t => {
            t.style.opacity = '0';
            t.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`.profile-nav li[data-tab="${tabId}"]`);
        const activeTab = document.getElementById(tabId);
        
        if (activeLink && activeTab) {
            activeLink.classList.add('active');
            activeTab.classList.add('active');
            
            requestAnimationFrame(() => {
                activeTab.style.opacity = '1';
            });
            
            const currentUrl = new URL(window.location.href);
            if (currentUrl.searchParams.get('tab') !== tabId) {
                history.replaceState(null, '', `?tab=${tabId}`);
            }
        }
    }
    
    // Initialize with current tab from URL or default to personal-info
    const initialTab = new URLSearchParams(window.location.search).get('tab') || 'personal-info';
    switchTab(initialTab);
    
    // Event listeners for tab switching
    tabLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            switchTab(this.dataset.tab);
        });
    });
    
    // Handle browser back/forward
    window.addEventListener('popstate', function() {
        const tabId = new URLSearchParams(window.location.search).get('tab') || 'personal-info';
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

// Address Management Functions with optimizations
const addressForm = document.getElementById('address-form');
const addressFormContainer = document.querySelector('.address-form-container');
const addAddressBtn = document.getElementById('add-address-btn');
const cancelAddressBtn = document.getElementById('cancel-address-btn');

let currentEditingAddressId = null;
let addressFormVisible = false;

// Show/Hide Address Form with optimizations
function showAddressForm() {
    if (!addressFormContainer || addressFormVisible) return;
    
        addressFormContainer.style.display = 'block';
    addressFormVisible = true;
    
    // Use IntersectionObserver for smooth scrolling
    const observer = new IntersectionObserver((entries) => {
        if (!entries[0].isIntersecting) {
            addressFormContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        observer.disconnect();
    });
    observer.observe(addressFormContainer);
    
        // Reset form when showing
    if (addressForm) {
        addressForm.reset();
        resetValidationState();
    }
    currentEditingAddressId = null;
}

function hideAddressForm() {
    if (!addressFormContainer || !addressFormVisible) return;
    
        addressFormContainer.style.display = 'none';
    addressFormVisible = false;
    
        // Reset form when hiding
    if (addressForm) {
        addressForm.reset();
        resetValidationState();
    }
        currentEditingAddressId = null;
    }

// Reset validation state
function resetValidationState() {
    const invalidFields = addressForm.querySelectorAll('.is-invalid');
    const feedbackElements = addressForm.querySelectorAll('.invalid-feedback');
    
    invalidFields.forEach(field => field.classList.remove('is-invalid'));
    feedbackElements.forEach(feedback => feedback.textContent = '');
}

// Optimize address form submission
if (addressForm) {
    addressForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!validateAddressForm()) return;

        const formData = new FormData(this);
        const formDataObject = Object.fromEntries(
            Array.from(formData.entries()).filter(([key]) => key !== 'csrfmiddlewaretoken')
        );

        try {
            const endpoint = currentEditingAddressId 
                ? `/address/${currentEditingAddressId}/update/`
                : '/address/add/';
                
            const response = await fetch(endpoint, {
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
            
            // Optimize page reload by updating DOM directly if possible
            if (data.html) {
                updateAddressList(data.html);
            } else {
                window.location.reload();
            }
        } catch (error) {
            showNotification(error.message || 'Failed to save address. Please try again.', 'error');
            console.error('Error:', error);
        }
    });
}

// Update address list without page reload
function updateAddressList(html) {
    const addressList = document.querySelector('.address-list');
    if (addressList) {
        addressList.innerHTML = html;
        initializeAddressCardEvents();
    }
}

// Initialize address card events
function initializeAddressCardEvents() {
    const addressCards = document.querySelectorAll('.address-card');
    
    addressCards.forEach(card => {
        const editBtn = card.querySelector('.btn-edit');
        const deleteBtn = card.querySelector('.btn-delete');
        const defaultBtn = card.querySelector('.btn-set-default');
        
        if (editBtn) {
            editBtn.addEventListener('click', () => editAddress(card.dataset.id));
        }
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => deleteAddress(card.dataset.id));
        }
        if (defaultBtn) {
            defaultBtn.addEventListener('click', () => setDefaultAddress(card.dataset.id));
        }
    });
}

// Edit Address
async function editAddress(addressId) {
    if (!addressId || !addressForm) return;
    
    try {
        const response = await fetch(`/address/${addressId}/`, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch address details');
        }

        const addressData = await response.json();
        
        // Populate form fields
        Object.entries(addressData).forEach(([key, value]) => {
            const field = addressForm.elements[key];
            if (field) {
                field.value = value;
            }
        });

        currentEditingAddressId = addressId;
        showAddressForm();
    } catch (error) {
        showNotification('Failed to load address details. Please try again.', 'error');
        console.error('Error:', error);
    }
}

// Delete Address
async function deleteAddress(addressId) {
    if (!addressId || !confirm('Are you sure you want to delete this address?')) {
        return;
    }

    try {
        const response = await fetch(`/address/${addressId}/delete/`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': getCookie('csrftoken'),
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete address');
        }

        const data = await response.json();

        showNotification('Address deleted successfully!', 'success');
        
        // Update DOM directly if possible
        if (data.html) {
            updateAddressList(data.html);
        } else {
            const addressCard = document.querySelector(`[data-id="${addressId}"]`);
        if (addressCard) {
            addressCard.remove();
        } else {
                window.location.reload();
            }
        }
    } catch (error) {
        showNotification(error.message || 'Failed to delete address. Please try again.', 'error');
        console.error('Error:', error);
    }
}

// Set Default Address
async function setDefaultAddress(addressId) {
    if (!addressId) return;

    try {
        const response = await fetch(`/address/${addressId}/set-default/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken'),
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to set default address');
        }

        const data = await response.json();

        showNotification('Default address updated successfully!', 'success');
        
        // Update DOM directly
        const addressCards = document.querySelectorAll('.address-card');
        addressCards.forEach(card => {
            const defaultBadge = card.querySelector('.default-badge');
            const defaultBtn = card.querySelector('.btn-set-default');
            
            if (card.dataset.id === addressId) {
                if (defaultBadge) defaultBadge.style.display = 'inline-block';
                if (defaultBtn) defaultBtn.style.display = 'none';
            } else {
                if (defaultBadge) defaultBadge.style.display = 'none';
                if (defaultBtn) defaultBtn.style.display = 'inline-block';
            }
        });
    } catch (error) {
        showNotification(error.message || 'Failed to set default address. Please try again.', 'error');
        console.error('Error:', error);
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

// Password Change Form Handling
const passwordForm = document.getElementById('password-form');
if (passwordForm) {
    passwordForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        // Reset any previous error states
        document.querySelectorAll('.password-field').forEach(field => {
            field.classList.remove('is-invalid');
        });

        // Validate passwords
        if (!currentPassword) {
            showFieldError('current-password', 'Current password is required');
            return;
        }

        if (!newPassword) {
            showFieldError('new-password', 'New password is required');
            return;
        }

        if (newPassword.length < 8) {
            showFieldError('new-password', 'Password must be at least 8 characters long');
            return;
        }

        if (newPassword !== confirmPassword) {
            showFieldError('confirm-password', 'Passwords do not match');
            return;
        }

        try {
            const response = await fetch('/change-password/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword
                })
            });

            const data = await response.json();

            if (response.ok) {
                showNotification('Password updated successfully!', 'success');
                passwordForm.reset();
            } else {
                showNotification(data.message || 'Failed to update password', 'error');
                if (data.field) {
                    showFieldError(data.field, data.message);
                }
            }
        } catch (error) {
            showNotification('An error occurred while updating password', 'error');
        }
    });
}

function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (field) {
        field.classList.add('is-invalid');
        const errorDiv = field.nextElementSibling;
        if (errorDiv && errorDiv.classList.contains('invalid-feedback')) {
            errorDiv.textContent = message;
        } else {
            const div = document.createElement('div');
            div.className = 'invalid-feedback';
            div.textContent = message;
            field.parentNode.insertBefore(div, field.nextSibling);
        }
    }
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

// Add CSS for animations (removed dashboard-specific styles)
const style = document.createElement('style');
style.textContent = `
    .quick-actions .action-btn {
        transition: all 0.3s ease;
    }
    
    .quick-actions .action-btn:hover {
        transform: translateY(-5px);
        box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    }
`;
document.head.appendChild(style);

// Initialize address management
function initializeAddressManagement() {
    if (addAddressBtn) {
        addAddressBtn.addEventListener('click', showAddressForm);
    }
    
    if (cancelAddressBtn) {
        cancelAddressBtn.addEventListener('click', (e) => {
            e.preventDefault();
            hideAddressForm();
        });
    }

    initializeAddressCardEvents();
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeAddressManagement);

// Show notification function
function showNotification(message, type = 'success') {
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Create notification content with simpler design
    notification.innerHTML = `
        <div class="notification-content">
            <p>${message}</p>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Add styles if they don't exist
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 24px;
                border-radius: 4px;
                transform: translateX(120%);
                transition: transform 0.3s ease;
                z-index: 10000;
                min-width: 200px;
                max-width: 400px;
                text-align: center;
            }
            .notification.show {
                transform: translateX(0);
            }
            .notification.success {
                background: #4CAF50;
                color: white;
            }
            .notification.error {
                background: #f44336;
                color: white;
            }
            .notification-content {
                display: flex;
                justify-content: center;
                align-items: center;
            }
            .notification-content p {
                margin: 0;
                font-size: 1rem;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Trigger animation
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Remove notification after delay
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Toggle between view and edit modes
function toggleEditMode() {
    const viewMode = document.getElementById('profile-view');
    const editMode = document.getElementById('profile-edit');
    
    if (viewMode.style.display !== 'none') {
        viewMode.style.display = 'none';
        editMode.style.display = 'block';
        editMode.scrollIntoView({ behavior: 'smooth' });
    } else {
        editMode.style.display = 'none';
        viewMode.style.display = 'block';
        document.getElementById('profile-form').reset();
        clearValidationErrors();
    }
}

// Clear validation errors
function clearValidationErrors() {
    document.querySelectorAll('.is-invalid').forEach(el => {
        el.classList.remove('is-invalid');
        const feedback = el.nextElementSibling;
        if (feedback && feedback.classList.contains('invalid-feedback')) {
            feedback.textContent = '';
        }
    });
}

// Show validation error
function showValidationError(field, message) {
    const input = document.getElementById(field);
    if (input) {
        input.classList.add('is-invalid');
        const feedback = input.nextElementSibling;
        if (feedback && feedback.classList.contains('invalid-feedback')) {
            feedback.textContent = message;
        }
    }
}

// Validate form fields
function validateProfileForm() {
    let isValid = true;
    clearValidationErrors();

    // Validate first name
    const firstName = document.getElementById('first_name');
    if (!firstName.value.trim()) {
        showValidationError('first_name', 'First name is required');
        isValid = false;
    }

    // Validate last name
    const lastName = document.getElementById('last_name');
    if (!lastName.value.trim()) {
        showValidationError('last_name', 'Last name is required');
        isValid = false;
    }

    // Validate phone number
    const phone = document.getElementById('phone');
    if (phone.value.trim() && !/^[0-9]{10}$/.test(phone.value.trim())) {
        showValidationError('phone', 'Please enter a valid 10-digit phone number');
        isValid = false;
    }

    return isValid;
}

// Update profile information in view mode
function updateProfileView(data) {
    const fullName = document.querySelector('#profile-view .info-value');
    if (fullName) {
        fullName.textContent = `${data.first_name} ${data.last_name}`;
    }

    const phone = document.querySelector('#profile-view .info-item:nth-child(3) .info-value');
    if (phone) {
        phone.textContent = data.phone || 'Not provided';
    }

    const gender = document.querySelector('#profile-view .info-item:nth-child(4) .info-value');
    if (gender) {
        let genderText = 'Not specified';
        if (data.gender === 'M') genderText = 'Male';
        else if (data.gender === 'F') genderText = 'Female';
        else if (data.gender === 'O') genderText = 'Other';
        gender.textContent = genderText;
    }

    // Update sidebar name if it exists
    const sidebarName = document.querySelector('.profile-user-info h3');
    if (sidebarName) {
        sidebarName.textContent = `${data.first_name} ${data.last_name}`;
    }
}

// Handle form submission
document.addEventListener('DOMContentLoaded', function() {
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (!validateProfileForm()) {
                return;
            }

            const formData = new FormData(this);
            try {
                const response = await fetch('/update-profile/', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-CSRFToken': getCookie('csrftoken')
                    }
                });

                const data = await response.json();
                
                if (response.ok && data.status === 'success') {
                    showNotification('Profile updated successfully!', 'success');
                    updateProfileView(data.data);
                    toggleEditMode(); // Switch back to view mode
                } else {
                    showNotification(data.message || 'Failed to update profile', 'error');
                    if (data.errors) {
                        Object.keys(data.errors).forEach(field => {
                            showValidationError(field, data.errors[field][0]);
                        });
                    }
                }
            } catch (error) {
                console.error('Error:', error);
                showNotification('An error occurred while updating profile', 'error');
            }
        });
    }

    // Handle profile image upload
    const profileImageUpload = document.getElementById('profile-image-upload');
    if (profileImageUpload) {
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
                    
                    const data = await response.json();
                    
                    if (response.ok && data.success) {
                        // Update profile image in both sidebar and view mode
                        const profileImages = document.querySelectorAll('.profile-avatar img');
                        profileImages.forEach(img => {
                            img.src = data.image_url;
                        });
                        showNotification('Profile image updated successfully!', 'success');
                    } else {
                        showNotification(data.message || 'Failed to update profile image', 'error');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    showNotification('An error occurred while updating profile image', 'error');
                }
            }
        });
    }
});
