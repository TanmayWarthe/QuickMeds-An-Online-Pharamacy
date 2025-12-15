# QuickMeds Admin Dashboard - Quick Start Guide

## 🚀 Accessing the Admin Panel

### Admin Login
1. Navigate to: `http://your-domain.com/admin-panel/login/`
2. Enter your admin email and password
3. Click "Login"

**Note**: Only users with staff or superuser status can access the admin panel.

## 📊 Dashboard Overview

The admin dashboard provides:
- **Total Products**: Number of products in the system
- **Total Orders**: All orders placed
- **Pending Orders**: Orders awaiting processing
- **Total Users**: Registered users count
- **Total Revenue**: Sum of all completed order payments
- **Recent Orders**: Last 10 orders
- **Low Stock Products**: Products with 10 or fewer items in stock

## 🛍️ Managing Products

### View Products
- Go to **Products** in the sidebar
- Use filters: Search, Category, Stock Status
- Click on product name to view details

### Add New Product
1. Click "Add New Product"
2. Fill in required fields:
   - Product Name *
   - Description
   - Category *
   - Price *
   - Original Price (optional - for showing discounts)
   - Stock Quantity *
   - Product Image
   - Available for Sale (checkbox)
3. Click "Add Product"

### Edit Product
1. Find the product in the products list
2. Click the "Edit" button
3. Modify the fields
4. Click "Update Product"

### Delete Product
1. Find the product in the products list
2. Click the "Delete" button
3. Confirm deletion
**Note**: Cannot delete products with pending orders

### Product Image Guidelines
- Supported formats: JPG, JPEG, PNG, WEBP
- Maximum file size: 5MB
- Recommended dimensions: 800x800px

## 📦 Managing Orders

### View Orders
- Go to **Orders** in the sidebar
- Use filters: Order Status, Payment Status, Search
- Click on Order ID to view full details

### Order Statuses
- **PENDING**: Order placed, awaiting processing
- **PROCESSING**: Order being prepared
- **SHIPPED**: Order dispatched
- **DELIVERED**: Order delivered to customer
- **CANCELLED**: Order cancelled

### Payment Statuses
- **PENDING**: Payment not yet received
- **COMPLETED**: Payment successful
- **FAILED**: Payment failed
- **REFUNDED**: Payment refunded
- **REFUND_PENDING**: Refund in progress

### Update Order Status
1. Click on an order to view details
2. Select new Order Status from dropdown
3. Select new Payment Status (if needed)
4. Click "Update Status"
**Note**: Customer will receive an email notification

## 👥 Managing Users

### View Users
- Go to **Users** in the sidebar
- Use filters: Active, Inactive, Staff
- Use search to find specific users

### User Actions

#### Activate/Deactivate User
1. Find the user in the list
2. Click "Activate" or "Deactivate" button
3. Confirm the action
**Note**: Cannot deactivate your own account

