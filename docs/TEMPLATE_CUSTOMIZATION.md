# QuickMeds Template Customization Guide

## Overview
The QuickMeds Django project uses a fully reusable component-based template system with professional navbar, footer, and extensive customization hooks.

---

## Navbar Usage

The navbar is a **reusable component** located at `templates/partials/navbar.html` and is automatically included in all pages via `base.html`.

### How It's Used

In `base.html`:
```django
{% block header %}
{% include 'partials/navbar.html' %}
{% endblock %}
```

### Features
- **Professional horizontal navigation** (Home, Medicines, About, Contact)
- **Active page indicator** (blue underline on current page)
- **Search overlay** (click search icon)
- **Shopping cart** with badge count
- **User dropdown menu** (Profile, Orders, Logout)
- **Guest mode** (Login/Get Started buttons)
- **Fully responsive** (icons-only on mobile)
- **No sidebar** - clean desktop experience

### Using Navbar in Any Template

Simply extend `base.html` and the navbar will automatically appear:

```django
{% extends 'base.html' %}

{% block content %}
<!-- Your page content -->
{% endblock %}
```

---

## Base Template Structure

**File:** `templates/base.html`

### Available Blocks

#### Head Section
- `{% block title %}` - Page title (default: "QuickMeds - Online Pharmacy")
- `{% block extra_css %}` - Page-specific CSS files

#### Body Section
- `{% block body_top %}` - Content before navbar (alerts, banners)
- `{% block header %}` - Override entire navbar (default: includes `partials/navbar.html`)
- `{% block content_wrapper %}` - Wrap main content area
  - `{% block content %}` - Main page content
- `{% block footer %}` - Override entire footer (default: includes `partials/footer.html`)
- `{% block body_bottom %}` - Content after footer (modals, floating elements)
- `{% block extra_js %}` - Page-specific JavaScript

---

## Navbar Customization

**File:** `templates/partials/navbar.html`

### Available Blocks

```django
{% block navbar_brand %}
<!-- Override the QuickMeds logo/brand -->
{% endblock %}

{% block navbar_center %}
<!-- Add search bar, breadcrumbs, etc. between brand and right menu -->
{% endblock %}

{% block navbar_extra_left %}
<!-- Add items before cart/user menu (e.g., notifications icon) -->
{% endblock %}

{% block navbar_user_menu_prepend %}
<!-- Add menu items at top of user dropdown -->
{% endblock %}

{% block navbar_user_menu_append %}
<!-- Add menu items before logout in user dropdown -->
{% endblock %}
```

### Sidebar Customization

```django
{% block sidebar_nav_prepend %}
<!-- Add nav items before default links -->
{% endblock %}

{% block sidebar_nav_append %}
<!-- Add nav items after default links -->
{% endblock %}

{% block sidebar_footer %}
<!-- Override support card in sidebar footer -->
{% endblock %}
```

---

## Footer Customization

**File:** `templates/partials/footer.html`

### Available Blocks

```django
{% block footer_before_main %}
<!-- Content above footer grid (e.g., newsletter signup) -->
{% endblock %}

{% block footer_description %}
<!-- Override brand description text -->
{% endblock %}

{% block footer_social_links %}
<!-- Override social media icons -->
{% endblock %}

{% block footer_quick_links_extra %}
<!-- Add extra quick links -->
{% endblock %}

{% block footer_categories_title %}
<!-- Override "Categories" heading -->
{% endblock %}

{% block footer_categories %}
<!-- Override category links -->
{% endblock %}

{% block footer_contact %}
<!-- Override contact information -->
{% endblock %}

{% block footer_copyright %}
<!-- Override copyright text -->
{% endblock %}

{% block footer_legal_links %}
<!-- Override privacy/terms links -->
{% endblock %}

{% block footer_after_bottom %}
<!-- Content below footer (e.g., back-to-top button) -->
{% endblock %}
```

---

## Example: Profile Page with Custom Header

```django
{% extends 'base.html' %}
{% load static %}

{% block title %}My Profile - QuickMeds{% endblock %}

{# Add custom menu item in navbar #}
{% block navbar_user_menu_prepend %}
<li><a class="dropdown-item" href="{% url 'profile' %}#settings">
  <i class="fas fa-cog"></i> Quick Settings
</a></li>
{% endblock %}

{# Add custom sidebar link #}
{% block sidebar_nav_append %}
<a href="{% url 'profile' %}#orders" class="nav-item">
  <i class="fas fa-history"></i>
  <span>Order History</span>
</a>
{% endblock %}

{# Add newsletter in footer #}
{% block footer_before_main %}
<div class="newsletter-banner">
  <h3>Subscribe for Health Tips</h3>
  <form><!-- form fields --></form>
</div>
{% endblock %}

{% block content %}
<!-- Profile page content -->
{% endblock %}
```

---

## Example: Custom Landing Page

```django
{% extends 'base.html' %}

{# Hide navbar for clean landing #}
{% block header %}{% endblock %}

{# Custom minimal footer #}
{% block footer %}
<footer class="landing-footer">
  <p>&copy; 2025 QuickMeds</p>
</footer>
{% endblock %}

{% block content %}
<!-- Landing page hero, etc. -->
{% endblock %}
```

---

## CSS/JS Organization

### Global Styles (Loaded on All Pages)
- `static/css/theme.css` - CSS variables, utilities
- `static/css/layout.css` - Navbar, sidebar, footer styles

### Page-Specific Styles
Add in `{% block extra_css %}`:
```django
{% block extra_css %}
<link rel="stylesheet" href="{% static 'css/profile-modern.css' %}">
{% endblock %}
```

### Page-Specific JavaScript
Add in `{% block extra_js %}`:
```django
{% block extra_js %}
<script src="{% static 'js/profile.js' %}"></script>
{% endblock %}
```

---

## Best Practices

1. **Extend, Don't Replace**: Use blocks to extend components rather than overriding entire partials
2. **Maintain Consistency**: Keep global nav/footer structure; only inject page-specific items
3. **Semantic Naming**: Name custom blocks clearly (e.g., `navbar_notifications` not `custom_block_1`)
4. **Mobile-First**: Test customizations on mobile; navbar/footer are responsive
5. **Accessibility**: Add proper `aria-label` and `role` attributes to custom elements

---

## Troubleshooting

**Issue:** Custom block not appearing  
**Solution:** Ensure block name matches exactly in both partial and child template

**Issue:** Duplicate navbar/footer  
**Solution:** Don't call `{% include 'partials/navbar.html' %}` in child templates; use blocks

**Issue:** Styling conflicts  
**Solution:** Scope custom CSS to page-specific classes, avoid `!important`

---

## Version
**Last Updated:** November 15, 2025  
**Django Version:** 5.1.5  
**Bootstrap Version:** 5.1.3
