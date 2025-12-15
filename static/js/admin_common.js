/**
 * Common admin panel JavaScript functions
 */

// Admin logout with confirmation
function logoutAdmin() {
    if (confirm('Are you sure you want to logout?')) {
        // Create a form dynamically
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = document.querySelector('[data-logout-url]')?.dataset.logoutUrl || '/admin-panel/logout/';
        
        // Add CSRF token
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value ||
                         getCookie('csrftoken');
        if (csrfToken) {
            const csrfInput = document.createElement('input');
            csrfInput.type = 'hidden';
            csrfInput.name = 'csrfmiddlewaretoken';
            csrfInput.value = csrfToken;
            form.appendChild(csrfInput);
        }
        
        document.body.appendChild(form);
        form.submit();
    }
}

// Get cookie value by name
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

// Confirm delete action
function confirmDelete(message) {
    return confirm(message || 'Are you sure you want to delete this item? This action cannot be undone.');
}

// Show loading spinner on form submit
function showLoadingOnSubmit(formId) {
    const form = document.getElementById(formId);
    if (form) {
        form.addEventListener('submit', function() {
            const submitBtn = form.querySelector('[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            }
        });
    }
}

// Initialize tooltips (if using Bootstrap)
document.addEventListener('DOMContentLoaded', function() {
    // Initialize any tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Add confirmation to all delete buttons/links
    const deleteElements = document.querySelectorAll('[data-confirm-delete]');
    deleteElements.forEach(function(element) {
        element.addEventListener('click', function(e) {
            const message = element.dataset.confirmDelete || 'Are you sure you want to delete this item?';
            if (!confirm(message)) {
                e.preventDefault();
                return false;
            }
        });
    });
});
