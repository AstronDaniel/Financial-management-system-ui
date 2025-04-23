/**
 * Add Transaction functionality for ACCCA Financial Management System
 */

// DOM Elements
const transactionForm = document.getElementById('transactionForm');
const typeIncome = document.getElementById('typeIncome');
const typeExpense = document.getElementById('typeExpense');
const transactionDate = document.getElementById('transactionDate');
const amount = document.getElementById('amount');
const category = document.getElementById('category');
const incomeCategories = document.getElementById('incomeCategories');
const expenseCategories = document.getElementById('expenseCategories');
const description = document.getElementById('description');
const paymentMethod = document.getElementById('paymentMethod');
const reference = document.getElementById('reference');
const customerSection = document.getElementById('customerSection');
const customerSelect = document.getElementById('customer');
const notes = document.getElementById('notes');
const attachments = document.getElementById('attachments');
const attachmentsList = document.getElementById('attachmentsList');
const saveBtn = document.getElementById('saveBtn');
const cancelBtn = document.getElementById('cancelBtn');
const addCustomerModal = document.getElementById('addCustomerModal');
const customerForm = document.getElementById('customerForm');
const customerName = document.getElementById('customerName');
const customerEmail = document.getElementById('customerEmail');
const customerPhone = document.getElementById('customerPhone');
const customerAddress = document.getElementById('customerAddress');
const saveCustomerBtn = document.getElementById('saveCustomerBtn');
const sidebarCollapse = document.getElementById('sidebarCollapse');
const sidebar = document.getElementById('sidebar');
const content = document.getElementById('content');
const syncBtn = document.getElementById('syncBtn');
const syncStatus = document.getElementById('syncStatus');
const logoutBtn = document.getElementById('logoutBtn');
const userFullName = document.getElementById('userFullName');
const userRole = document.getElementById('userRole');

// Selected files for attachments
let selectedFiles = [];

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Verify user is logged in
    const currentUser = sessionStorage.getItem('currentUser');
    
    if (!currentUser) {
        // Redirect to login page if not logged in
        window.location.href = '../../index.html';
        return;
    }
    
    // Set user info
    try {
        const user = JSON.parse(currentUser);
        userFullName.textContent = user.name || 'Administrator';
        userRole.textContent = user.role || 'Admin';
        
        // Update header user name
        const dropdownUserName = document.querySelector('#userDropdown span');
        if (dropdownUserName) {
            dropdownUserName.textContent = user.name || 'Administrator';
        }
    } catch (error) {
        console.error('Error parsing user data:', error);
    }
    
    // Initialize components
    initializeSidebar();
    initializeDatePicker();
    initializeSelect2();
    
    // Load customers for the dropdown
    loadCustomers();
    
    // Set up event listeners
    setupEventListeners();
});

/**
 * Initialize sidebar functionality
 */
function initializeSidebar() {
    sidebarCollapse.addEventListener('click', function() {
        sidebar.classList.toggle('collapsed');
        content.classList.toggle('expanded');
    });
    
    // Handle responsive behavior
    function checkWidth() {
        if (window.innerWidth < 768) {
            sidebar.classList.add('collapsed');
            content.classList.add('expanded');
        } else {
            sidebar.classList.remove('collapsed');
            content.classList.remove('expanded');
        }
    }
    
    // Initial check
    checkWidth();
    
    // Listen for window resize
    window.addEventListener('resize', checkWidth);
}

/**
 * Initialize date picker for transaction date
 */
function initializeDatePicker() {
    flatpickr(transactionDate, {
        dateFormat: 'Y-m-d',
        defaultDate: new Date(),
        maxDate: new Date() // Can't select future dates
    });
}

/**
 * Initialize Select2 for customer dropdown
 */
function initializeSelect2() {
    $(customerSelect).select2({
        theme: 'bootstrap-5',
        width: '100%',
        placeholder: 'Select customer (optional)'
    });
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Transaction type change
    typeIncome.addEventListener('change', handleTransactionTypeChange);
    typeExpense.addEventListener('change', handleTransactionTypeChange);
    
    // Form submission
    transactionForm.addEventListener('submit', handleFormSubmit);
    
    // Cancel button
    cancelBtn.addEventListener('click', function() {
        utils.confirmAction('Cancel', 'Are you sure you want to cancel? Any unsaved changes will be lost.', 'Yes, cancel')
            .then((result) => {
                if (result.isConfirmed) {
                    window.location.href = 'all-transactions.html';
                }
            });
    });
    
    // Customer select change
    customerSelect.addEventListener('change', function() {
        if (customerSelect.value === 'new') {
            // Reset the customer form
            customerForm.reset();
            
            // Show the modal
            const modal = new bootstrap.Modal(addCustomerModal);
            modal.show();
            
            // Reset the select value
            $(customerSelect).val('').trigger('change');
        }
    });
    
    // Customer save button
    saveCustomerBtn.addEventListener('click', saveNewCustomer);
    
    // File attachments
    attachments.addEventListener('change', handleFileSelection);
    
    // Sync button
    syncBtn.addEventListener('click', syncData);
    
    // Logout button
    logoutBtn.addEventListener('click', logout);
}

