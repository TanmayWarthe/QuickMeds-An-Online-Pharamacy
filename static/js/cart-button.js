function initCartButtons() {
    const cartButtons = document.querySelectorAll('.cart-button');
    
    cartButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Prevent multiple clicks
            if (!this.classList.contains('clicked')) {
                this.classList.add('clicked');
                
                // Remove clicked class after animation completes
                setTimeout(() => {
                    this.classList.remove('clicked');
                }, 2000);
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', initCartButtons);
