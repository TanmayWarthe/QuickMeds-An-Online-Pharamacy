// Profile page search functionality
document.addEventListener('DOMContentLoaded', function() {
    const searchBox = document.querySelector('.search-box');
    const searchIcon = document.querySelector('.search-icon');

    if (searchBox) {
        // Handle search input
        searchBox.addEventListener('input', function(e) {
            if (this.value.length > 0) {
                searchIcon.style.color = '#2c3e50';
            } else {
                searchIcon.style.color = '#3498db';
            }
        });

        // Handle search form submission
        searchBox.closest('form').addEventListener('submit', function(e) {
            e.preventDefault();
            const searchQuery = searchBox.value.trim();
            
            if (searchQuery) {
                // Redirect to search results page with the query
                window.location.href = `/search-products/?q=${encodeURIComponent(searchQuery)}`;
            }
        });

        // Handle Enter key press
        searchBox.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const searchQuery = this.value.trim();
                
                if (searchQuery) {
                    window.location.href = `/search-products/?q=${encodeURIComponent(searchQuery)}`;
                }
            }
        });
    }
}); 