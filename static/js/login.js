document.addEventListener('DOMContentLoaded', function() {
    const signUpButton = document.getElementById('signUp');
    const signInButton = document.getElementById('signIn');
    const container = document.getElementById('container');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    // Panel switching
    signUpButton.addEventListener('click', () => {
        container.classList.add('right-panel-active');
    });

    signInButton.addEventListener('click', () => {
        container.classList.remove('right-panel-active');
    });

    // Form validation
    function validateForm(form) {
        let isValid = true;
        const inputs = form.querySelectorAll('input[required]');
        
        inputs.forEach(input => {
            const value = input.value.trim();
            
            if (!value) {
                markInvalid(input, 'This field is required');
                isValid = false;
            } else if (input.type === 'email' && !isValidEmail(value)) {
                markInvalid(input, 'Please enter a valid email');
                isValid = false;
            } else if (input.type === 'password' && value.length < 8) {
                markInvalid(input, 'Password must be at least 8 characters');
                isValid = false;
            } else {
                markValid(input);
            }
        });
        
        return isValid;
    }

    // Email validation
    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    // Mark input as invalid
    function markInvalid(input, message) {
        input.classList.add('error');
        input.style.borderColor = '#dc3545';
        
        let errorMessage = input.nextElementSibling;
        if (!errorMessage || !errorMessage.classList.contains('error-message')) {
            errorMessage = document.createElement('small');
            errorMessage.classList.add('error-message');
            errorMessage.style.color = '#dc3545';
            input.parentNode.insertBefore(errorMessage, input.nextSibling);
        }
        errorMessage.textContent = message;
    }

    // Mark input as valid
    function markValid(input) {
        input.classList.remove('error');
        input.style.borderColor = '';
        
        const errorMessage = input.nextElementSibling;
        if (errorMessage && errorMessage.classList.contains('error-message')) {
            errorMessage.remove();
        }
    }

    // Form submission handlers
    loginForm.addEventListener('submit', function(e) {
        if (!validateForm(this)) {
            e.preventDefault();
        }
    });

    signupForm.addEventListener('submit', function(e) {
        if (!validateForm(this)) {
            e.preventDefault();
        }
    });

    // Auto-hide alerts
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        setTimeout(() => {
            alert.style.opacity = '0';
            setTimeout(() => alert.remove(), 500);
        }, 5000);
    });

    // Add animation to social icons
    const socialIcons = document.querySelectorAll('.social-container a');
    socialIcons.forEach(icon => {
        icon.addEventListener('mouseenter', () => {
            icon.style.transform = 'translateY(-3px)';
        });
        icon.addEventListener('mouseleave', () => {
            icon.style.transform = 'translateY(0)';
        });
    });

    // Add focus effects to inputs
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            input.parentElement.classList.add('focused');
        });
        input.addEventListener('blur', () => {
            input.parentElement.classList.remove('focused');
        });
    });
});