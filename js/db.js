/**
 * IndexedDB Database Service for ACCCA Financial Management System
 * Provides offline storage and syncing capabilities
 */

const db = {
    // Database name and version
    dbName: 'acccaFMS',
    dbVersion: 1,
    database: null,
    
    // Store names
    stores: {
        users: 'users',
        transactions: 'transactions',
        bookings: 'bookings',
        customers: 'customers',
        budgets: 'budgets',
        revenueSharing: 'revenueSharing',
        settings: 'settings',
        syncQueue: 'syncQueue'
    },
    
    /**
     * Initialize the database
     * @returns {Promise} Promise that resolves when the DB is ready
     */
    init: function() {
        return new Promise((resolve, reject) => {
            if (!window.indexedDB) {
                reject('Your browser doesn\'t support IndexedDB. Some features may not work.');
                return;
            }
            
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = (event) => {
                reject('Database error: ' + event.target.error);
            };
            
            request.onsuccess = (event) => {
                this.database = event.target.result;
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object stores with indexes
                
                // Users store
                if (!db.objectStoreNames.contains(this.stores.users)) {
                    const usersStore = db.createObjectStore(this.stores.users, {keyPath: 'username'});
                    usersStore.createIndex('email', 'email', {unique: true});
                    usersStore.createIndex('role', 'role', {unique: false});
                    
                    // Add default admin user
                    usersStore.add({
                        username: 'admin',
                        password: 'admin123', // Would be hashed in a real application
                        email: 'admin@accca.org',
                        name: 'Administrator',
                        role: 'admin',
                        lastLogin: null
                    });
                }
                
                // Transactions store
                if (!db.objectStoreNames.contains(this.stores.transactions)) {
                    const transactionsStore = db.createObjectStore(this.stores.transactions, {keyPath: 'id'});
                    transactionsStore.createIndex('type', 'type', {unique: false});
                    transactionsStore.createIndex('date', 'date', {unique: false});
                    transactionsStore.createIndex('amount', 'amount', {unique: false});
                    transactionsStore.createIndex('syncStatus', 'syncStatus', {unique: false});
                }
                
                // Bookings store
                if (!db.objectStoreNames.contains(this.stores.bookings)) {
                    const bookingsStore = db.createObjectStore(this.stores.bookings, {keyPath: 'id'});
                    bookingsStore.createIndex('customerId', 'customerId', {unique: false});
                    bookingsStore.createIndex('date', 'date', {unique: false});
                    bookingsStore.createIndex('status', 'status', {unique: false});
                    bookingsStore.createIndex('syncStatus', 'syncStatus', {unique: false});
                }
                
                // Customers store
                if (!db.objectStoreNames.contains(this.stores.customers)) {
                    const customersStore = db.createObjectStore(this.stores.customers, {keyPath: 'id'});
                    customersStore.createIndex('name', 'name', {unique: false});
                    customersStore.createIndex('email', 'email', {unique: false});
                    customersStore.createIndex('syncStatus', 'syncStatus', {unique: false});
                }
                
                // Budgets store
                if (!db.objectStoreNames.contains(this.stores.budgets)) {
                    const budgetsStore = db.createObjectStore(this.stores.budgets, {keyPath: 'id'});
                    budgetsStore.createIndex('year', 'year', {unique: false});
                    budgetsStore.createIndex('month', 'month', {unique: false});
                    budgetsStore.createIndex('category', 'category', {unique: false});
                    budgetsStore.createIndex('syncStatus', 'syncStatus', {unique: false});
                }
                
                // Revenue Sharing store
                if (!db.objectStoreNames.contains(this.stores.revenueSharing)) {
                    const revenueSharingStore = db.createObjectStore(this.stores.revenueSharing, {keyPath: 'id'});
                    revenueSharingStore.createIndex('partnerId', 'partnerId', {unique: false});
                    revenueSharingStore.createIndex('date', 'date', {unique: false});
                    revenueSharingStore.createIndex('syncStatus', 'syncStatus', {unique: false});
                }
                
                // Settings store
                if (!db.objectStoreNames.contains(this.stores.settings)) {
                    const settingsStore = db.createObjectStore(this.stores.settings, {keyPath: 'key'});
                }
                
                // Sync Queue store
                if (!db.objectStoreNames.contains(this.stores.syncQueue)) {
                    const syncQueueStore = db.createObjectStore(this.stores.syncQueue, {keyPath: 'id', autoIncrement: true});
                    syncQueueStore.createIndex('store', 'store', {unique: false});
                    syncQueueStore.createIndex('action', 'action', {unique: false});
                    syncQueueStore.createIndex('timestamp', 'timestamp', {unique: false});
                }
            };
        });
    },
    
    /**
     * Get a transaction and store
     * @param {string} storeName - Name of the store
     * @param {string} mode - Transaction mode (readonly or readwrite)
     * @returns {Object} Object with transaction and store
     */
    getTransactionAndStore: function(storeName, mode = 'readonly') {
        if (!this.database) {
            throw new Error('Database not initialized. Call init() first.');
        }
        
        const transaction = this.database.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);
        
        return { transaction, store };
    },
    
    /**
     * Add an item to a store
     * @param {string} storeName - Name of the store
     * @param {Object} item - Item to add
     * @param {boolean} addToSyncQueue - Whether to add to sync queue
     * @returns {Promise} Promise that resolves with the added item
     */
    add: function(storeName, item, addToSyncQueue = true) {
        return new Promise((resolve, reject) => {
            try {
                const { transaction, store } = this.getTransactionAndStore(storeName, 'readwrite');
                
                // Add sync status if applicable
                if ('syncStatus' in item) {
                    item.syncStatus = 'pending';
                }
                
                const request = store.add(item);
                
                request.onsuccess = () => {
                    // Add to sync queue if online and needed
                    if (addToSyncQueue && utils.isOnline() && storeName !== this.stores.syncQueue) {
                        this.addToSyncQueue(storeName, 'add', item)
                            .catch(error => console.error('Error adding to sync queue:', error));
                    }
                    
                    resolve(item);
                };
                
                request.onerror = () => {
                    reject(request.error);
                };
            } catch (error) {
                reject(error);
            }
        });
    },
    
    /**
     * Update an item in a store
     * @param {string} storeName - Name of the store
     * @param {Object} item - Item to update
     * @param {boolean} addToSyncQueue - Whether to add to sync queue
     * @returns {Promise} Promise that resolves with the updated item
     */
    update: function(storeName, item, addToSyncQueue = true) {
        return new Promise((resolve, reject) => {
            try {
                const { transaction, store } = this.getTransactionAndStore(storeName, 'readwrite');
                
                // Update sync status if applicable
                if ('syncStatus' in item) {
                    item.syncStatus = 'pending';
                }
                
                const request = store.put(item);
                
                request.onsuccess = () => {
                    // Add to sync queue if online and needed
                    if (addToSyncQueue && utils.isOnline() && storeName !== this.stores.syncQueue) {
                        this.addToSyncQueue(storeName, 'update', item)
                            .catch(error => console.error('Error adding to sync queue:', error));
                    }
                    
                    resolve(item);
                };
                
                request.onerror = () => {
                    reject(request.error);
                };
            } catch (error) {
                reject(error);
            }
        });
    },
    
    /**
     * Delete an item from a store
     * @param {string} storeName - Name of the store
     * @param {*} key - Key of the item to delete
     * @param {boolean} addToSyncQueue - Whether to add to sync queue
     * @returns {Promise} Promise that resolves when the item is deleted
     */
    delete: function(storeName, key, addToSyncQueue = true) {
        return new Promise((resolve, reject) => {
            try {
                // Get the item first for sync queue
                this.getById(storeName, key).then(item => {
                    const { transaction, store } = this.getTransactionAndStore(storeName, 'readwrite');
                    const request = store.delete(key);
                    
                    request.onsuccess = () => {
                        // Add to sync queue if online and needed
                        if (addToSyncQueue && utils.isOnline() && storeName !== this.stores.syncQueue && item) {
                            this.addToSyncQueue(storeName, 'delete', item)
                                .catch(error => console.error('Error adding to sync queue:', error));
                        }
                        
                        resolve();
                    };
                    
                    request.onerror = () => {
                        reject(request.error);
                    };
                }).catch(reject);
            } catch (error) {
                reject(error);
            }
        });
    },
    
    /**
     * Get an item by its ID
     * @param {string} storeName - Name of the store
     * @param {*} id - ID of the item
     * @returns {Promise} Promise that resolves with the item
     */
    getById: function(storeName, id) {
        return new Promise((resolve, reject) => {
            try {
                const { store } = this.getTransactionAndStore(storeName);
                const request = store.get(id);
                
                request.onsuccess = () => {
                    resolve(request.result);
                };
                
                request.onerror = () => {
                    reject(request.error);
                };
            } catch (error) {
                reject(error);
            }
        });
    },
    
    /**
     * Get all items from a store
     * @param {string} storeName - Name of the store
     * @returns {Promise} Promise that resolves with all items
     */
    getAll: function(storeName) {
        return new Promise((resolve, reject) => {
            try {
                const { store } = this.getTransactionAndStore(storeName);
                const request = store.getAll();
                
                request.onsuccess = () => {
                    resolve(request.result);
                };
                
                request.onerror = () => {
                    reject(request.error);
                };
            } catch (error) {
                reject(error);
            }
        });
    },
    
    /**
     * Get items by index
     * @param {string} storeName - Name of the store
     * @param {string} indexName - Name of the index
     * @param {*} value - Value to search for
     * @returns {Promise} Promise that resolves with matching items
     */
    getByIndex: function(storeName, indexName, value) {
        return new Promise((resolve, reject) => {
            try {
                const { store } = this.getTransactionAndStore(storeName);
                const index = store.index(indexName);
                const request = index.getAll(value);
                
                request.onsuccess = () => {
                    resolve(request.result);
                };
                
                request.onerror = () => {
                    reject(request.error);
                };
            } catch (error) {
                reject(error);
            }
        });
    },
    
    /**
     * Add an action to the sync queue
     * @param {string} store - Store name
     * @param {string} action - Action type (add, update, delete)
     * @param {Object} data - Data to sync
     * @returns {Promise} Promise that resolves when added to queue
     */
    addToSyncQueue: function(store, action, data) {
        return this.add(this.stores.syncQueue, {
            store,
            action,
            data,
            timestamp: Date.now(),
            attempts: 0
        });
    },
    
    /**
     * Process the sync queue
     * @returns {Promise} Promise that resolves when sync is complete
     */
    processSyncQueue: function() {
        // This would connect to a server API in a real application
        return new Promise((resolve, reject) => {
            if (!utils.isOnline()) {
                resolve('Offline mode, sync skipped');
                return;
            }
            
            this.getAll(this.stores.syncQueue).then(queue => {
                if (!queue || queue.length === 0) {
                    resolve('No items to sync');
                    return;
                }
                
                // For demo purposes, we'll just resolve and remove the queue items
                // In a real app, you would send these to an API endpoint
                
                const promises = queue.map(item => {
                    console.log(`Syncing: ${item.action} in ${item.store}`, item.data);
                    
                    // Update sync status of the original item if it still exists
                    if (item.action !== 'delete') {
                        this.getById(item.store, item.data.id)
                            .then(existingItem => {
                                if (existingItem) {
                                    existingItem.syncStatus = 'synced';
                                    this.update(item.store, existingItem, false)
                                        .catch(console.error);
                                }
                            })
                            .catch(console.error);
                    }
                    
                    // Remove the processed item from the queue
                    return this.delete(this.stores.syncQueue, item.id, false);
                });
                
                Promise.all(promises)
                    .then(() => resolve(`Synced ${queue.length} items`))
                    .catch(reject);
            }).catch(reject);
        });
    },
    
    /**
     * Verify a user login
     * @param {string} username - Username
     * @param {string} password - Password
     * @returns {Promise} Promise that resolves with the user if valid
     */
    verifyLogin: function(username, password) {
        return new Promise((resolve, reject) => {
            this.getById(this.stores.users, username).then(user => {
                if (!user) {
                    reject('Invalid username or password');
                    return;
                }
                
                // In a real app, you would compare hashed passwords
                if (user.password === password) {
                    // Update last login
                    user.lastLogin = new Date();
                    this.update(this.stores.users, user, false)
                        .catch(console.error);
                    
                    // Remove password from returned user
                    const { password, ...userWithoutPassword } = user;
                    resolve(userWithoutPassword);
                } else {
                    reject('Invalid username or password');
                }
            }).catch(reject);
        });
    },
    
    /**
     * Get a setting value
     * @param {string} key - Setting key
     * @param {*} defaultValue - Default value if not found
     * @returns {Promise} Promise that resolves with the setting value
     */
    getSetting: function(key, defaultValue = null) {
        return new Promise((resolve) => {
            this.getById(this.stores.settings, key)
                .then(setting => {
                    resolve(setting ? setting.value : defaultValue);
                })
                .catch(() => {
                    resolve(defaultValue);
                });
        });
    },
    
    /**
     * Set a setting value
     * @param {string} key - Setting key
     * @param {*} value - Setting value
     * @returns {Promise} Promise that resolves when setting is saved
     */
    setSetting: function(key, value) {
        return this.update(this.stores.settings, { key, value }, false);
    },
    
    /**
     * Clear all data in the database (for testing)
     * @returns {Promise} Promise that resolves when all data is cleared
     */
    clearAllData: function() {
        const promises = Object.values(this.stores).map(storeName => {
            return new Promise((resolve, reject) => {
                try {
                    const { transaction, store } = this.getTransactionAndStore(storeName, 'readwrite');
                    const request = store.clear();
                    
                    request.onsuccess = () => resolve();
                    request.onerror = () => reject(request.error);
                } catch (error) {
                    reject(error);
                }
            });
        });
        
        return Promise.all(promises);
    }
};

// Initialize the database when script loads
document.addEventListener('DOMContentLoaded', () => {
    db.init()
        .then(() => console.log('Database initialized'))
        .catch(error => console.error('Database initialization error:', error));
});