document.addEventListener('DOMContentLoaded', function() {
    const checkoutForm = document.getElementById('checkoutForm');
    const manualAddressForm = document.getElementById('manual-address-form');
    const addressRadios = document.querySelectorAll('.address-radio');

    // Function to handle address selection
    function handleAddressSelection(e) {
        const selectedAddressId = e.target.value;
        // Hide manual address form when an address is selected
        manualAddressForm.style.display = 'none';
    }

    // Add event listeners to address radio buttons
    addressRadios.forEach(radio => {
        radio.addEventListener('change', handleAddressSelection);
    });

    // Handle form submission
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const selectedAddress = document.querySelector('input[name="selected_address"]:checked');
            if (!selectedAddress) {
                showNotification('Please select a delivery address', 'error');
                return;
            }

            const formData = new FormData(this);
            const paymentMethod = document.getElementById('payment_method').value;
            
            if (paymentMethod === 'razorpay') {
                handleRazorpayPayment(formData);
            } else if (paymentMethod === 'cod') {
                handleCODPayment(formData);
            }
        });
    }

    // Function to show notifications
    function showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.style.display = 'block';

        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }

    // Handle Razorpay payment
    async function handleRazorpayPayment(formData) {
        try {
            const response = await fetch('/create-razorpay-order/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                const options = {
                    key: razorpayKeyId,
                    amount: data.amount,
                    currency: data.currency,
                    name: 'QuickMeds',
                    description: 'Medicine Purchase',
                    order_id: data.order_id,
                    handler: function(response) {
                        formData.append('razorpay_payment_id', response.razorpay_payment_id);
                        formData.append('razorpay_order_id', response.razorpay_order_id);
                        formData.append('razorpay_signature', response.razorpay_signature);
                        
                        processPayment(formData);
                    },
                    prefill: {
                        name: document.getElementById('first_name').value + ' ' + document.getElementById('last_name').value,
                        email: document.getElementById('email').value,
                        contact: document.getElementById('phone').value
                    },
                    theme: {
                        color: '#3498db'
                    }
                };
                
                const rzp = new Razorpay(options);
                rzp.open();
            }
        } catch (error) {
            showNotification('Failed to create payment order', 'error');
        }
    }

    // Handle COD payment
    async function handleCODPayment(formData) {
        try {
            const response = await fetch('/process-cod-order/', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                window.location.href = '/order-confirmation/' + data.order_id;
            } else {
                showNotification(data.message || 'Failed to place order', 'error');
            }
        } catch (error) {
            showNotification('Failed to process order', 'error');
        }
    }

    // Process payment after Razorpay success
    async function processPayment(formData) {
        try {
            const response = await fetch('/process-payment/', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                window.location.href = '/order-confirmation/' + data.order_id;
            } else {
                showNotification('Payment verification failed', 'error');
            }
        } catch (error) {
            showNotification('Failed to process payment', 'error');
        }
    }
});
