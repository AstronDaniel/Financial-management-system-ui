/**
 * Utility functions for ACCCA Financial Management System
 */

// Network status monitoring
const utils = {
    /**
     * Check if the browser is online
     * @returns {boolean} True if online, false otherwise
     */
    isOnline: function() {
        return navigator.onLine;
    },

    /**
     * Update UI based on connection status
     */
    updateConnectionStatus: function() {
        const statusElem = document.getElementById('connectionStatus');
        const iconElem = statusElem?.previousElementSibling;
        
        if (!statusElem) return;
        
        if (this.isOnline()) {
            statusElem.textContent = 'Online';
            statusElem.classList.remove('text-danger');
            statusElem.classList.add('text-success');
            
            if (iconElem) {
                iconElem.classList.remove('fa-wifi-slash', 'text-danger');
                iconElem.classList.add('fa-wifi', 'text-success');
            }
            
            // Remove offline badge if it exists
            const offlineBadge = document.querySelector('.offline-badge');
            if (offlineBadge) {
                offlineBadge.remove();
            }
        } else {
            statusElem.textContent = 'Offline';
            statusElem.classList.remove('text-success');
            statusElem.classList.add('text-danger');
            
            if (iconElem) {
                iconElem.classList.remove('fa-wifi', 'text-success');
                iconElem.classList.add('fa-wifi-slash', 'text-danger');
            }
            
            // Add offline badge if it doesn't exist
            if (!document.querySelector('.offline-badge')) {
                const badge = document.createElement('div');
                badge.className = 'offline-badge';
                badge.textContent = 'Offline Mode';
                document.body.appendChild(badge);
            }
        }
    },

    /**
     * Format date to locale string
     * @param {Date|string} date - Date object or date string
     * @param {Object} options - Intl.DateTimeFormat options
     * @returns {string} Formatted date string
     */
    formatDate: function(date, options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };
        
        const dateObj = date instanceof Date ? date : new Date(date);
        return dateObj.toLocaleDateString(undefined, { ...defaultOptions, ...options });
    },

    /**
     * Format currency
     * @param {number} amount - Amount to format
     * @param {string} currency - Currency code (default: UGX)
     * @returns {string} Formatted currency string
     */
    formatCurrency: function(amount, currency = 'UGX') {
        return new Intl.NumberFormat('en-UG', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0
        }).format(amount);
    },

    /**
     * Show loading spinner
     * @param {boolean} show - Whether to show or hide the spinner
     */
    showLoading: function(show = true) {
        let loadingOverlay = document.querySelector('.loading-overlay');
        
        if (show) {
            if (!loadingOverlay) {
                loadingOverlay = document.createElement('div');
                loadingOverlay.className = 'loading-overlay';
                loadingOverlay.innerHTML = `
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                `;
                document.body.appendChild(loadingOverlay);
            }
        } else if (loadingOverlay) {
            loadingOverlay.remove();
        }
    },

    /**
     * Show notification using SweetAlert2
     * @param {string} title - Notification title
     * @param {string} message - Notification message
     * @param {string} icon - Notification icon (success, error, warning, info, question)
     */
    showNotification: function(title, message, icon = 'success') {
        Swal.fire({
            title: title,
            text: message,
            icon: icon,
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });
    },

    /**
     * Confirm action using SweetAlert2
     * @param {string} title - Confirmation title
     * @param {string} message - Confirmation message
     * @param {string} confirmButtonText - Text for confirm button
     * @param {string} icon - Icon to display (warning, question)
     * @returns {Promise} Promise that resolves with the result
     */
    confirmAction: function(title, message, confirmButtonText = 'Yes, proceed', icon = 'warning') {
        return Swal.fire({
            title: title,
            text: message,
            icon: icon,
            showCancelButton: true,
            confirmButtonColor: '#5d3a00',
            cancelButtonColor: '#6c757d',
            confirmButtonText: confirmButtonText
        });
    },

    /**
     * Generate a unique ID
     * @returns {string} Unique ID
     */
    generateUniqueId: function() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    },

    /**
     * Debounce function
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    debounce: function(func, wait) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    },

    /**
     * Serialize form data to object
     * @param {HTMLFormElement} form - Form element
     * @returns {Object} Form data as object
     */
    serializeForm: function(form) {
        const formData = new FormData(form);
        const data = {};
        
        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        return data;
    },

    /**
     * Calculate sync status - if it's been more than 5 minutes, mark as needs sync
     * @param {number} timestamp - Timestamp of last sync
     * @returns {boolean} True if needs sync, false otherwise
     */
    needsSync: function(timestamp) {
        const fiveMinutes = 5 * 60 * 1000;
        return !timestamp || Date.now() - timestamp > fiveMinutes;
    },

    /**
     * Check if two objects are deeply equal
     * @param {Object} obj1 - First object
     * @param {Object} obj2 - Second object
     * @returns {boolean} True if objects are equal
     */
    deepEqual: function(obj1, obj2) {
        if (obj1 === obj2) return true;
        
        if (typeof obj1 !== 'object' || obj1 === null || 
            typeof obj2 !== 'object' || obj2 === null) {
            return false;
        }
        
        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);
        
        if (keys1.length !== keys2.length) return false;
        
        for (const key of keys1) {
            if (!keys2.includes(key) || !this.deepEqual(obj1[key], obj2[key])) {
                return false;
            }
        }
        
        return true;
    }
};

