// Search handlers for search results page

// This file handles search-specific interactions
document.addEventListener('DOMContentLoaded', function() {
    // Initialize search handlers
    const searchInput = document.querySelector('input[type="search"]');
    
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const searchForm = this.closest('form');
                if (searchForm) {
                    searchForm.submit();
                }
            }
        });
    }
});