#### Delete User
1. Find the user in the list
2. Click "Delete" button
3. Confirm deletion
**Note**: Cannot delete your own account or superusers (unless you're a superuser)

### User Information Displayed
- Username
- Email
- Full Name
- Phone Number
- Join Date
- Status (Active/Inactive)
- Role (Staff/Regular User)

## 🏷️ Managing Categories

### View Categories
- Go to **Categories** in the sidebar
- View all categories with product counts
- Use search to find specific categories

### Add New Category
1. Click "Add New Category"
2. Fill in:
   - Category Name * (must be unique)
   - Description (optional)
   - Icon Class (FontAwesome icon, e.g., fa-pills)
   - Category Image (optional)
3. Click "Add Category"

### Edit Category
1. Find the category in the list
2. Click "Edit" button
3. Modify fields
4. Click "Update Category"

### Delete Category
1. Find the category in the list
2. Click "Delete" button
3. Confirm deletion
**Note**: Cannot delete categories with products. Reassign or delete products first.

## 📧 Managing Contact Messages

### View Messages
- Go to **Messages** in the sidebar
- Filter by: Read, Unread
- Use search to find specific messages
- Unread count shown in red badge

### Message Actions

#### Mark as Read/Unread
1. Find the message in the list
2. Click "Mark as Read" or "Mark as Unread"

#### Delete Message
1. Find the message in the list
2. Click "Delete" button
3. Confirm deletion

### Message Information
- Name
- Email
- Phone
- Subject
- Message Content
- Date Received
- Read Status

## 🔍 Search and Filter Features

### Global Search
- Available in all management pages
- Searches across relevant fields
- Real-time filtering

### Products Search
- Searches: Product name, description

### Orders Search
- Searches: Order ID, user email, username, customer name

### Users Search
- Searches: Username, email, first name, last name

### Categories Search
- Searches: Category name, description

### Messages Search
- Searches: Name, email, subject, message content

## 🔐 Security Features

### Logout
1. Click "Logout" in the sidebar
2. Confirm logout
**Note**: Logout uses secure POST method

### Password Protection
- Never share your admin credentials
- Use strong passwords
- Change password regularly

### Access Control
- Staff users: Can access admin panel
- Superusers: Full admin access
- Regular users: Cannot access admin panel

## ⚙️ Best Practices

### Product Management
1. ✅ Always add high-quality product images
2. ✅ Set accurate stock quantities
3. ✅ Use clear, descriptive product names
4. ✅ Add detailed descriptions
5. ✅ Set original price if product is on discount
6. ✅ Mark products as unavailable instead of deleting

### Order Management
1. ✅ Process orders promptly
2. ✅ Update order status as it progresses
3. ✅ Keep payment status accurate
4. ✅ Communicate with customers on delays

### User Management
1. ✅ Review user accounts regularly
2. ✅ Deactivate suspicious accounts
3. ✅ Don't delete users unless absolutely necessary
4. ✅ Keep accurate user information

### Category Management
1. ✅ Create logical category structure
2. ✅ Use consistent naming convention
3. ✅ Add category descriptions
4. ✅ Use relevant icons

### Message Management
1. ✅ Respond to messages promptly
2. ✅ Mark messages as read after handling
3. ✅ Keep important messages for reference
4. ✅ Delete spam messages

## 🚨 Troubleshooting

### Cannot Login
- Verify you have staff or superuser status
- Check email and password are correct
- Contact system administrator

### Cannot Delete Product
- Check if product has pending orders
- If yes, wait for orders to complete or cancel them
- Alternatively, mark product as out of stock

### Cannot Delete Category
- Check if category has products
- Reassign products to another category
- Then delete the empty category

### Cannot Delete User
- You cannot delete your own account
- Only superusers can delete other superusers
- Contact another admin if needed

### Images Not Showing
- Check image file size (must be < 5MB)
- Verify file format (JPG, JPEG, PNG, WEBP)
- Ensure proper file upload

## 📞 Support

For technical issues or questions:
1. Check this guide first
2. Review the main documentation (ADMIN_DASHBOARD_FIXES.md)
3. Contact the development team
4. Email: support@quickmeds.com

## 📈 Performance Tips

1. ✅ Use search instead of scrolling through long lists
2. ✅ Apply filters to narrow down results
3. ✅ Keep browser updated for best performance
4. ✅ Clear browser cache if experiencing issues
5. ✅ Use modern browsers (Chrome, Firefox, Edge)

## 🎯 Quick Links

- **Home**: Return to main website
- **Dashboard**: `/admin-panel/`
- **Products**: `/admin-panel/products/`
- **Orders**: `/admin-panel/orders/`
- **Users**: `/admin-panel/users/`
- **Categories**: `/admin-panel/categories/`
- **Messages**: `/admin-panel/contacts/`

---

**Last Updated**: December 15, 2025
**Version**: 1.0

Happy Managing! 🎉