// Set up event listeners for online/offline status
window.addEventListener('online', () => utils.updateConnectionStatus());
window.addEventListener('offline', () => utils.updateConnectionStatus());

// Initialize connection status on page load
document.addEventListener('DOMContentLoaded', () => {
    utils.updateConnectionStatus();

    // Sidebar toggle functionality
    const sidebarCollapse = document.getElementById('sidebarCollapse');
    const sidebar = document.getElementById('sidebar');
    
    if (sidebarCollapse && sidebar) {
        sidebarCollapse.addEventListener('click', function() {
            sidebar.classList.toggle('active');
            document.getElementById('content').classList.toggle('active');
        });
    }
    
    // Handle logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            Swal.fire({
                title: 'Logout',
                text: 'Are you sure you want to logout?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Yes, logout',
                cancelButtonText: 'No, stay logged in'
            }).then((result) => {
                if (result.isConfirmed) {
                    // In a real app, this would clear session data
                    window.location.href = '../../login.html';
                }
            });
        });
    }
    
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Connection status indicators
    const connectionStatusEl = document.getElementById('connectionStatus');
    const syncStatusEl = document.getElementById('syncStatus');
    const syncBtn = document.getElementById('syncBtn');
    
    // Monitor network status
    function updateConnectionStatus() {
        if (navigator.onLine) {
            if (connectionStatusEl) {
                connectionStatusEl.textContent = 'Online';
                connectionStatusEl.previousElementSibling.classList.replace('text-danger', 'text-success');
            }
        } else {
            if (connectionStatusEl) {
                connectionStatusEl.textContent = 'Offline';
                connectionStatusEl.previousElementSibling.classList.replace('text-success', 'text-danger');
            }
            if (syncStatusEl) {
                syncStatusEl.textContent = 'Offline - Changes will sync when online';
                syncStatusEl.classList.replace('badge-synced', 'badge-pending');
            }
        }
    }
    
    // Update status on page load
    updateConnectionStatus();
    
    // Listen for changes in network status
    window.addEventListener('online', updateConnectionStatus);
    window.addEventListener('offline', updateConnectionStatus);
    
    // Handle sync button click
    if (syncBtn) {
        syncBtn.addEventListener('click', function() {
            if (navigator.onLine) {
                // Simulate sync process
                syncStatusEl.textContent = 'Syncing...';
                syncStatusEl.classList.replace('badge-synced', 'badge-syncing');
                syncStatusEl.classList.replace('badge-pending', 'badge-syncing');
                
                setTimeout(function() {
                    syncStatusEl.textContent = 'All data synced';
                    syncStatusEl.classList.replace('badge-syncing', 'badge-synced');
                    
                    Swal.fire({
                        title: 'Sync Complete',
                        text: 'All data has been synchronized with the server.',
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false
                    });
                }, 2000);
            } else {
                Swal.fire({
                    title: 'Offline',
                    text: 'Cannot sync while offline. Please connect to the internet and try again.',
                    icon: 'error'
                });
            }
        });
    }
});