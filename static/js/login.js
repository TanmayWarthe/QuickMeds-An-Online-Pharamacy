const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const container = document.getElementById('container');
<<<<<<< HEAD
=======
const signupForm = document.getElementById('signupForm');
const loginForm = document.getElementById('loginForm');
>>>>>>> 68537b2ae03045ff6750901c72bbe5eabb416815

// Check URL parameters when page loads
window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('signup') === 'true') {
        container.classList.add('right-panel-active');
    }
});

signUpButton.addEventListener('click', () => {
    container.classList.add('right-panel-active');
});

signInButton.addEventListener('click', () => {
    container.classList.remove('right-panel-active');
<<<<<<< HEAD
=======
});

// Form validation functions
function validateEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
}

function validatePassword(password) {
    return password.length >= 8;
}

function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

function hideError(elementId) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

// Sign up form validation
if (signupForm) {
    signupForm.addEventListener('submit', function(e) {
        let isValid = true;
        const name = document.querySelector('#signupForm input[name="name"]').value;
        const email = document.querySelector('#signupForm input[name="email"]').value;
        const password = document.querySelector('#signupForm input[name="password"]').value;

        // Validate name
        if (!name || name.length < 2) {
            showError('nameError', 'Please enter your name (minimum 2 characters)');
            isValid = false;
        } else {
            hideError('nameError');
        }

        // Validate email
        if (!validateEmail(email)) {
            showError('emailError', 'Please enter a valid email address');
            isValid = false;
        } else {
            hideError('emailError');
        }

        // Validate password
        if (!validatePassword(password)) {
            showError('passwordError', 'Password must be at least 8 characters long');
            isValid = false;
        } else {
            hideError('passwordError');
        }

        if (!isValid) {
            e.preventDefault();
        }
    });

    // Clear errors on input
    signupForm.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', () => {
            const errorId = input.name + 'Error';
            hideError(errorId);
        });
    });
}

// Login form validation
if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        let isValid = true;
        const email = document.querySelector('#loginForm input[name="email"]').value;
        const password = document.querySelector('#loginForm input[name="password"]').value;

        // Validate email
        if (!validateEmail(email)) {
            showError('loginEmailError', 'Please enter a valid email address');
            isValid = false;
        } else {
            hideError('loginEmailError');
        }

        // Validate password
        if (!password) {
            showError('loginPasswordError', 'Please enter your password');
            isValid = false;
        } else {
            hideError('loginPasswordError');
        }

        if (!isValid) {
            e.preventDefault();
        }
    });

    // Clear errors on input
    loginForm.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', () => {
            const errorId = 'login' + input.name.charAt(0).toUpperCase() + input.name.slice(1) + 'Error';
            hideError(errorId);
        });
    });
}

// Auto-hide alerts after 5 seconds
document.addEventListener('DOMContentLoaded', () => {
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        setTimeout(() => {
            alert.style.opacity = '0';
            setTimeout(() => alert.remove(), 500);
        }, 5000);
    });
>>>>>>> 68537b2ae03045ff6750901c72bbe5eabb416815
}); 