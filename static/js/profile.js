document.addEventListener('DOMContentLoaded', function() {
    // Profile image upload
    const imageUpload = document.getElementById('profile-image-upload');
    const profileImage = document.querySelector('.profile-image');

    imageUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const formData = new FormData();
            formData.append('profile_image', file);

            fetch('/update-profile-image/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken'),
                },
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    profileImage.src = URL.createObjectURL(file);
                }
            });
        }
    });

    // Profile form submission
    const profileForm = document.getElementById('profile-form');
    
    profileForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(profileForm);
        
        fetch('/update-profile/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken'),
            },
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showAlert('Profile updated successfully!', 'success');
            } else {
                showAlert('Error updating profile', 'error');
            }
        });
    });

    // Helper functions
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    function showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type === 'success' ? 'success' : 'danger'} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        profileForm.insertAdjacentElement('beforebegin', alertDiv);
        
        setTimeout(() => {
            alertDiv.remove();
        }, 3000);
    }
});