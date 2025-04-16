document.addEventListener('DOMContentLoaded', function() {
    // Initialize all interactive elements
    initializeDashboard();
    initializeQuickActions();
    initializeRecentActivity();
});

function initializeDashboard() {
    // Handle navigation between dashboard sections
    const navItems = document.querySelectorAll('.dashboard-nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.getAttribute('data-target');
            showSection(target);
        });
    });
}

function initializeQuickActions() {
    // Shop Now button
    const shopNowBtn = document.querySelector('[data-action="shop-now"]');
    if (shopNowBtn) {
        shopNowBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = '/products/';
        });
    }

    // Add Address button
    const addAddressBtn = document.querySelector('[data-action="add-address"]');
    if (addAddressBtn) {
        addAddressBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showAddAddressForm();
        });
    }

    // Order History button
    const orderHistoryBtn = document.querySelector('[data-action="order-history"]');
    if (orderHistoryBtn) {
        orderHistoryBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = '/orders/';
        });
    }
}

function showSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.dashboard-section');
    sections.forEach(section => section.classList.remove('active'));

    // Show selected section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Update active state of navigation items
    const navItems = document.querySelectorAll('.dashboard-nav-item');
    navItems.forEach(item => {
        if (item.getAttribute('data-target') === sectionId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

function showAddAddressForm() {
    const addressForm = document.getElementById('addressForm');
    if (addressForm) {
        addressForm.classList.add('show');
    }
}

// Personal Info Section
function initializePersonalInfo() {
    const editProfileBtn = document.querySelector('[data-action="edit-profile"]');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', function(e) {
            e.preventDefault();
            toggleProfileEdit();
        });
    }

    // Profile image upload
    const profileImageInput = document.getElementById('profileImageInput');
    if (profileImageInput) {
        profileImageInput.addEventListener('change', handleProfileImageUpload);
    }
}

function toggleProfileEdit() {
    const profileFields = document.querySelectorAll('.profile-field');
    const editBtn = document.querySelector('[data-action="edit-profile"]');

    profileFields.forEach(field => {
        const input = field.querySelector('input');
        if (input) {
            input.disabled = !input.disabled;
        }
    });

    if (editBtn.textContent === 'Edit Profile') {
        editBtn.textContent = 'Save Changes';
        editBtn.classList.add('saving');
    } else {
        saveProfileChanges();
        editBtn.textContent = 'Edit Profile';
        editBtn.classList.remove('saving');
    }
}

function handleProfileImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const formData = new FormData();
        formData.append('profile_image', file);

        fetch('/update-profile-image/', {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Update profile image preview
                const profileImage = document.querySelector('.profile-image img');
                if (profileImage) {
                    profileImage.src = data.image_url;
                }
                showNotification('Profile image updated successfully', 'success');
            } else {
                showNotification('Failed to update profile image', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('An error occurred while updating profile image', 'error');
        });
    }
}

function saveProfileChanges() {
    const formData = new FormData();
    const profileFields = document.querySelectorAll('.profile-field input');

    profileFields.forEach(input => {
        formData.append(input.name, input.value);
    });

    fetch('/update-profile/', {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': getCookie('csrftoken')
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Profile updated successfully', 'success');
        } else {
            showNotification('Failed to update profile', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('An error occurred while updating profile', 'error');
    });
}

// Address Management
function initializeAddressManagement() {
    // Add new address form submission
    const addressForm = document.getElementById('addressForm');
    if (addressForm) {
        addressForm.addEventListener('submit', handleAddressSubmit);
    }

    // Delete address buttons
    const deleteButtons = document.querySelectorAll('[data-action="delete-address"]');
    deleteButtons.forEach(button => {
        button.addEventListener('click', handleDeleteAddress);
    });

    // Edit address buttons
    const editButtons = document.querySelectorAll('[data-action="edit-address"]');
    editButtons.forEach(button => {
        button.addEventListener('click', handleEditAddress);
    });
}

function handleAddressSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);

    fetch('/add-address/', {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': getCookie('csrftoken')
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Address added successfully', 'success');
            // Refresh address list
            location.reload();
        } else {
            showNotification('Failed to add address', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('An error occurred while adding address', 'error');
    });
}

function handleDeleteAddress(e) {
    e.preventDefault();
    const addressId = this.getAttribute('data-address-id');

    if (confirm('Are you sure you want to delete this address?')) {
        fetch(`/delete-address/${addressId}/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('Address deleted successfully', 'success');
                // Remove address from DOM
                const addressCard = this.closest('.address-card');
                if (addressCard) {
                    addressCard.remove();
                }
            } else {
                showNotification('Failed to delete address', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('An error occurred while deleting address', 'error');
        });
    }
}

function handleEditAddress(e) {
    e.preventDefault();
    const addressId = this.getAttribute('data-address-id');
    
    // Fetch address details
    fetch(`/address/${addressId}/`, {
        headers: {
            'Accept': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            populateAddressForm(data.address);
            showAddressForm();
        } else {
            showNotification('Failed to load address details', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('An error occurred while loading address details', 'error');
    });
}

// Utility Functions
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const messageSpan = document.getElementById('notification-message');
    
    if (notification && messageSpan) {
        notification.className = `notification ${type}`;
        messageSpan.textContent = message;
        notification.style.display = 'flex';
        
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }
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

// Recent Activity Section
function initializeRecentActivity() {
    const activityItems = document.querySelectorAll('.activity-item');
    if (activityItems.length === 0) return;

    // Add animation to activity items
    activityItems.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateX(-20px)';
        item.style.transition = `all 0.5s ease-out ${index * 0.1}s`;
        
        // Create an intersection observer for each item
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    item.style.opacity = '1';
                    item.style.transform = 'translateX(0)';
                    observer.unobserve(item);
                }
            });
        }, {
            threshold: 0.1
        });
        
        observer.observe(item);
    });

    // Initialize activity item interactions
    activityItems.forEach(item => {
        item.addEventListener('click', function() {
            const activityId = this.getAttribute('data-activity-id');
            if (activityId) {
                showActivityDetails(activityId);
            }
        });
    });
}

function showActivityDetails(activityId) {
    // Implement activity details view logic here
    console.log(`Showing details for activity ${activityId}`);
} 