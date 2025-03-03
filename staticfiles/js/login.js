document.addEventListener('DOMContentLoaded', function() {
    const signUpButton = document.getElementById('signUp');
    const signInButton = document.getElementById('signIn');
    const container = document.getElementById('container');

    // Panel switching
    signUpButton.addEventListener('click', () => {
        container.classList.add('right-panel-active');
    });

    signInButton.addEventListener('click', () => {
        container.classList.remove('right-panel-active');
    });

    // Form validation
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
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
            
            if (!isValid) {
                e.preventDefault();
            }
        });
    });

    // Auto-hide alerts
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        setTimeout(() => {
            alert.style.opacity = '0';
            setTimeout(() => alert.remove(), 500);
        }, 5000);
    });
});

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

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

function markValid(input) {
    input.classList.remove('error');
    input.style.borderColor = '';
    
    const errorMessage = input.nextElementSibling;
    if (errorMessage && errorMessage.classList.contains('error-message')) {
        errorMessage.remove();
    }
}