// Quantity buttons
document.querySelectorAll('.quantity-btn').forEach(button => {
    button.addEventListener('click', () => {
        const input = button.parentElement.querySelector('.quantity-input');
        let value = parseInt(input.value);
        if (button.textContent === '-') {
            if (value > 1) input.value = value - 1;
        } else {
            input.value = value + 1;
        }
    });
});

// Add to Cart button
document.querySelector('.add-to-cart').addEventListener('click', () => {
    alert('Added to cart!');
});

// Wishlist button
document.querySelector('.wishlist').addEventListener('click', () => {
    alert('Added to wishlist!');
});

// Thumbnail click to change main image (optional)
document.querySelectorAll('.thumbnails img').forEach(thumb => {
    thumb.addEventListener('click', () => {
        const mainImage = document.querySelector('.main-image');
        mainImage.src = thumb.src;
    });
});