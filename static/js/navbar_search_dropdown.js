// Advanced Navbar Search Dropdown Logic
// Shows suggestions as dropdown, no overlay, works everywhere navbar is used

document.addEventListener('DOMContentLoaded', function() {
    const searchBtn = document.getElementById('navSearchBtn');
    const searchForm = document.getElementById('navSearchForm');
    const searchInput = document.getElementById('navSearchInput');
    const searchClear = document.getElementById('navSearchClear');
    const suggestionsBox = document.getElementById('navSearchSuggestions');
    let suggestions = [];
    let selectedIndex = -1;
    let debounceTimeout = null;

    // Dummy data for demo (replace with AJAX/fetch in production)
    const demoSuggestions = [
        { type: 'product', text: 'Paracetamol 500mg', url: '/product/paracetamol-500mg/' },
        { type: 'product', text: 'Aspirin', url: '/product/aspirin/' },
        { type: 'category', text: 'Pain Relief', url: '/category/pain-relief/' },
        { type: 'category', text: 'Vitamins', url: '/category/vitamins/' },
        { type: 'product', text: 'Cough Syrup', url: '/product/cough-syrup/' },
        { type: 'category', text: 'Personal Care', url: '/category/personal-care/' }
    ];

    function showSuggestions(items) {
        if (!items.length) {
            suggestionsBox.innerHTML = '<div class="suggestions-list">No results found</div>';
            suggestionsBox.classList.add('active');
            return;
        }
        suggestionsBox.innerHTML =
            '<div class="suggestions-list">' +
            items.map((item, idx) =>
                `<div class="suggestion-item${selectedIndex === idx ? ' active' : ''}" tabindex="0" data-url="${item.url}" data-idx="${idx}">
                    <i class="fas fa-${item.type === 'product' ? 'capsules' : 'layer-group'}"></i>
                    <span class="suggestion-text">${item.text}</span>
                </div>`
            ).join('') +
            '</div>';
        suggestionsBox.classList.add('active');
    }

    function hideSuggestions() {
        suggestionsBox.classList.remove('active');
        selectedIndex = -1;
    }

    function fetchSuggestions(query) {
        // Replace with AJAX/fetch to backend for real data
        if (!query) {
            showSuggestions([]);
            return;
        }
        // Simple filter for demo
        const filtered = demoSuggestions.filter(s => s.text.toLowerCase().includes(query.toLowerCase()));
        suggestions = filtered;
        showSuggestions(filtered);
    }

    // Expand search on button click
    if (searchBtn && searchForm && searchInput) {
        searchBtn.addEventListener('click', function() {
            searchForm.classList.add('active');
            searchInput.focus();
        });
    }

    // Input events
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => {
                fetchSuggestions(this.value.trim());
            }, 150);
            searchClear.style.opacity = this.value ? 1 : 0;
            searchClear.style.pointerEvents = this.value ? 'auto' : 'none';
        });
        searchInput.addEventListener('focus', function() {
            if (this.value) fetchSuggestions(this.value.trim());
        });
        searchInput.addEventListener('keydown', function(e) {
            if (!suggestions.length) return;
            if (e.key === 'ArrowDown') {
                selectedIndex = (selectedIndex + 1) % suggestions.length;
                showSuggestions(suggestions);
                e.preventDefault();
            } else if (e.key === 'ArrowUp') {
                selectedIndex = (selectedIndex - 1 + suggestions.length) % suggestions.length;
                showSuggestions(suggestions);
                e.preventDefault();
            } else if (e.key === 'Enter') {
                if (selectedIndex >= 0 && suggestions[selectedIndex]) {
                    window.location.href = suggestions[selectedIndex].url;
                    e.preventDefault();
                } else if (this.value) {
                    searchForm.submit();
                }
            } else if (e.key === 'Escape') {
                hideSuggestions();
            }
        });
    }

    // Clear button
    if (searchClear) {
        searchClear.addEventListener('click', function() {
            searchInput.value = '';
            searchInput.focus();
            hideSuggestions();
            searchClear.style.opacity = 0;
            searchClear.style.pointerEvents = 'none';
        });
    }

    // Click on suggestion
    suggestionsBox.addEventListener('mousedown', function(e) {
        const item = e.target.closest('.suggestion-item');
        if (item && item.dataset.url) {
            window.location.href = item.dataset.url;
        }
    });

    // Hide suggestions on outside click
    document.addEventListener('mousedown', function(e) {
        if (!searchForm.contains(e.target) && !suggestionsBox.contains(e.target)) {
            hideSuggestions();
        }
    });

    // Hide on blur (optional, keep open if needed)
    searchInput && searchInput.addEventListener('blur', function() {
        setTimeout(hideSuggestions, 150);
    });
});
