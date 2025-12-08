// Login and Registration Module
(function() {
    'use strict';

    // Utility Functions
    const Utils = {
        getCookie(name) {
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
        },

        showMessage(message, type = 'info') {
            const messageDiv = document.createElement('div');
            messageDiv.className = `alert alert-${type}`;
            messageDiv.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                min-width: 300px;
                padding: 15px 20px;
                border-radius: 8px;
                background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1'};
                border: 1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#bee5eb'};
                color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460'};
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                animation: slideIn 0.3s ease-out;
            `;
            messageDiv.textContent = message;
            document.body.appendChild(messageDiv);

            setTimeout(() => {
                messageDiv.style.animation = 'slideOut 0.3s ease-out';
                setTimeout(() => messageDiv.remove(), 300);
            }, 4000);
        },

        validateEmail(email) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        },

        validatePassword(password) {
            if (password.length < 8) {
                return { valid: false, message: 'Password must be at least 8 characters' };
            }
            if (!/[a-z]/.test(password)) {
                return { valid: false, message: 'Password must contain lowercase letters' };
            }
            if (!/[A-Z]/.test(password)) {
                return { valid: false, message: 'Password must contain uppercase letters' };
            }
            if (!/[0-9]/.test(password)) {
                return { valid: false, message: 'Password must contain numbers' };
            }
            return { valid: true };
        },

        validateName(name) {
            const trimmed = name.trim();
            if (trimmed.length < 2) {
                return { valid: false, message: 'Name must be at least 2 characters' };
            }
            if (!/^[A-Za-z\s]+$/.test(trimmed)) {
                return { valid: false, message: 'Name can only contain letters and spaces' };
            }
            return { valid: true };
        }
    };

    // API Handler
    const API = {
        async makeRequest(action, data) {
            try {
                const response = await fetch(window.location.pathname, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': Utils.getCookie('csrftoken'),
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({ action, ...data })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                return await response.json();
            } catch (error) {
                console.error('API Request Error:', error);
                throw error;
            }
        }
    };

    // Registration Handler
    const Registration = {
        currentEmail: '',

        async handleSignup(formData) {
            // Validate name
            const name = formData.get('name').trim();
            const nameValidation = Utils.validateName(name);
            if (!nameValidation.valid) {
                Utils.showMessage(nameValidation.message, 'error');
                return false;
            }

            // Validate email
            const email = formData.get('email').toLowerCase().trim();
            if (!Utils.validateEmail(email)) {
                Utils.showMessage('Please enter a valid email address', 'error');
                return false;
            }

            // Validate password
            const password = formData.get('password');
            const passwordValidation = Utils.validatePassword(password);
            if (!passwordValidation.valid) {
                Utils.showMessage(passwordValidation.message, 'error');
                return false;
            }

            // Confirm password match
            const confirmPassword = formData.get('confirm_password');
            if (password !== confirmPassword) {
                Utils.showMessage('Passwords do not match', 'error');
                return false;
            }

            this.currentEmail = email;

            try {
                const button = document.querySelector('#signupForm button[type="submit"]');
                button.disabled = true;
                button.textContent = 'Sending OTP...';

                const result = await API.makeRequest('register', {
                    name,
                    email,
                    password
                });

                button.disabled = false;
                button.textContent = 'SIGN UP';

                if (result.success) {
                    Utils.showMessage('OTP sent to your email!', 'success');
                    this.showOTPForm();
                } else {
                    Utils.showMessage(result.message || 'Registration failed', 'error');
                }
            } catch (error) {
                Utils.showMessage('Network error. Please try again.', 'error');
            }

            return false;
        },

        showOTPForm() {
            document.getElementById('registration-step-1').style.display = 'none';
            document.getElementById('registration-step-2').style.display = 'block';
            
            // Focus first OTP input
            const firstInput = document.querySelector('.otp-input');
            if (firstInput) firstInput.focus();
        },

        async verifyOTP() {
            const otpInputs = document.querySelectorAll('.otp-input');
            const otp = Array.from(otpInputs).map(input => input.value).join('');

            if (otp.length !== 4) {
                Utils.showMessage('Please enter complete 4-digit OTP', 'error');
                return;
            }

            try {
                const button = document.querySelector('#registration-step-2 .sign-button:not(.resend)');
                button.disabled = true;
                button.textContent = 'Verifying...';

                const result = await API.makeRequest('verify_otp', {
                    email: this.currentEmail,
                    otp
                });

                button.disabled = false;
                button.textContent = 'Verify OTP';

                if (result.success) {
                    Utils.showMessage(result.message || 'Registration successful!', 'success');
                    setTimeout(() => {
                        window.location.href = result.redirect_url || '/';
                    }, 1000);
                } else {
                    Utils.showMessage(result.message || 'Invalid OTP', 'error');
                    otpInputs.forEach(input => input.value = '');
                    otpInputs[0].focus();
                }
            } catch (error) {
                Utils.showMessage('Verification failed. Please try again.', 'error');
            }
        },

        async resendOTP() {
            if (!this.currentEmail) {
                Utils.showMessage('Please complete registration first', 'error');
                return;
            }

            try {
                const button = document.querySelector('.resend');
                button.disabled = true;
                button.textContent = 'Sending...';

                const nameInput = document.querySelector('input[name="name"]');
                const passwordInput = document.querySelector('#password');

                const result = await API.makeRequest('register', {
                    name: nameInput.value.trim(),
                    email: this.currentEmail,
                    password: passwordInput.value
                });

                button.disabled = false;
                button.textContent = 'Resend OTP';

                if (result.success) {
                    Utils.showMessage('OTP resent successfully!', 'success');
                    document.querySelectorAll('.otp-input').forEach(input => input.value = '');
                    document.querySelectorAll('.otp-input')[0].focus();
                } else {
                    Utils.showMessage(result.message || 'Failed to resend OTP', 'error');
                }
            } catch (error) {
                Utils.showMessage('Failed to resend OTP', 'error');
            }
        }
    };

    // Login Handler
    const Login = {
        currentEmail: '',

        async handleLogin(formData) {
            const email = formData.get('email').toLowerCase().trim();
            const password = formData.get('password');

            if (!Utils.validateEmail(email)) {
                Utils.showMessage('Please enter a valid email', 'error');
                return false;
            }

            if (!password) {
                Utils.showMessage('Please enter your password', 'error');
                return false;
            }

            this.currentEmail = email;

            try {
                const button = document.querySelector('#loginForm button[type="submit"]');
                button.disabled = true;
                button.textContent = 'Signing In...';

                const result = await API.makeRequest('login', {
                    email,
                    password
                });

                button.disabled = false;
                button.textContent = 'SIGN IN';

                if (result.success && result.otp_required) {
                    Utils.showMessage(result.message || 'OTP sent to your email!', 'success');
                    this.showOTPForm();
                } else if (result.success) {
                    Utils.showMessage('Login successful!', 'success');
                    setTimeout(() => {
                        window.location.href = result.redirect_url || '/';
                    }, 500);
                } else {
                    Utils.showMessage(result.message || 'Invalid credentials', 'error');
                }
            } catch (error) {
                Utils.showMessage('Login failed. Please try again.', 'error');
            }

            return false;
        },

        showOTPForm() {
            document.getElementById('login-step-1').style.display = 'none';
            document.getElementById('login-step-2').style.display = 'block';
            
            // Focus first OTP input
            const firstInput = document.querySelector('.otp-input-login');
            if (firstInput) firstInput.focus();
        },

        async verifyOTP() {
            const otpInputs = document.querySelectorAll('.otp-input-login');
            const otp = Array.from(otpInputs).map(input => input.value).join('');

            if (otp.length !== 4) {
                Utils.showMessage('Please enter complete 4-digit OTP', 'error');
                return;
            }

            try {
                const button = document.querySelector('#login-step-2 .sign-button:not(.resend):not(.back-to-login)');
                button.disabled = true;
                button.textContent = 'Verifying...';

                const result = await API.makeRequest('verify_login_otp', {
                    otp
                });

                button.disabled = false;
                button.textContent = 'Verify OTP';

                if (result.success) {
                    Utils.showMessage(result.message || 'Login successful!', 'success');
                    setTimeout(() => {
                        window.location.href = result.redirect_url || '/';
                    }, 1000);
                } else {
                    Utils.showMessage(result.message || 'Invalid OTP', 'error');
                    otpInputs.forEach(input => input.value = '');
                    otpInputs[0].focus();
                }
            } catch (error) {
                Utils.showMessage('Verification failed. Please try again.', 'error');
            }
        },

        async resendOTP() {
            try {
                const button = document.querySelector('#login-step-2 .resend');
                button.disabled = true;
                button.textContent = 'Sending...';

                const result = await API.makeRequest('resend_login_otp', {});

                button.disabled = false;
                button.textContent = 'Resend OTP';

                if (result.success) {
                    Utils.showMessage('OTP resent successfully!', 'success');
                    document.querySelectorAll('.otp-input-login').forEach(input => input.value = '');
                    document.querySelectorAll('.otp-input-login')[0].focus();
                } else {
                    Utils.showMessage(result.message || 'Failed to resend OTP', 'error');
                }
            } catch (error) {
                Utils.showMessage('Failed to resend OTP', 'error');
            }
        },

        backToLogin() {
            document.getElementById('login-step-1').style.display = 'block';
            document.getElementById('login-step-2').style.display = 'none';
            document.querySelectorAll('.otp-input-login').forEach(input => input.value = '');
        }
    };

    // OTP Input Handler
    const OTPHandler = {
        init() {
            // Handle registration OTP inputs
            document.querySelectorAll('.otp-input').forEach((input, index, inputs) => {
                input.addEventListener('input', function(e) {
                    // Only allow numbers
                    this.value = this.value.replace(/[^0-9]/g, '');
                    
                    if (this.value.length === 1 && index < inputs.length - 1) {
                        inputs[index + 1].focus();
                    }
                });

                input.addEventListener('keydown', function(e) {
                    if (e.key === 'Backspace' && !this.value && index > 0) {
                        inputs[index - 1].focus();
                    }
                });

                input.addEventListener('paste', function(e) {
                    e.preventDefault();
                    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 4);
                    inputs.forEach((inp, i) => {
                        inp.value = pastedData[i] || '';
                    });
                    if (pastedData.length === 4) {
                        inputs[3].focus();
                    }
                });
            });

            // Handle login OTP inputs
            document.querySelectorAll('.otp-input-login').forEach((input, index, inputs) => {
                input.addEventListener('input', function(e) {
                    // Only allow numbers
                    this.value = this.value.replace(/[^0-9]/g, '');
                    
                    if (this.value.length === 1 && index < inputs.length - 1) {
                        inputs[index + 1].focus();
                    }
                });

                input.addEventListener('keydown', function(e) {
                    if (e.key === 'Backspace' && !this.value && index > 0) {
                        inputs[index - 1].focus();
                    }
                });

                input.addEventListener('paste', function(e) {
                    e.preventDefault();
                    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 4);
                    inputs.forEach((inp, i) => {
                        inp.value = pastedData[i] || '';
                    });
                    if (pastedData.length === 4) {
                        inputs[3].focus();
                    }
                });
            });
        }
    };

    // Password Toggle
    window.togglePassword = function(inputId) {
        const input = document.getElementById(inputId);
        const icon = document.getElementById(inputId + '-eye');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    };

    // Global Functions
    window.handleSignup = function(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        return Registration.handleSignup(formData);
    };

    window.handleLogin = function(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        return Login.handleLogin(formData);
    };

    window.verifyOTP = function() {
        Registration.verifyOTP();
    };

    window.resendOTP = function() {
        Registration.resendOTP();
    };

    window.verifyLoginOTP = function() {
        Login.verifyOTP();
    };

    window.resendLoginOTP = function() {
        Login.resendOTP();
    };

    window.backToLogin = function() {
        Login.backToLogin();
    };

    // Initialize
    document.addEventListener('DOMContentLoaded', function() {
        const signUpButton = document.getElementById('signUp');
        const signInButton = document.getElementById('signIn');
        const container = document.getElementById('container');

        if (signUpButton) {
            signUpButton.addEventListener('click', () => {
                container.classList.add('right-panel-active');
            });
        }

        if (signInButton) {
            signInButton.addEventListener('click', () => {
                container.classList.remove('right-panel-active');
                // Reset registration form
                document.getElementById('registration-step-1').style.display = 'block';
                document.getElementById('registration-step-2').style.display = 'none';
                // Reset login form
                const loginStep1 = document.getElementById('login-step-1');
                const loginStep2 = document.getElementById('login-step-2');
                if (loginStep1) loginStep1.style.display = 'block';
                if (loginStep2) loginStep2.style.display = 'none';
                // Clear login OTP inputs
                document.querySelectorAll('.otp-input-login').forEach(input => input.value = '');
            });
        }

        // Initialize OTP handlers
        OTPHandler.init();

        // Password match indicator
        const confirmPassword = document.getElementById('confirm_password');
        const password = document.getElementById('password');
        const matchMessage = document.getElementById('password-match-message');

        if (confirmPassword && password && matchMessage) {
            confirmPassword.addEventListener('input', function() {
                if (this.value) {
                    if (this.value === password.value) {
                        matchMessage.textContent = '✓ Passwords match';
                        matchMessage.style.color = '#28a745';
                    } else {
                        matchMessage.textContent = '✗ Passwords do not match';
                        matchMessage.style.color = '#dc3545';
                    }
                } else {
                    matchMessage.textContent = '';
                }
            });
        }

        // Auto-hide Django messages
        const messages = document.querySelectorAll('.messages .alert');
        messages.forEach(msg => {
            setTimeout(() => {
                msg.style.transition = 'opacity 0.5s';
                msg.style.opacity = '0';
                setTimeout(() => msg.remove(), 500);
            }, 5000);
        });

        // Add CSS animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(400px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(400px); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    });
})();