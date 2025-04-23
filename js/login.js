/**
 * Login functionality for ACCCA Financial Management System
 */

// DOM elements
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const togglePasswordBtn = document.querySelector('.toggle-password');
const loginBtn = document.querySelector('.login-btn');
const loadingSpinner = loginBtn.querySelector('.spinner-border');
const resetPasswordBtn = document.getElementById('resetPasswordBtn');

// Check if user is already logged in
document.addEventListener('DOMContentLoaded', function() {
    // Try to get user from session storage
    const currentUser = sessionStorage.getItem('currentUser');
    
    // Check if remember me was checked
    const rememberedUser = localStorage.getItem('rememberedUser');
    
    if (currentUser) {
        // User is already logged in, redirect to dashboard
        redirectToDashboard();
    } else if (rememberedUser) {
        // If user wanted to be remembered, fill in the form
        try {
            const user = JSON.parse(rememberedUser);
            usernameInput.value = user.username;
            document.getElementById('rememberMe').checked = true;
        } catch (error) {
            console.error('Error parsing remembered user:', error);
            localStorage.removeItem('rememberedUser');
        }
    }
});

// Toggle password visibility
togglePasswordBtn.addEventListener('click', function() {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    
    // Toggle icon
    const icon = this.querySelector('i');
    icon.classList.toggle('fa-eye');
    icon.classList.toggle('fa-eye-slash');
});

// Handle login form submission
loginForm.addEventListener('submit', function(event) {
    event.preventDefault();
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    // Validate form
    if (!username || !password) {
        utils.showNotification('Error', 'Please enter both username and password', 'error');
        return;
    }
    
    // Show loading state
    loginBtn.disabled = true;
    loadingSpinner.classList.remove('d-none');
    
    // Attempt login
    db.verifyLogin(username, password)
        .then(user => {
            // Store user in session storage
            sessionStorage.setItem('currentUser', JSON.stringify(user));
            
            // Handle remember me
            if (rememberMe) {
                localStorage.setItem('rememberedUser', JSON.stringify({ 
                    username: username,
                    timestamp: Date.now()
                }));
            } else {
                localStorage.removeItem('rememberedUser');
            }
            
            // Redirect to dashboard
            redirectToDashboard();
        })
        .catch(error => {
            utils.showNotification('Login Failed', error, 'error');
            
            // Reset loading state
            loginBtn.disabled = false;
            loadingSpinner.classList.add('d-none');
        });
});

// Handle reset password button click
resetPasswordBtn?.addEventListener('click', function() {
    const email = document.getElementById('emailReset').value.trim();
    
    if (!email) {
        utils.showNotification('Error', 'Please enter your email address', 'error');
        return;
    }
    
    // In a real app, this would send a reset email
    // For demo, just show a success message
    utils.showNotification(
        'Password Reset Requested', 
        'If your email exists in our system, you will receive password reset instructions shortly.',
        'info'
    );
    
    // Close the modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('forgotPasswordModal'));
    modal.hide();
});

// Function to redirect to dashboard
function redirectToDashboard() {
    window.location.href = 'pages/dashboard.html';
}