/**
 * Handle transaction type change
 */
function handleTransactionTypeChange() {
    const isIncome = typeIncome.checked;
    
    // Show/hide category optgroups
    if (isIncome) {
        incomeCategories.style.display = '';
        expenseCategories.style.display = 'none';
        customerSection.style.display = '';
    } else {
        incomeCategories.style.display = 'none';
        expenseCategories.style.display = '';
        customerSection.style.display = 'none';
    }
    
    // Reset category selection
    category.value = '';
}

/**
 * Load customers for dropdown
 */
function loadCustomers() {
    utils.showLoading(true);
    
    db.getAll(db.stores.customers)
        .then(customers => {
            if (customers && customers.length > 0) {
                // Get the first two options (default and "Add New")
                const defaultOptions = [
                    customerSelect.options[0],
                    customerSelect.options[1]
                ];
                
                // Clear existing options
                customerSelect.innerHTML = '';
                
                // Re-add the default options
                defaultOptions.forEach(option => {
                    customerSelect.add(option);
                });
                
                // Add customers
                customers.forEach(customer => {
                    const option = document.createElement('option');
                    option.value = customer.id;
                    option.textContent = customer.name;
                    customerSelect.add(option);
                });
            }
            
            utils.showLoading(false);
        })
        .catch(error => {
            console.error('Error loading customers:', error);
            utils.showLoading(false);
        });
}

/**
 * Save a new customer
 */
function saveNewCustomer() {
    // Validate form
    if (!customerForm.checkValidity()) {
        customerForm.classList.add('was-validated');
        return;
    }
    
    utils.showLoading(true);
    
    // Create customer object
    const customer = {
        id: utils.generateId(),
        name: customerName.value.trim(),
        email: customerEmail.value.trim(),
        phone: customerPhone.value.trim(),
        address: customerAddress.value.trim(),
        dateAdded: new Date().toISOString(),
        syncStatus: 'pending'
    };
    
    // Save to database
    db.add(db.stores.customers, customer)
        .then(() => {
            utils.showLoading(false);
            
            // Close the modal
            const modal = bootstrap.Modal.getInstance(addCustomerModal);
            modal.hide();
            
            // Show success message
            utils.showNotification('Success', 'Customer added successfully', 'success');
            
            // Add to dropdown and select
            const option = document.createElement('option');
            option.value = customer.id;
            option.textContent = customer.name;
            
            // Insert before the "Add New" option
            customerSelect.insertBefore(option, customerSelect.options[1]);
            
            // Select the new customer
            $(customerSelect).val(customer.id).trigger('change');
            
            // Add to sync queue
            db.addToSyncQueue({
                store: db.stores.customers,
                action: 'add',
                data: customer
            });
        })
        .catch(error => {
            utils.showLoading(false);
            console.error('Error saving customer:', error);
            utils.showNotification('Error', 'Failed to save customer', 'error');
        });
}

/**
 * Handle file selection for attachments
 */
function handleFileSelection() {
    selectedFiles = Array.from(attachments.files);
    
    // Show selected files
    displaySelectedFiles();
}

/**
 * Display selected files
 */
