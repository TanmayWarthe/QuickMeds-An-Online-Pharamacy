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
                const response = await fetch('/login/', {
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
                    Utils.showMessage(result.message || 'Registration successful!', 'success');
                    // Close modal and redirect
                    const authModal = bootstrap.Modal.getInstance(document.getElementById('authModal'));
                    if (authModal) authModal.hide();
                    
                    setTimeout(() => {
                        const redirectUrl = sessionStorage.getItem('authRedirectUrl') || result.redirect_url || '/';
                        sessionStorage.removeItem('authRedirectUrl');
                        window.location.href = redirectUrl;
                    }, 1000);
                } else {
                    Utils.showMessage(result.message || 'Registration failed', 'error');
                }
            } catch (error) {
                Utils.showMessage('Network error. Please try again.', 'error');
            }

            return false;
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
                    // Close modal and redirect to stored page or default
                    const authModal = bootstrap.Modal.getInstance(document.getElementById('authModal'));
                    if (authModal) authModal.hide();
                    
                    setTimeout(() => {
                        const redirectUrl = sessionStorage.getItem('authRedirectUrl') || result.redirect_url || '/';
                        sessionStorage.removeItem('authRedirectUrl');
                        window.location.href = redirectUrl;
                    }, 1000);
                } else {
                    Utils.showMessage(result.message || 'Invalid OTP', 'error');
                    // Add error visual feedback
                    otpInputs.forEach(input => {
                        input.value = '';
                        input.classList.remove('filled');
                        input.classList.add('error');
                    });
                    setTimeout(() => {
                        otpInputs.forEach(input => input.classList.remove('error'));
                        otpInputs[0].focus();
                    }, 500);
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

                if (result.success) {
                    Utils.showMessage(result.message || 'Login successful!', 'success');
                    // Close modal and redirect
                    const authModal = document.getElementById('authModal');
                    if (authModal) {
                        const modalInstance = bootstrap.Modal.getInstance(authModal);
                        if (modalInstance) modalInstance.hide();
                    }
                    
                    setTimeout(() => {
                        const redirectUrl = sessionStorage.getItem('authRedirectUrl') || result.redirect_url || '/';
                        sessionStorage.removeItem('authRedirectUrl');
                        window.location.href = redirectUrl;
                    }, 500);
                } else {
                    Utils.showMessage(result.message || 'Invalid credentials', 'error');
                }
            } catch (error) {
                Utils.showMessage('Login failed. Please try again.', 'error');
            }

            return false;
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
                    // Close modal and redirect to stored page or default
                    const authModal = document.getElementById('authModal');
                    if (authModal) {
                        const modalInstance = bootstrap.Modal.getInstance(authModal);
                        if (modalInstance) modalInstance.hide();
                    }
                    
                    setTimeout(() => {
                        const redirectUrl = sessionStorage.getItem('authRedirectUrl') || result.redirect_url || '/';
                        sessionStorage.removeItem('authRedirectUrl');
                        window.location.href = redirectUrl;
                    }, 1000);
                } else {
                    Utils.showMessage(result.message || 'Invalid OTP', 'error');
                    // Add error visual feedback
                    otpInputs.forEach(input => {
                        input.value = '';
                        input.classList.remove('filled');
                        input.classList.add('error');
                    });
                    setTimeout(() => {
                        otpInputs.forEach(input => input.classList.remove('error'));
                        otpInputs[0].focus();
                    }, 500);
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
                    
                    // Add visual feedback
                    if (this.value) {
                        this.classList.add('filled');
                    } else {
                        this.classList.remove('filled');
                    }
                    
                    if (this.value.length === 1 && index < inputs.length - 1) {
                        inputs[index + 1].focus();
                    }
                });

                input.addEventListener('keydown', function(e) {
                    if (e.key === 'Backspace') {
                        if (!this.value && index > 0) {
                            inputs[index - 1].focus();
                            inputs[index - 1].value = '';
                        } else {
                            this.value = '';
                        }
                        this.classList.remove('filled', 'error');
                    } else if (e.key === 'ArrowLeft' && index > 0) {
                        inputs[index - 1].focus();
                    } else if (e.key === 'ArrowRight' && index < inputs.length - 1) {
                        inputs[index + 1].focus();
                    }
                });

                input.addEventListener('paste', function(e) {
                    e.preventDefault();
                    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 4);
                    inputs.forEach((inp, i) => {
                        inp.value = pastedData[i] || '';
                        if (inp.value) {
                            inp.classList.add('filled');
                        }
                    });
                    if (pastedData.length === 4) {
                        inputs[3].focus();
                    } else if (pastedData.length > 0) {
                        inputs[Math.min(pastedData.length, inputs.length - 1)].focus();
                    }
                });
                
                // Focus effect
                input.addEventListener('focus', function() {
                    this.classList.remove('error');
                });
            });

            // Handle login OTP inputs
            document.querySelectorAll('.otp-input-login').forEach((input, index, inputs) => {
                input.addEventListener('input', function(e) {
                    // Only allow numbers
                    this.value = this.value.replace(/[^0-9]/g, '');
                    
                    // Add visual feedback
                    if (this.value) {
                        this.classList.add('filled');
                    } else {
                        this.classList.remove('filled');
                    }
                    
                    if (this.value.length === 1 && index < inputs.length - 1) {
                        inputs[index + 1].focus();
                    }
                });

                input.addEventListener('keydown', function(e) {
                    if (e.key === 'Backspace') {
                        if (!this.value && index > 0) {
                            inputs[index - 1].focus();
                            inputs[index - 1].value = '';
                        } else {
                            this.value = '';
                        }
                        this.classList.remove('filled', 'error');
                    } else if (e.key === 'ArrowLeft' && index > 0) {
                        inputs[index - 1].focus();
                    } else if (e.key === 'ArrowRight' && index < inputs.length - 1) {
                        inputs[index + 1].focus();
                    }
                });

                input.addEventListener('paste', function(e) {
                    e.preventDefault();
                    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 4);
                    inputs.forEach((inp, i) => {
                        inp.value = pastedData[i] || '';
                        if (inp.value) {
                            inp.classList.add('filled');
                        }
                    });
                    if (pastedData.length === 4) {
                        inputs[3].focus();
                    } else if (pastedData.length > 0) {
                        inputs[Math.min(pastedData.length, inputs.length - 1)].focus();
                    }
                });
                
                // Focus effect
                input.addEventListener('focus', function() {
                    this.classList.remove('error');
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

    window.showAdminLogin = function() {
        document.getElementById('signin-pane').style.display = 'none';
        document.getElementById('admin-pane').style.display = 'block';
        // Hide tabs when in admin mode
        document.querySelector('.auth-tabs').style.display = 'none';
    };

    window.showUserLogin = function() {
        document.getElementById('admin-pane').style.display = 'none';
        document.getElementById('signin-pane').style.display = 'block';
        // Show tabs again
        document.querySelector('.auth-tabs').style.display = 'flex';
    };

    // Initialize
    document.addEventListener('DOMContentLoaded', function() {
        // Modal tab switching
        const authTabs = document.querySelectorAll('.auth-tab');
        const tabPanes = document.querySelectorAll('.tab-pane');
        
        authTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const targetTab = this.dataset.tab;
                
                // Update active tab
                authTabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                
                // Show corresponding pane
                tabPanes.forEach(pane => {
                    if (pane.id === targetTab + '-pane') {
                        pane.style.display = 'block';
                        pane.classList.add('active');
                    } else {
                        pane.style.display = 'none';
                        pane.classList.remove('active');
                    }
                });
                
                resetForms();
            });
        });
        
        // Modal lifecycle management
        if (typeof bootstrap !== 'undefined') {
            const authModal = document.getElementById('authModal');
            if (authModal) {
                authModal.addEventListener('show.bs.modal', function(event) {
                    // Store current page URL for redirect after login
                    sessionStorage.setItem('authRedirectUrl', window.location.href);
                    
                    // Check if opened via signup button
                    const button = event.relatedTarget;
                    if (button && button.dataset.mode === 'signup') {
                        // Switch to signup tab
                        document.getElementById('tab-signup').click();
                    } else {
                        // Default to signin tab
                        document.getElementById('tab-signin').click();
                    }
                });
                
                // Reset forms when modal closes
                authModal.addEventListener('hidden.bs.modal', function() {
                    resetForms();
                });
            }
        }
        
        function resetForms() {
            // Reset registration form
            const regStep1 = document.getElementById('registration-step-1');
            const regStep2 = document.getElementById('registration-step-2');
            if (regStep1) regStep1.style.display = 'block';
            if (regStep2) regStep2.style.display = 'none';
            
            // Reset login form
            const loginStep1 = document.getElementById('login-step-1');
            const loginStep2 = document.getElementById('login-step-2');
            if (loginStep1) loginStep1.style.display = 'block';
            if (loginStep2) loginStep2.style.display = 'none';
            
            // Clear OTP inputs
            document.querySelectorAll('.otp-input, .otp-input-login').forEach(input => {
                input.value = '';
                input.classList.remove('filled', 'error');
            });
            
            // Clear form fields
            document.querySelectorAll('#signupForm input, #loginForm input').forEach(input => {
                if (input.type !== 'hidden') {
                    input.value = '';
                }
            });
            
            // Clear password match message
            const matchMessage = document.getElementById('password-match-message');
            if (matchMessage) matchMessage.textContent = '';
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
                        matchMessage.classList.remove('error');
                        matchMessage.classList.add('success');
                    } else {
                        matchMessage.textContent = '✗ Passwords do not match';
                        matchMessage.classList.remove('success');
                        matchMessage.classList.add('error');
                    }
                } else {
                    matchMessage.textContent = '';
                    matchMessage.classList.remove('success', 'error');
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
    });

    // OTP Modal Handler
    window.OTPModal = {
        currentEmail: '',
        currentAction: '', // 'signup' or 'login'
        
        show(email, action) {
            this.currentEmail = email;
            this.currentAction = action;
            
            // Update email in modal
            document.getElementById('otpEmail').textContent = email;
            
            // Clear previous OTP inputs
            document.querySelectorAll('#otpModal .otp-input').forEach(input => input.value = '');
            
            // Hide auth modal
            const authModal = bootstrap.Modal.getInstance(document.getElementById('authModal'));
            if (authModal) authModal.hide();
            
            // Show OTP modal
            const otpModal = new bootstrap.Modal(document.getElementById('otpModal'));
            otpModal.show();
            
            // Focus first input
            setTimeout(() => {
                document.querySelector('#otpModal .otp-input').focus();
            }, 300);
        },
        
        async verify() {
            const otpInputs = document.querySelectorAll('#otpModal .otp-input');
            const otp = Array.from(otpInputs).map(input => input.value).join('');
            
            if (otp.length !== 4) {
                Utils.showMessage('Please enter complete 4-digit OTP', 'error');
                return;
            }
            
            const button = document.getElementById('verifyOTPBtn');
            button.disabled = true;
            button.textContent = 'VERIFYING...';
            
            try {
                const result = await API.makeRequest('verify_otp', {
                    email: this.currentEmail,
                    otp
                });
                
                button.disabled = false;
                button.textContent = 'VERIFY';
                
                if (result.success) {
                    Utils.showMessage(result.message || 'Verification successful!', 'success');
                    
                    // Close OTP modal
                    const otpModal = bootstrap.Modal.getInstance(document.getElementById('otpModal'));
                    if (otpModal) otpModal.hide();
                    
                    // Redirect
                    setTimeout(() => {
                        const redirectUrl = sessionStorage.getItem('authRedirectUrl') || result.redirect_url || '/';
                        sessionStorage.removeItem('authRedirectUrl');
                        window.location.href = redirectUrl;
                    }, 500);
                } else {
                    Utils.showMessage(result.message || 'Invalid OTP. Please try again.', 'error');
                    otpInputs.forEach(input => input.value = '');
                    otpInputs[0].focus();
                }
            } catch (error) {
                button.disabled = false;
                button.textContent = 'VERIFY';
                Utils.showMessage('Network error. Please try again.', 'error');
            }
        },
        
        async resend() {
            const button = document.getElementById('resendOTPBtn');
            button.disabled = true;
            button.textContent = 'Sending...';
            
            try {
                const result = await API.makeRequest('resend_otp', {
                    email: this.currentEmail
                });
                
                button.disabled = false;
                button.textContent = 'Resend Code';
                
                if (result.success) {
                    Utils.showMessage('New OTP sent to your email!', 'success');
                } else {
                    Utils.showMessage(result.message || 'Failed to resend OTP', 'error');
                }
            } catch (error) {
                button.disabled = false;
                button.textContent = 'Resend Code';
                Utils.showMessage('Network error. Please try again.', 'error');
            }
        }
    };
    
    // Back from OTP modal
    window.backFromOTP = function() {
        const otpModal = bootstrap.Modal.getInstance(document.getElementById('otpModal'));
        if (otpModal) otpModal.hide();
        
        // Show auth modal again
        setTimeout(() => {
            const authModal = new bootstrap.Modal(document.getElementById('authModal'));
            authModal.show();
        }, 300);
    };
    
    // Event listeners for OTP modal buttons
    document.addEventListener('DOMContentLoaded', function() {
        document.getElementById('verifyOTPBtn').addEventListener('click', () => OTPModal.verify());
        document.getElementById('resendOTPBtn').addEventListener('click', () => OTPModal.resend());
        
        // OTP input handling in OTP modal
        const otpInputs = document.querySelectorAll('#otpModal .otp-input');
        otpInputs.forEach((input, index) => {
            input.addEventListener('input', function(e) {
                if (this.value.length === 1 && index < otpInputs.length - 1) {
                    otpInputs[index + 1].focus();
                }
            });
            
            input.addEventListener('keydown', function(e) {
                if (e.key === 'Backspace' && !this.value && index > 0) {
                    otpInputs[index - 1].focus();
                }
            });
            
            // Prevent non-numeric input
            input.addEventListener('keypress', function(e) {
                if (!/[0-9]/.test(e.key)) {
                    e.preventDefault();
                }
            });
        });
    });
})();