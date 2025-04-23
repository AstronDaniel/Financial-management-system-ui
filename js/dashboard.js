/**
 * Dashboard functionality for ACCCA Financial Management System
 */

// DOM Elements
const sidebarCollapse = document.getElementById('sidebarCollapse');
const sidebar = document.getElementById('sidebar');
const content = document.getElementById('content');
const syncBtn = document.getElementById('syncBtn');
const syncStatus = document.getElementById('syncStatus');
const logoutBtn = document.getElementById('logoutBtn');
const userFullName = document.getElementById('userFullName');
const userRole = document.getElementById('userRole');
const totalRevenue = document.getElementById('totalRevenue');
const totalExpenses = document.getElementById('totalExpenses');
const netIncome = document.getElementById('netIncome');
const totalBookings = document.getElementById('totalBookings');
const chartPeriodBtns = document.querySelectorAll('[data-chart-period]');

// Charts
let financialChart;
let revenueDistributionChart;

// User authentication check
document.addEventListener('DOMContentLoaded', function() {
    // Verify user is logged in
    const currentUser = sessionStorage.getItem('currentUser');
    
    if (!currentUser) {
        // Redirect to login page if not logged in
        window.location.href = '../index.html';
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
    initializeDateRange();
    initializeCharts();
    loadDashboardData();
    
    // Set up sync button
    syncBtn.addEventListener('click', syncData);
    
    // Set up logout button
    logoutBtn.addEventListener('click', logout);
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
 * Initialize date range picker
 */
function initializeDateRange() {
    const dateRange = document.getElementById('dateRange');
    
    if (dateRange) {
        // Get current month's date range
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        flatpickr(dateRange, {
            mode: 'range',
            dateFormat: 'M d, Y',
            defaultDate: [firstDay, lastDay],
            onChange: function(selectedDates) {
                if (selectedDates.length === 2) {
                    // Reload dashboard data with new date range
                    loadDashboardData(selectedDates[0], selectedDates[1]);
                }
            }
        });
    }
}

/**
 * Initialize dashboard charts
 */
function initializeCharts() {
    // Financial Overview Chart
    const financialChartElem = document.getElementById('financialChart');
    if (financialChartElem) {
        financialChart = new Chart(financialChartElem, {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [
                    {
                        label: 'Revenue',
                        backgroundColor: 'rgba(34, 139, 34, 0.5)',
                        borderColor: 'rgba(34, 139, 34, 1)',
                        borderWidth: 1,
                        data: [1200000, 1900000, 2100000, 1500000, 2600000, 2200000, 1800000, 1900000, 2800000, 2100000, 2500000, 3000000]
                    },
                    {
                        label: 'Expenses',
                        backgroundColor: 'rgba(220, 53, 69, 0.5)',
                        borderColor: 'rgba(220, 53, 69, 1)',
                        borderWidth: 1,
                        data: [800000, 950000, 1000000, 850000, 1200000, 1300000, 900000, 850000, 1100000, 950000, 1050000, 1200000]
                    },
                    {
                        label: 'Net Income',
                        backgroundColor: 'rgba(93, 58, 0, 0.5)',
                        borderColor: 'rgba(93, 58, 0, 1)',
                        borderWidth: 1,
                        data: [400000, 950000, 1100000, 650000, 1400000, 900000, 900000, 1050000, 1700000, 1150000, 1450000, 1800000]
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'UGX ' + (value / 1000000).toFixed(1) + 'M';
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + utils.formatCurrency(context.parsed.y);
                            }
                        }
                    }
                }
            }
        });
        
        // Add event listeners to chart period buttons
        chartPeriodBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all buttons
                chartPeriodBtns.forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                btn.classList.add('active');
                
                // Update chart based on period
                updateChartPeriod(btn.dataset.chartPeriod);
            });
        });
    }
    
    // Revenue Distribution Chart
    const revenueDistributionChartElem = document.getElementById('revenueDistributionChart');
    if (revenueDistributionChartElem) {
        revenueDistributionChart = new Chart(revenueDistributionChartElem, {
            type: 'doughnut',
            data: {
                labels: ['Cow Sales', 'Dairy Products', 'Cultural Tours', 'Artifacts', 'Other'],
                datasets: [{
                    data: [45, 25, 20, 7, 3],
                    backgroundColor: [
                        'rgba(93, 58, 0, 0.8)',
                        'rgba(218, 165, 32, 0.8)',
                        'rgba(34, 139, 34, 0.8)',
                        'rgba(23, 162, 184, 0.8)',
                        'rgba(108, 117, 125, 0.8)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.label + ': ' + context.parsed + '%';
                            }
                        }
                    }
                }
            }
        });
    }
}

/**
 * Update chart based on selected period
 * @param {string} period - The period to display (monthly, quarterly, yearly)
 */
function updateChartPeriod(period) {
    if (!financialChart) return;
    
    let labels, revenueData, expensesData, netIncomeData;
    
    switch (period) {
        case 'quarterly':
            labels = ['Q1', 'Q2', 'Q3', 'Q4'];
            revenueData = [5200000, 6300000, 6500000, 7600000];
            expensesData = [2750000, 3350000, 2850000, 3200000];
            netIncomeData = [2450000, 2950000, 3650000, 4400000];
            break;
        case 'yearly':
            labels = ['2022', '2023', '2024', '2025'];
            revenueData = [18000000, 22000000, 25000000, 12456800];
            expensesData = [10000000, 11500000, 12000000, 5231700];
            netIncomeData = [8000000, 10500000, 13000000, 7225100];
            break;
        default: // monthly
            // Keep original data
            return;
    }
    
    // Update chart data
    financialChart.data.labels = labels;
    financialChart.data.datasets[0].data = revenueData;
    financialChart.data.datasets[1].data = expensesData;
    financialChart.data.datasets[2].data = netIncomeData;
    
    // Update chart
    financialChart.update();
}

/**
 * Load dashboard data
 * @param {Date} startDate - Start date for data filtering (optional)
 * @param {Date} endDate - End date for data filtering (optional)
 */
function loadDashboardData(startDate, endDate) {
    // For demo purposes, we're using mock data
    // In a real app, this would fetch data from the database based on the date range
    
    // Format currency values
    totalRevenue.textContent = utils.formatCurrency(12456800);
    totalExpenses.textContent = utils.formatCurrency(5231700);
    netIncome.textContent = utils.formatCurrency(7225100);
    
    // Update tables with transactions and bookings
    // In a real app, this would load data from the database
    loadRecentTransactions();
    loadUpcomingBookings();
}

/**
 * Load recent transactions into the table
 */
function loadRecentTransactions() {
    // In a real app, this would fetch data from the database
    // For demo purposes, we're using the mock data already in the HTML
}

/**
 * Load upcoming bookings into the table
 */
function loadUpcomingBookings() {
    // In a real app, this would fetch data from the database
    // For demo purposes, we're using the mock data already in the HTML
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
                window.location.href = '../index.html';
            }
        });
}