// AJAX-powered live search for search_results.html
// Updates results and filters instantly as user types or clicks category

document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    const searchStats = document.querySelector('.search-stats');
    const categoryFilters = document.querySelectorAll('.category-filter');
    let lastQuery = searchInput ? searchInput.value.trim() : '';
    let lastCategory = 'all';
    let debounceTimeout = null;

    function highlight(text, query) {
        if (!query) return text;
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    function updateResults(data, query) {
        // Update stats
        if (searchStats) {
            searchStats.innerHTML = `<span class="results-count">${data.total_results} result${data.total_results === 1 ? '' : 's'}</span> found for "<span class="search-query">${query}</span>"`;
        }
        // Update products
        if (searchResults) {
            if (data.products.length) {
                searchResults.innerHTML = data.products.map(product =>
                    `<a href="/product/${product.slug}/" class="product-card-link">
                        <div class="product-card">
                            <img src="${product.image_url}" alt="${product.name}" style="width:100%;height:140px;object-fit:cover;border-radius:10px;">
                            <h3 class="product-title">${highlight(product.name, query)}</h3>
                            <div class="product-price">₹${product.price}</div>
                            <button class="cart-button">Add to Cart</button>
                        </div>
                    </a>`
                ).join('');
            } else {
                searchResults.innerHTML = `<div class="no-results">
                    <div class="no-results-icon"><i class="fas fa-search"></i></div>
                    <h2>No results found</h2>
                    <p>We couldn't find any products matching "${query}"</p>
                    <div class="suggestions">
                        <h3>Suggestions:</h3>
                        <ul><li>Check your spelling</li><li>Try more general keywords</li><li>Try different keywords</li></ul>
                    </div>
                </div>`;
            }
        }
    }

    function fetchResults(query, category) {
        if (!query) return;
        fetch(`/search/api/?q=${encodeURIComponent(query)}&category=${encodeURIComponent(category)}`)
            .then(res => res.json())
            .then(data => updateResults(data, query));
    }

    if (searchInput) {
        searchInput.addEventListener('input', function() {
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => {
                lastQuery = this.value.trim();
                fetchResults(lastQuery, lastCategory);
            }, 200);
        });
    }

    categoryFilters.forEach(btn => {
        btn.addEventListener('click', function() {
            categoryFilters.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            lastCategory = this.dataset.category;
            fetchResults(lastQuery, lastCategory);
        });
    });
});
