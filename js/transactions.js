/**
 * Transactions functionality for ACCCA Financial Management System
 */

// DOM Elements
const transactionsTable = document.getElementById('transactionsTable');
const dateRangeFilter = document.getElementById('dateRangeFilter');
const typeFilter = document.getElementById('typeFilter');
const categoryFilter = document.getElementById('categoryFilter');
const syncStatusFilter = document.getElementById('syncStatusFilter');
const applyFiltersBtn = document.getElementById('applyFilters');
const resetFiltersBtn = document.getElementById('resetFilters');
const logoutBtn = document.getElementById('logoutBtn');
const sidebarCollapse = document.getElementById('sidebarCollapse');
const sidebar = document.getElementById('sidebar');
const content = document.getElementById('content');
const syncBtn = document.getElementById('syncBtn');
const syncStatus = document.getElementById('syncStatus');
const userFullName = document.getElementById('userFullName');
const userRole = document.getElementById('userRole');

// Modal elements
const transactionDetailsModal = document.getElementById('transactionDetailsModal');
const deleteConfirmModal = document.getElementById('deleteConfirmModal');
const editTransactionBtn = document.getElementById('editTransactionBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

// DataTable instance
let dataTable;

// Current transaction being viewed/edited
let currentTransactionId = null;

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
    initializeDateRangePicker();
    initializeDataTable();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load transaction data
    loadTransactions();
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
 * Initialize date range picker for filters
 */
function initializeDateRangePicker() {
    flatpickr(dateRangeFilter, {
        mode: 'range',
        dateFormat: 'Y-m-d',
        // Default to last 30 days
        defaultDate: [new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date()]
    });
}

/**
 * Initialize DataTables
 */
function initializeDataTable() {
    dataTable = new DataTable('#transactionsTable', {
        processing: true,
        language: {
            processing: '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>',
            emptyTable: 'No transactions found',
            zeroRecords: 'No matching transactions found'
        },
        columns: [
            { data: 'id' },
            { data: 'description' },
            { data: 'category' },
            { data: 'date' },
            { data: 'amount' },
            { data: 'syncStatus' },
            { data: 'actions', orderable: false }
        ],
        order: [[3, 'desc']], // Sort by date (newest first)
        responsive: true,
        dom: 'lBfrtip',
        lengthMenu: [[10, 25, 50, -1], [10, 25, 50, 'All']],
        pageLength: 10
    });
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Filter buttons
    applyFiltersBtn.addEventListener('click', applyFilters);
    resetFiltersBtn.addEventListener('click', resetFilters);
    
    // Transaction row actions
    transactionsTable.addEventListener('click', function(event) {
        const target = event.target;
        
        // View transaction details
        if (target.classList.contains('view-btn') || target.closest('.view-btn')) {
            const id = target.dataset.id || target.closest('.view-btn').dataset.id;
            viewTransactionDetails(id);
        }
        
        // Edit transaction
        if (target.classList.contains('edit-btn') || target.closest('.edit-btn')) {
            const id = target.dataset.id || target.closest('.edit-btn').dataset.id;
            editTransaction(id);
        }
        
        // Delete transaction
        if (target.classList.contains('delete-btn') || target.closest('.delete-btn')) {
            const id = target.dataset.id || target.closest('.delete-btn').dataset.id;
            showDeleteConfirmation(id);
        }
    });
    
    // Edit button in modal
    editTransactionBtn.addEventListener('click', function() {
        if (currentTransactionId) {
            editTransaction(currentTransactionId);
        }
    });
    
    // Confirm delete button
    confirmDeleteBtn.addEventListener('click', confirmDelete);
    
    // Sync button
    syncBtn.addEventListener('click', syncData);
    
    // Logout button
    logoutBtn.addEventListener('click', logout);
}

/**
 * Load transactions from the database
 */
function loadTransactions() {
    utils.showLoading(true);
    
    // Clear existing data
    dataTable.clear();
    
    // Get transactions from IndexedDB
    db.getAll(db.stores.transactions)
        .then(transactions => {
            if (transactions && transactions.length > 0) {
                const formattedTransactions = transactions.map(formatTransactionForTable);
                dataTable.rows.add(formattedTransactions).draw();
            }
            utils.showLoading(false);
        })
        .catch(error => {
            console.error('Error loading transactions:', error);
            utils.showLoading(false);
            utils.showNotification('Error', 'Failed to load transactions', 'error');
        });
}

/**
 * Format transaction data for the table
 * @param {Object} transaction - Transaction object from the database
 * @returns {Object} Formatted transaction for the table
 */
function formatTransactionForTable(transaction) {
    const amountDisplay = transaction.type === 'expense' 
        ? `<span class="text-danger">-${utils.formatCurrency(transaction.amount)}</span>` 
        : `<span class="text-success">+${utils.formatCurrency(transaction.amount)}</span>`;
    
    const dateDisplay = utils.formatDate(transaction.date);
    
    const categoryDisplay = `<span class="badge ${getCategoryBadgeClass(transaction.category)}">${getCategoryName(transaction.category)}</span>`;
    
    const statusDisplay = transaction.syncStatus === 'synced' 
        ? '<span class="badge badge-synced">Synced</span>' 
        : '<span class="badge badge-sync">Pending</span>';
    
    const actions = `
        <div class="btn-group btn-group-sm">
            <button type="button" class="btn btn-outline-primary view-btn" data-id="${transaction.id}" title="View details">
                <i class="fas fa-eye"></i>
            </button>
            <button type="button" class="btn btn-outline-secondary edit-btn" data-id="${transaction.id}" title="Edit">
                <i class="fas fa-edit"></i>
            </button>
            <button type="button" class="btn btn-outline-danger delete-btn" data-id="${transaction.id}" title="Delete">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    return {
        id: transaction.id.substring(0, 8),
        description: transaction.description,
        category: categoryDisplay,
        date: dateDisplay,
        amount: amountDisplay,
        syncStatus: statusDisplay,
        actions: actions,
        // Store the original transaction object for reference
        _original: transaction
    };
}

/**
 * Get category name from its ID
 * @param {string} categoryId - Category ID
 * @returns {string} Category name
 */
function getCategoryName(categoryId) {
    const categories = {
        'cow-sales': 'Cow Sales',
        'dairy-products': 'Dairy Products',
        'cultural-tour': 'Cultural Tours',
        'artifacts': 'Artifacts',
        'salaries': 'Salaries',
        'feeds': 'Feeds',
        'maintenance': 'Maintenance',
        'utilities': 'Utilities',
        'other': 'Other'
    };
    
    return categories[categoryId] || categoryId;
}

/**
 * Get badge class for a category
 * @param {string} categoryId - Category ID
 * @returns {string} Badge class
 */
function getCategoryBadgeClass(categoryId) {
    const incomeCategories = ['cow-sales', 'dairy-products', 'cultural-tour', 'artifacts'];
    const expenseCategories = ['salaries', 'feeds', 'maintenance', 'utilities'];
    
    if (incomeCategories.includes(categoryId)) {
        return 'bg-success';
    } else if (expenseCategories.includes(categoryId)) {
        return 'bg-danger';
    } else {
        return 'bg-secondary';
    }
}

/**
 * Apply filters to the transactions table
 */
function applyFilters() {
    const dateRange = dateRangeFilter.value;
    const type = typeFilter.value;
    const category = categoryFilter.value;
    const syncStatus = syncStatusFilter.value;
    
    // Custom filtering function
    $.fn.dataTable.ext.search.push(function(settings, data, dataIndex) {
        const rowData = dataTable.row(dataIndex).data();
        const transaction = rowData._original;
        
        // Check date range
        if (dateRange) {
            const dates = dateRange.split(' to ');
            const startDate = dates[0] ? new Date(dates[0]) : null;
            const endDate = dates[1] ? new Date(dates[1]) : null;
            const transactionDate = new Date(transaction.date);
            
            if (startDate && endDate) {
                if (transactionDate < startDate || transactionDate > endDate) {
                    return false;
                }
            }
        }
        
        // Check transaction type
        if (type && transaction.type !== type) {
            return false;
        }
        
        // Check category
        if (category && transaction.category !== category) {
            return false;
        }
        
        // Check sync status
        if (syncStatus && transaction.syncStatus !== syncStatus) {
            return false;
        }
        
        return true;
    });
    
    // Redraw the table with filters applied
    dataTable.draw();
    
    // Remove the custom filter
    $.fn.dataTable.ext.search.pop();
}

/**
 * Reset all filters
 */
function resetFilters() {
    dateRangeFilter.value = '';
    typeFilter.value = '';
    categoryFilter.value = '';
    syncStatusFilter.value = '';
    
    // Redraw the table without filters
    dataTable.draw();
}

/**
 * View transaction details
 * @param {string} id - Transaction ID
 */
function viewTransactionDetails(id) {
    currentTransactionId = id;
    
    db.getById(db.stores.transactions, id)
        .then(transaction => {
            if (transaction) {
                // Set modal content
                document.getElementById('modalTransactionId').textContent = transaction.id.substring(0, 8);
                document.getElementById('modalDescription').textContent = transaction.description;
                document.getElementById('modalCategory').textContent = getCategoryName(transaction.category);
                document.getElementById('modalReference').textContent = transaction.reference || 'N/A';
                document.getElementById('modalDate').textContent = utils.formatDate(transaction.date);
                
                const amountText = transaction.type === 'expense' 
                    ? `- ${utils.formatCurrency(transaction.amount)}` 
                    : `+ ${utils.formatCurrency(transaction.amount)}`;
                document.getElementById('modalAmount').textContent = amountText;
                document.getElementById('modalAmount').className = transaction.type === 'expense' ? 'text-danger mb-3' : 'text-success mb-3';
                
                document.getElementById('modalPaymentMethod').textContent = transaction.paymentMethod || 'N/A';
                
                const statusElement = document.getElementById('modalStatus');
                statusElement.textContent = transaction.syncStatus === 'synced' ? 'Synced' : 'Pending sync';
                statusElement.className = transaction.syncStatus === 'synced' ? 'badge badge-synced' : 'badge badge-sync';
                
                document.getElementById('modalNotes').textContent = transaction.notes || 'No notes available';
                
                // Handle attachments if any
                const attachmentSection = document.getElementById('attachmentSection');
                const modalAttachments = document.getElementById('modalAttachments');
                
                if (transaction.attachments && transaction.attachments.length > 0) {
                    attachmentSection.style.display = 'block';
                    modalAttachments.innerHTML = '';
                    
                    transaction.attachments.forEach(attachment => {
                        const attachmentItem = document.createElement('div');
                        attachmentItem.className = 'attachment-item';
                        attachmentItem.innerHTML = `
                            <i class="fas fa-file me-2"></i>
                            <a href="${attachment.url}" target="_blank">${attachment.name}</a>
                        `;
                        modalAttachments.appendChild(attachmentItem);
                    });
                } else {
                    attachmentSection.style.display = 'none';
                }
                
                // Show the modal
                const modal = new bootstrap.Modal(transactionDetailsModal);
                modal.show();
            } else {
                utils.showNotification('Error', 'Transaction not found', 'error');
            }
        })
        .catch(error => {
            console.error('Error loading transaction details:', error);
            utils.showNotification('Error', 'Failed to load transaction details', 'error');
        });
}

/**
 * Edit a transaction
 * @param {string} id - Transaction ID
 */
function editTransaction(id) {
    // Store transaction ID in session storage for the edit page to use
    sessionStorage.setItem('editTransactionId', id);
    
    // Navigate to the edit transaction page
    window.location.href = 'edit-transaction.html';
}

/**
 * Show delete confirmation modal
 * @param {string} id - Transaction ID
 */
function showDeleteConfirmation(id) {
    currentTransactionId = id;
    
    // Show the confirmation modal
    const modal = new bootstrap.Modal(deleteConfirmModal);
    modal.show();
}

/**
 * Confirm and delete a transaction
 */
function confirmDelete() {
    if (!currentTransactionId) return;
    
    utils.showLoading(true);
    
    db.delete(db.stores.transactions, currentTransactionId)
        .then(() => {
            utils.showLoading(false);
            utils.showNotification('Success', 'Transaction deleted successfully', 'success');
            
            // Close the modal
            const modal = bootstrap.Modal.getInstance(deleteConfirmModal);
            modal.hide();
            
            // Reload transactions
            loadTransactions();
        })
        .catch(error => {
            utils.showLoading(false);
            console.error('Error deleting transaction:', error);
            utils.showNotification('Error', 'Failed to delete transaction', 'error');
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
            
            // Reload transactions to update their sync status in the table
            loadTransactions();
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