function displaySelectedFiles() {
    attachmentsList.innerHTML = '';
    
    if (selectedFiles.length === 0) {
        return;
    }
    
    selectedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'attachment-item d-flex align-items-center mb-2';
        
        // Get file extension
        const extension = file.name.split('.').pop().toLowerCase();
        
        // Get icon based on extension
        let icon = 'fa-file';
        if (['pdf'].includes(extension)) {
            icon = 'fa-file-pdf';
        } else if (['doc', 'docx'].includes(extension)) {
            icon = 'fa-file-word';
        } else if (['xls', 'xlsx'].includes(extension)) {
            icon = 'fa-file-excel';
        } else if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
            icon = 'fa-file-image';
        }
        
        fileItem.innerHTML = `
            <i class="fas ${icon} me-2"></i>
            <span class="filename">${file.name}</span>
            <span class="filesize text-muted ms-2">(${formatFileSize(file.size)})</span>
            <button type="button" class="btn btn-sm btn-link text-danger remove-file" data-index="${index}">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        attachmentsList.appendChild(fileItem);
        
        // Add remove button listener
        fileItem.querySelector('.remove-file').addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            removeFile(index);
        });
    });
}

/**
 * Format file size in a human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Remove a file from the selected files
 * @param {number} index - Index of the file to remove
 */
function removeFile(index) {
    selectedFiles.splice(index, 1);
    displaySelectedFiles();
}

/**
 * Handle form submission
 * @param {Event} event - Form submit event
 */
function handleFormSubmit(event) {
    event.preventDefault();
    
    // Validate form
    if (!transactionForm.checkValidity()) {
        transactionForm.classList.add('was-validated');
        return;
    }
    
    // Show loading
    utils.showLoading(true);
    saveBtn.disabled = true;
    saveBtn.querySelector('.spinner-border').classList.remove('d-none');
    
    // Process attachments if any
    const processAttachments = new Promise((resolve) => {
        if (selectedFiles.length === 0) {
            resolve([]);
            return;
        }
        
        const processedFiles = [];
        let filesProcessed = 0;
        
        selectedFiles.forEach(file => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const attachment = {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: e.target.result // Base64 encoded data
                };
                
                processedFiles.push(attachment);
                filesProcessed++;
                
                if (filesProcessed === selectedFiles.length) {
                    resolve(processedFiles);
                }
            };
            
            reader.onerror = function() {
                console.error('Error reading file:', file.name);
                filesProcessed++;
                
                if (filesProcessed === selectedFiles.length) {
                    resolve(processedFiles);
                }
            };
            
            reader.readAsDataURL(file);
        });
    });
    
    // Process form data with attachments
    processAttachments.then(attachmentData => {
        // Create transaction object
        const transaction = {
            id: utils.generateId(),
            type: typeIncome.checked ? 'income' : 'expense',
            date: transactionDate.value,
            amount: parseFloat(amount.value),
            category: category.value,
            description: description.value.trim(),
            paymentMethod: paymentMethod.value,
            reference: reference.value.trim(),
            customerId: typeIncome.checked && customerSelect.value ? customerSelect.value : null,
            notes: notes.value.trim(),
            attachments: attachmentData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            syncStatus: 'pending'
        };
        
        // Save to database
        db.add(db.stores.transactions, transaction)
            .then(() => {
                // Add to sync queue
                return db.addToSyncQueue({
                    store: db.stores.transactions,
                    action: 'add',
                    data: transaction
                });
            })
            .then(() => {
                utils.showLoading(false);
                saveBtn.disabled = false;
                saveBtn.querySelector('.spinner-border').classList.add('d-none');
                
                // Show success message
                utils.showNotification('Success', 'Transaction saved successfully', 'success');
                
                // Reset form
                transactionForm.reset();
                transactionForm.classList.remove('was-validated');
                selectedFiles = [];
                attachmentsList.innerHTML = '';
                
                // Reset date to today
                transactionDate._flatpickr.setDate(new Date());
                
                // Reset Select2
                $(customerSelect).val('').trigger('change');
                
                // Optional: redirect to transactions list
                utils.confirmAction('Success', 'Transaction saved successfully. Do you want to add another transaction?', 'Yes, add another', 'No, go to list')
                    .then((result) => {
                        if (!result.isConfirmed) {
                            window.location.href = 'all-transactions.html';
                        }
                    });
            })
            .catch(error => {
                utils.showLoading(false);
                saveBtn.disabled = false;
                saveBtn.querySelector('.spinner-border').classList.add('d-none');
                
                console.error('Error saving transaction:', error);
                utils.showNotification('Error', 'Failed to save transaction', 'error');
            });
    });
}

/**
 * Sync data with server
 */
function syncData() {
    // Show syncing state
    syncBtn.disabled = true;
    syncBtn.innerHTML = '<span class="spinner-border spinner-border-sm sync-spinner" role="status" aria-hidden="true"></span> Syncing...';
    syncStatus.textContent = 'Syncing...';
    syncStatus.className = 'badge badge-sync';
    
    // Process sync queue
    db.processSyncQueue()
        .then(result => {
            console.log('Sync result:', result);
            
            // Update UI
            syncBtn.disabled = false;
            syncBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Sync Now';
            syncStatus.textContent = 'All data synced';
            syncStatus.className = 'badge badge-synced';
            
            // Show notification
            utils.showNotification('Sync Complete', 'All data has been synchronized with the server.', 'success');
        })
        .catch(error => {
            console.error('Sync error:', error);
            
            // Update UI
            syncBtn.disabled = false;
            syncBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Retry Sync';
            syncStatus.textContent = 'Sync failed';
            syncStatus.className = 'badge bg-danger';
            
            // Show error notification
            utils.showNotification('Sync Failed', 'Please check your connection and try again.', 'error');
        });
}

/**
 * Logout user
 */
function logout() {
    utils.confirmAction('Logout', 'Are you sure you want to logout?', 'Yes, logout')
        .then((result) => {
            if (result.isConfirmed) {
                // Clear session storage
                sessionStorage.removeItem('currentUser');
                
                // Redirect to login page
                window.location.href = '../../index.html';
            }
        });
}