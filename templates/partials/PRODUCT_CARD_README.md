# Product Card Component

## Overview
A reusable, modern product card component for displaying products across the QuickMeds platform.

## Location
- **Template**: `templates/partials/product_card.html`
- **Styles**: `static/css/product-card.css`

## Usage

### Basic Usage
```django
{% include 'partials/product_card.html' with product=product %}
```

### In a Loop
```django
{% for product in products %}
    {% include 'partials/product_card.html' with product=product %}
{% endfor %}
```

## Features

### ✨ Visual Features
- **Modern Design**: Clean, card-based layout with rounded corners
- **Hover Effects**: Smooth lift animation and shadow enhancement
- **Product Badges**: Dynamic badges for discounts, low stock, and out of stock
- **Responsive Images**: Lazy loading with fallback support
- **Price Display**: Shows current price, original price, and discount percentage

### 🎯 Interactive Elements
- **Click to View**: Entire card is clickable to view product details
- **Add to Cart**: Quick add-to-cart button with loading states
- **Wishlist**: Toggle wishlist with heart icon animation
- **Notify Me**: For out-of-stock products

### 📱 Responsive Design
- **Mobile**: Optimized for small screens (< 480px)
- **Tablet**: Adjusted sizing for medium screens (< 768px)
- **Desktop**: Full-featured layout for large screens

## Product Object Requirements

The component expects a `product` object with the following attributes:

```python
product = {
    'id': int,                      # Product ID
    'name': str,                    # Product name
    'category': {
        'name': str                 # Category name
    },
    'price': Decimal,               # Current price
    'original_price': Decimal,      # Original price (optional)
    'discount_percentage': float,   # Discount % (optional)
    'stock': int,                   # Stock quantity
    'image': ImageField,            # Product image (optional)
}
```

## Customization

### CSS Variables
The component uses CSS variables for easy theming:

```css
--primary: #2563eb          /* Primary color */
--primary-dark: #1d4ed8     /* Darker primary shade */
```

### Modifying Styles
To customize the component, edit `static/css/product-card.css`:

1. **Card Dimensions**: Adjust `.product-card` styles
2. **Colors**: Modify badge colors in `.badge-*` classes
3. **Spacing**: Update padding/margins in `.product-info`
4. **Animations**: Customize transitions and transforms

## JavaScript Functions Required

The component requires these JavaScript functions to be defined:

```javascript
// Open product detail page
function openProductDetail(productId, event) { }

// Add product to cart
function addToCartQuick(event, productId) { }

// Toggle wishlist
function toggleWishlistQuick(event, productId) { }

// Notify when back in stock
function notifyMe(event, productId) { }
```

## Pages Using This Component

- ✅ `home.html` - Featured products section
- ✅ `product.html` - Product listing page
- 🔄 `search_results.html` - Search results (to be implemented)
- 🔄 `wishlist.html` - Wishlist page (to be implemented)

## Benefits

### 🚀 Performance
- **Lazy Loading**: Images load only when needed
- **Optimized CSS**: Minimal, efficient styles
- **Smooth Animations**: Hardware-accelerated transforms

### 🔧 Maintainability
- **Single Source**: Update once, changes reflect everywhere
- **Consistent Design**: Same look and feel across all pages
- **Easy Updates**: Modify component file instead of multiple pages

### ♿ Accessibility
- **Semantic HTML**: Proper heading hierarchy
- **Alt Text**: Image descriptions for screen readers
- **Keyboard Navigation**: Fully keyboard accessible
- **ARIA Labels**: Proper labeling for assistive technologies

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Future Enhancements

- [ ] Add product rating display
- [ ] Implement quick view modal
- [ ] Add product comparison feature
- [ ] Support for product variants
- [ ] Add to cart quantity selector
- [ ] Product image gallery preview

## Troubleshooting

### Card not displaying
- Ensure `product_card.css` is included in your base template
- Check that the product object has all required attributes

### Images not loading
- Verify `{% load static %}` is at the top of the template
- Check that `MEDIA_URL` is configured in settings
- Ensure fallback image exists at `static/img/image.png`

### JavaScript errors
- Confirm all required JavaScript functions are defined
- Check browser console for specific error messages
- Verify CSRF token is properly configured

## Support

For issues or questions, contact the development team or create an issue in the project repository.
