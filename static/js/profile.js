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

    // Profile icon click handler
    const profileIcon = document.querySelector('.nav-icon.profile-icon');
    if (profileIcon) {
        profileIcon.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = '/profile/';
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

    // Tab switching functionality
    const tabLinks = document.querySelectorAll('.profile-nav li[data-tab]');
    const tabContents = document.querySelectorAll('.profile-tab');

    if (tabLinks.length > 0 && tabContents.length > 0) {
        tabLinks.forEach(link => {
            link.addEventListener('click', function() {
                const tabId = this.getAttribute('data-tab');
                
                // Remove active class from all tabs and links
                tabLinks.forEach(l => l.classList.remove('active'));
                tabContents.forEach(t => t.classList.remove('active'));
                
                // Add active class to current tab and link
                this.classList.add('active');
                const tabContent = document.getElementById(tabId);
                if (tabContent) {
                    tabContent.classList.add('active');
                }
            });
        });
    }

    // Profile image upload
    const imageUpload = document.getElementById('profile-image-upload');
    const profileAvatar = document.querySelector('.profile-avatar');

    if (imageUpload && profileAvatar) {
        imageUpload.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                // Create a preview of the image
                const reader = new FileReader();
                reader.onload = function(event) {
                    // Remove the icon if it exists
                    const icon = profileAvatar.querySelector('i');
                    if (icon) {
                        icon.remove();
                    }
                    
                    // Check if an image already exists
                    let img = profileAvatar.querySelector('img');
                    if (!img) {
                        img = document.createElement('img');
                        img.className = 'profile-image';
                        profileAvatar.appendChild(img);
                    }
                    
                    img.src = event.target.result;
                    img.style.width = '100%';
                    img.style.height = '100%';
                    img.style.objectFit = 'cover';
                };
                reader.readAsDataURL(file);
                
                // Upload the image to the server
                const formData = new FormData();
                formData.append('profile_image', file);

                fetch('/profile/update-image/', {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': getCookie('csrftoken')
                    },
                    body: formData
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        showAlert('Profile image updated successfully!', 'success');
                    } else {
                        throw new Error(data.message || 'Error updating profile image');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    showAlert('Error uploading image: ' + error.message, 'error');
                });
            }
        });
    }

    // Profile form submission
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = {
                first_name: document.getElementById('first_name').value,
                last_name: document.getElementById('last_name').value,
                phone: document.getElementById('phone').value,
                address: document.getElementById('address').value,
                city: document.getElementById('city').value,
                state: document.getElementById('state').value,
                pincode: document.getElementById('pincode').value
            };
            
            fetch('/profile/update/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify(formData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    // Update the profile name in the sidebar
                    const profileName = document.querySelector('.profile-user-info h3');
                    if (profileName) {
                        profileName.textContent = `${formData.first_name} ${formData.last_name}`.trim();
                    }
                    
                    showAlert('Profile updated successfully!', 'success');
                } else {
                    throw new Error(data.message);
                }
            })
            .catch(error => {
                showAlert('Error updating profile: ' + error.message, 'error');
            });
        });
    }

    // Password form submission
    const passwordForm = document.getElementById('password-form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const currentPassword = document.getElementById('current_password').value;
            const newPassword = document.getElementById('new_password').value;
            const confirmPassword = document.getElementById('confirm_password').value;
            
            // Validate passwords
            if (newPassword !== confirmPassword) {
                showAlert('New passwords do not match', 'error');
                return;
            }
            
            if (newPassword.length < 8) {
                showAlert('Password must be at least 8 characters long', 'error');
                return;
            }
            
            const formData = {
                current_password: currentPassword,
                new_password: newPassword
            };
            
            fetch('/profile/change-password/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify(formData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showAlert('Password updated successfully!', 'success');
                    passwordForm.reset();
                } else {
                    throw new Error(data.message || 'Error updating password');
                }
            })
            .catch(error => {
                showAlert('Error updating password: ' + error.message, 'error');
            });
        });
    }

    // Address management
    const addAddressBtn = document.getElementById('add-address-btn');
    const cancelAddressBtn = document.getElementById('cancel-address-btn');
    const addressFormContainer = document.querySelector('.address-form-container');
    const addressForm = document.getElementById('address-form');
    let isEditing = false;
    let currentAddressId = null;
    
    if (addAddressBtn && addressFormContainer) {
        addAddressBtn.addEventListener('click', function() {
            // Reset form and show for adding new address
            if (addressForm) {
                addressForm.reset();
                addressForm.dataset.addressId = '';
                isEditing = false;
                currentAddressId = null;
                
                // Update form title
                const formTitle = addressFormContainer.querySelector('h3');
                if (formTitle) {
                    formTitle.innerHTML = '<i class="fas fa-plus-circle"></i> Add New Address';
                }
            }
            showAddressForm();
        });
    }
    
    if (cancelAddressBtn && addressFormContainer && addAddressBtn) {
        cancelAddressBtn.addEventListener('click', function() {
            hideAddressForm();
        });
    }

    function showAddressForm() {
        addressFormContainer.style.display = 'block';
        addAddressBtn.style.display = 'none';
        addressFormContainer.scrollIntoView({ behavior: 'smooth' });
    }

    function hideAddressForm() {
        addressFormContainer.style.display = 'none';
        addAddressBtn.style.display = 'block';
        if (addressForm) {
            addressForm.reset();
            isEditing = false;
            currentAddressId = null;
            addressForm.dataset.addressId = '';
            // Reset form title
            const formTitle = addressFormContainer.querySelector('h3');
            if (formTitle) {
                formTitle.innerHTML = '<i class="fas fa-plus-circle"></i> Add New Address';
            }
        }
    }
    
    if (addressForm) {
        addressForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = {
                type: document.getElementById('address_type').value,
                full_name: document.getElementById('full_name').value,
                phone_number: document.getElementById('phone_number').value,
                street_address: document.getElementById('address').value,
                city: document.getElementById('city').value,
                state: document.getElementById('state').value,
                postal_code: document.getElementById('pincode').value,
                country: 'India'
            };

            // Validate form data
            if (!validateAddressForm(formData)) {
                return;
            }

            // Show loading state
            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            submitBtn.disabled = true;

            // Get the address ID if we're editing
            const addressId = e.target.dataset.addressId;
            
            // Determine if this is an edit or new address
            const url = addressId ? `/api/addresses/${addressId}/` : '/api/addresses/';
            const method = addressId ? 'PUT' : 'POST';

            // Send request
            fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify(formData)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to save address');
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    showAlert(`Address ${addressId ? 'updated' : 'added'} successfully`, 'success');
                    hideAddressForm();
                    
                    // Refresh the page to show the updated address list
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                } else {
                    throw new Error(data.message || 'Failed to save address');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showAlert(error.message, 'error');
            })
            .finally(() => {
                // Reset button state
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            });
        });
    }

    function validateAddressForm(formData) {
        if (!formData.full_name.trim()) {
            showAlert('Please enter full name', 'error');
            return false;
        }
        if (!formData.phone_number.trim() || !/^\d{10}$/.test(formData.phone_number)) {
            showAlert('Please enter a valid 10-digit phone number', 'error');
            return false;
        }
        if (!formData.street_address.trim()) {
            showAlert('Please enter address', 'error');
            return false;
        }
        if (!formData.city.trim()) {
            showAlert('Please enter city', 'error');
            return false;
        }
        if (!formData.state.trim()) {
            showAlert('Please enter state', 'error');
            return false;
        }
        if (!formData.postal_code.trim() || !/^\d{6}$/.test(formData.postal_code)) {
            showAlert('Please enter a valid 6-digit postal code', 'error');
            return false;
        }
        return true;
    }

    // Edit address functionality
    window.editAddress = function(addressId) {
        // Show loading state
        const button = event.target.closest('.edit-btn');
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        button.disabled = true;

        // Show the address form container
        const addressFormContainer = document.querySelector('.address-form-container');
        const addAddressBtn = document.getElementById('add-address-btn');
        
        // Update form title for editing
        const formTitle = addressFormContainer.querySelector('h3');
        formTitle.innerHTML = '<i class="fas fa-edit"></i> Edit Address';

        // Set editing state
        isEditing = true;
        currentAddressId = addressId;

        // Fetch address details
        fetch(`/api/addresses/${addressId}/`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch address details');
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    // Fill form with address data
                    const address = data.address;
                    document.getElementById('address_type').value = address.type;
                    document.getElementById('full_name').value = address.full_name;
                    document.getElementById('phone_number').value = address.phone_number;
                    document.getElementById('address').value = address.street_address;
                    document.getElementById('city').value = address.city;
                    document.getElementById('state').value = address.state;
                    document.getElementById('pincode').value = address.postal_code;
                    
                    // Store the address ID in a data attribute
                    const addressForm = document.getElementById('address-form');
                    addressForm.dataset.addressId = addressId;
                    
                    // Show form container and hide add button
                    addressFormContainer.style.display = 'block';
                    if (addAddressBtn) addAddressBtn.style.display = 'none';
                    
                    // Scroll to form
                    addressFormContainer.scrollIntoView({ behavior: 'smooth' });
                } else {
                    throw new Error(data.message || 'Failed to fetch address details');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showAlert(error.message, 'error');
            })
            .finally(() => {
                // Reset button state
                button.innerHTML = '<i class="fas fa-edit"></i> Edit';
                button.disabled = false;
            });
    };

    // Delete address functionality
    window.deleteAddress = function(addressId) {
        // Show confirmation dialog
        const confirmed = confirm('Are you sure you want to delete this address?');
        
        if (confirmed) {
            // Show loading state
            const button = event.target.closest('.delete-btn');
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
            button.disabled = true;

            // Send delete request
            fetch(`/api/addresses/${addressId}/`, {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken'),
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to delete address');
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    // Remove address card from DOM with animation
                    const addressCard = button.closest('.address-card');
                    addressCard.style.opacity = '0';
                    addressCard.style.transform = 'translateY(20px)';
                    setTimeout(() => {
                        addressCard.remove();
                        showAlert('Address deleted successfully', 'success');
                    }, 300);
                } else {
                    throw new Error(data.message || 'Failed to delete address');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showAlert(error.message, 'error');
                
                // Reset button state
                button.innerHTML = '<i class="fas fa-trash-alt"></i> Delete';
                button.disabled = false;
            });
        }
    };

    // Prescription upload
    const uploadPrescriptionBtn = document.querySelector('.btn-upload-prescription');
    
    if (uploadPrescriptionBtn) {
        uploadPrescriptionBtn.addEventListener('click', function() {
            // Create a file input element
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*,.pdf';
            fileInput.style.display = 'none';
            document.body.appendChild(fileInput);
            
            // Trigger click on the file input
            fileInput.click();
            
            // Handle file selection
            fileInput.addEventListener('change', function() {
                const file = this.files[0];
                if (file) {
                    const formData = new FormData();
                    formData.append('prescription', file);
                    
                    fetch('/upload-prescription/', {
                        method: 'POST',
                        headers: {
                            'X-CSRFToken': getCookie('csrftoken'),
                        },
                        body: formData
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            showAlert('Prescription uploaded successfully!', 'success');
                            setTimeout(() => {
                                window.location.reload();
                            }, 1500);
                        } else {
                            showAlert('Error uploading prescription', 'error');
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        showAlert('Error uploading prescription', 'error');
                    });
                }
                
                // Remove the file input from the DOM
                document.body.removeChild(fileInput);
            });
        });
    }

    // Delete account functionality
    const deleteAccountBtn = document.getElementById('delete-account-btn');
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                fetch('/profile/delete-account/', {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': getCookie('csrftoken')
                    }
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        showAlert('Account deleted successfully!', 'success');
                        setTimeout(() => {
                            window.location.href = '/';
                        }, 1500);
                    } else {
                        throw new Error(data.message || 'Error deleting account');
                    }
                })
                .catch(error => {
                    showAlert('Error deleting account: ' + error.message, 'error');
                });
            }
        });
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

    // Helper function to show alerts
    let alertContainer;
    let currentAlert;

    function showAlert(message, type = 'success') {
        // Remove existing alert if any
        if (currentAlert) {
            removeAlert(currentAlert);
        }

        // Create container if it doesn't exist
        if (!alertContainer) {
            alertContainer = document.createElement('div');
            alertContainer.className = 'alert-container';
            document.body.appendChild(alertContainer);
        }

        // Create new alert
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.innerHTML = `
            <span class="message">${message}</span>
            <button type="button" class="btn-close" onclick="removeAlert(this.parentElement)">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Store current alert reference
        currentAlert = alertDiv;

        // Add to container
        alertContainer.appendChild(alertDiv);

        // Trigger animation
        setTimeout(() => alertDiv.classList.add('show'), 10);

        // Auto remove after 3 seconds
        setTimeout(() => {
            if (alertDiv && alertContainer.contains(alertDiv)) {
                removeAlert(alertDiv);
            }
        }, 3000);
    }

    // Helper function to remove alerts with animation
    function removeAlert(alertElement) {
        alertElement.classList.add('hide');
        setTimeout(() => {
            if (alertElement && alertContainer.contains(alertElement)) {
                alertContainer.removeChild(alertElement);
            }
            // Remove container if empty
            if (alertContainer && alertContainer.children.length === 0) {
                document.body.removeChild(alertContainer);
                alertContainer = null;
            }
        }, 500);
    }

    // Make removeAlert available globally
    window.removeAlert = removeAlert;
});

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
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
