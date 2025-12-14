/**
 * KASIR TOKO KELONTONG - VERSION 2.0
 * Fitur Lengkap: CRUD Barang + Manajemen Produk
 */

// ===================== DATA BARANG =====================
let products = [
    {
        id: 1,
        name: "Beras Premium",
        unit: "kg",
        category: "Sembako",
        price_ecer: 12000,
        price_grosir: 11000,
        stock: 50,
        barcode: "BRG001",
        created_at: "2024-01-01",
        updated_at: "2024-01-01"
    },
    {
        id: 2,
        name: "Minyak Goreng",
        unit: "liter",
        category: "Sembako",
        price_ecer: 25000,
        price_grosir: 23000,
        stock: 30,
        barcode: "BRG002",
        created_at: "2024-01-01",
        updated_at: "2024-01-01"
    },
    {
        id: 3,
        name: "Gula Pasir",
        unit: "kg",
        category: "Sembako",
        price_ecer: 15000,
        price_grosir: 14000,
        stock: 40,
        barcode: "BRG003",
        created_at: "2024-01-01",
        updated_at: "2024-01-01"
    },
    {
        id: 4,
        name: "Telur Ayam",
        unit: "kg",
        category: "Sembako",
        price_ecer: 28000,
        price_grosir: 26000,
        stock: 20,
        barcode: "BRG004",
        created_at: "2024-01-01",
        updated_at: "2024-01-01"
    },
    {
        id: 5,
        name: "Mie Instan",
        unit: "bungkus",
        category: "Makanan",
        price_ecer: 3000,
        price_grosir: 2700,
        stock: 100,
        barcode: "BRG005",
        created_at: "2024-01-01",
        updated_at: "2024-01-01"
    },
    {
        id: 6,
        name: "Kopi Sachet",
        unit: "sachet",
        category: "Minuman",
        price_ecer: 1500,
        price_grosir: 1300,
        stock: 200,
        barcode: "BRG006",
        created_at: "2024-01-01",
        updated_at: "2024-01-01"
    },
    {
        id: 7,
        name: "Sabun Mandi",
        unit: "batang",
        category: "Kebersihan",
        price_ecer: 5000,
        price_grosir: 4500,
        stock: 60,
        barcode: "BRG007",
        created_at: "2024-01-01",
        updated_at: "2024-01-01"
    },
    {
        id: 8,
        name: "Shampoo",
        unit: "sachet",
        category: "Kebersihan",
        price_ecer: 2000,
        price_grosir: 1800,
        stock: 150,
        barcode: "BRG008",
        created_at: "2024-01-01",
        updated_at: "2024-01-01"
    },
    {
        id: 9,
        name: "Pensil",
        unit: "pcs",
        category: "Alat Tulis",
        price_ecer: 2500,
        price_grosir: 2200,
        stock: 80,
        barcode: "BRG009",
        created_at: "2024-01-01",
        updated_at: "2024-01-01"
    },
    {
        id: 10,
        name: "Baterai AA",
        unit: "pcs",
        category: "Elektronik",
        price_ecer: 8000,
        price_grosir: 7500,
        stock: 40,
        barcode: "BRG010",
        created_at: "2024-01-01",
        updated_at: "2024-01-01"
    }
];

// ===================== VARIABEL GLOBAL =====================
let currentMode = 'ecer';
let selectedProduct = null;
let cart = [];
let transactionHistory = [];
let itemToDelete = null;
let editMode = false;

// ===================== INISIALISASI =====================
document.addEventListener('DOMContentLoaded', function() {
    loadFromLocalStorage();
    initializeUI();
    updateDateTime();
    displayProducts();
    updateCartDisplay();
    
    // Setup form submission
    document.getElementById('product-form').addEventListener('submit', function(e) {
        e.preventDefault();
        saveProduct();
    });
    
    // Auto-save setiap 30 detik
    setInterval(saveToLocalStorage, 30000);
});

// ===================== FUNGSI UI =====================
function initializeUI() {
    // Mode penjualan buttons
    document.getElementById('ecer-btn').addEventListener('click', () => setSellingMode('ecer'));
    document.getElementById('grosir-btn').addEventListener('click', () => setSellingMode('grosir'));
    
    // Quantity input validation
    document.getElementById('quantity').addEventListener('input', function() {
        if (this.value < 0.1) this.value = 0.1;
        calculateItemTotal();
    });
    
    // Cash paid input
    document.getElementById('cash-paid').addEventListener('input', calculateChange);
    
    updateTransactionCount();
}

function updateDateTime() {
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const timeStr = now.toLocaleTimeString('id-ID');
    
    document.getElementById('current-date-time').textContent = `${dateStr} | ${timeStr}`;
    setTimeout(updateDateTime, 1000);
}

function setSellingMode(mode) {
    currentMode = mode;
    document.getElementById('ecer-btn').classList.toggle('active', mode === 'ecer');
    document.getElementById('grosir-btn').classList.toggle('active', mode === 'grosir');
    document.getElementById('current-mode').textContent = mode === 'ecer' ? 'Ecer' : 'Grosir';
    document.getElementById('price-type').textContent = mode === 'ecer' ? 'Harga Ecer' : 'Harga Grosir';
    
    if (selectedProduct) updateSelectedProductPrice();
    displayProducts();
}

// ===================== FUNGSI BARANG - TAMPILKAN =====================
function displayProducts(filter = '') {
    const productList = document.getElementById('product-list');
    productList.innerHTML = '';
    
    const filteredProducts = products.filter(product => 
        product.name.toLowerCase().includes(filter.toLowerCase()) ||
        product.category.toLowerCase().includes(filter.toLowerCase()) ||
        (product.barcode && product.barcode.toLowerCase().includes(filter.toLowerCase()))
    );
    
    filteredProducts.forEach(product => {
        const price = currentMode === 'ecer' ? product.price_ecer : product.price_grosir;
        const isSelected = selectedProduct && selectedProduct.id === product.id;
        const stockClass = product.stock <= 10 ? 'stock-low' : 'stock-ok';
        
        const productDiv = document.createElement('div');
        productDiv.className = `product-item ${isSelected ? 'selected' : ''}`;
        productDiv.innerHTML = `
            <div style="flex: 1;">
                <div class="product-name">${product.name}</div>
                <div class="product-stock ${stockClass}">
                    ${product.stock ? `Stok: ${product.stock} ${product.unit}` : 'Tanpa stok'}
                </div>
            </div>
            <div style="text-align: right;">
                <div class="product-price">Rp ${price.toLocaleString('id-ID')}/${product.unit}</div>
                <small style="color: #666; font-size: 0.8rem;">${product.category}</small>
            </div>
        `;
        
        productDiv.addEventListener('click', () => selectProduct(product));
        productDiv.addEventListener('dblclick', () => editProduct(product.id));
        
        productList.appendChild(productDiv);
    });
    
    document.getElementById('product-count').textContent = products.length;
}

function searchProducts() {
    const searchTerm = document.getElementById('search-input').value;
    displayProducts(searchTerm);
}

function clearSearch() {
    document.getElementById('search-input').value = '';
    displayProducts();
}

function selectProduct(product) {
    selectedProduct = product;
    document.getElementById('selected-product').value = product.name;
    document.getElementById('unit-display').textContent = product.unit;
    document.getElementById('quantity').value = '1';
    updateSelectedProductPrice();
    
    document.querySelectorAll('.product-item').forEach(item => {
        item.classList.remove('selected');
    });
    event.currentTarget.classList.add('selected');
}

function updateSelectedProductPrice() {
    if (!selectedProduct) return;
    const price = currentMode === 'ecer' ? selectedProduct.price_ecer : selectedProduct.price_grosir;
    document.getElementById('unit-price').textContent = `Rp ${price.toLocaleString('id-ID')}`;
    calculateItemTotal();
}

function calculateItemTotal() {
    if (!selectedProduct) return;
    const quantity = parseFloat(document.getElementById('quantity').value) || 0;
    const price = currentMode === 'ecer' ? selectedProduct.price_ecer : selectedProduct.price_grosir;
    const total = quantity * price;
    document.getElementById('item-total').textContent = `Rp ${total.toLocaleString('id-ID')}`;
}

// ===================== FUNGSI BARANG - CRUD =====================
function openAddProductForm(product = null) {
    editMode = product !== null;
    document.getElementById('modal-title').textContent = editMode ? 'Edit Barang' : 'Tambah Barang Baru';
    
    const form = document.getElementById('product-form');
    form.reset();
    
    if (product) {
        // Edit mode - isi form dengan data barang
        document.getElementById('product-id').value = product.id;
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-unit').value = product.unit;
        document.getElementById('product-category').value = product.category;
        document.getElementById('price-ecer').value = product.price_ecer;
        document.getElementById('price-grosir').value = product.price_grosir;
        document.getElementById('product-stock').value = product.stock || '';
        document.getElementById('product-barcode').value = product.barcode || '';
    } else {
        // Add mode - kosongkan form
        document.getElementById('product-id').value = '';
        document.getElementById('product-stock').value = '';
        document.getElementById('product-barcode').value = '';
    }
    
    document.getElementById('product-modal').style.display = 'block';
}

function closeProductModal() {
    document.getElementById('product-modal').style.display = 'none';
    editMode = false;
}

function saveProduct() {
    const id = document.getElementById('product-id').value;
    const name = document.getElementById('product-name').value.trim();
    const unit = document.getElementById('product-unit').value;
    const category = document.getElementById('product-category').value;
    const price_ecer = parseFloat(document.getElementById('price-ecer').value);
    const price_grosir = parseFloat(document.getElementById('price-grosir').value);
    const stock = document.getElementById('product-stock').value ? 
                  parseInt(document.getElementById('product-stock').value) : null;
    const barcode = document.getElementById('product-barcode').value.trim();
    
    // Validasi
    if (!name || !unit || !category || !price_ecer || !price_grosir) {
        alert('Harap isi semua field yang wajib diisi!');
        return;
    }
    
    if (price_ecer <= 0 || price_grosir <= 0) {
        alert('Harga harus lebih dari 0!');
        return;
    }
    
    if (price_grosir > price_ecer) {
        alert('Harga grosir harus lebih murah dari harga ecer!');
        return;
    }
    
    const now = new Date().toISOString().split('T')[0];
    
    if (editMode && id) {
        // Edit barang yang ada
        const index = products.findIndex(p => p.id == id);
        if (index !== -1) {
            products[index] = {
                ...products[index],
                name,
                unit,
                category,
                price_ecer,
                price_grosir,
                stock,
                barcode: barcode || products[index].barcode,
                updated_at: now
            };
            
            alert(`Barang "${name}" berhasil diperbarui!`);
        }
    } else {
        // Tambah barang baru
        const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
        const newProduct = {
            id: newId,
            name,
            unit,
            category,
            price_ecer,
            price_grosir,
            stock,
            barcode: barcode || '',
            created_at: now,
            updated_at: now
        };
        
        products.push(newProduct);
        alert(`Barang "${name}" berhasil ditambahkan!`);
    }
    
    closeProductModal();
    displayProducts();
    updateManagerTable();
    saveToLocalStorage();
}

function editProduct(id) {
    const product = products.find(p => p.id == id);
    if (product) {
        openAddProductForm(product);
    }
}

function deleteProduct(id) {
    const product = products.find(p => p.id == id);
    if (!product) return;
    
    itemToDelete = id;
    document.getElementById('confirm-message').textContent = 
        `Apakah Anda yakin ingin menghapus "${product.name}"?`;
    document.getElementById('confirm-modal').style.display = 'block';
}

function confirmDelete() {
    if (itemToDelete !== null) {
        const product = products.find(p => p.id == itemToDelete);
        products = products.filter(p => p.id !== itemToDelete);
        
        // Jika barang yang dihapus sedang dipilih, reset selection
        if (selectedProduct && selectedProduct.id === itemToDelete) {
            selectedProduct = null;
            document.getElementById('selected-product').value = '';
            document.getElementById('item-total').textContent = '0';
        }
        
        alert(`Barang "${product.name}" berhasil dihapus!`);
        closeConfirmModal();
        displayProducts();
        updateManagerTable();
        saveToLocalStorage();
    }
}

function closeConfirmModal() {
    document.getElementById('confirm-modal').style.display = 'none';
    itemToDelete = null;
}

// ===================== FUNGSI KERANJANG =====================
function addToCart() {
    if (!selectedProduct) {
        alert('Silakan pilih barang terlebih dahulu!');
        return;
    }
    
    const quantity = parseFloat(document.getElementById('quantity').value) || 0;
    if (quantity <= 0) {
        alert('Jumlah barang harus lebih dari 0!');
        return;
    }
    
    // Cek stok jika ada
    if (selectedProduct.stock !== null && quantity > selectedProduct.stock) {
        alert(`Stok tidak cukup! Stok tersedia: ${selectedProduct.stock} ${selectedProduct.unit}`);
        return;
    }
    
    const price = currentMode === 'ecer' ? selectedProduct.price_ecer : selectedProduct.price_grosir;
    const existingItemIndex = cart.findIndex(item => 
        item.id === selectedProduct.id && item.mode === currentMode
    );
    
    if (existingItemIndex !== -1) {
        cart[existingItemIndex].quantity += quantity;
        cart[existingItemIndex].total = cart[existingItemIndex].quantity * price;
    } else {
        cart.push({
            id: selectedProduct.id,
            name: selectedProduct.name,
            unit: selectedProduct.unit,
            price: price,
            quantity: quantity,
            total: quantity * price,
            mode: currentMode
        });
    }
    
    // Kurangi stok jika ada
    if (selectedProduct.stock !== null) {
        const productIndex = products.findIndex(p => p.id === selectedProduct.id);
        if (productIndex !== -1) {
            products[productIndex].stock -= quantity;
            if (products[productIndex].stock < 0) products[productIndex].stock = 0;
        }
    }
    
    updateCartDisplay();
    clearInput();
    saveToLocalStorage();
}

function updateCartDisplay() {
    const cartItems = document.getElementById('cart-items');
    cartItems.innerHTML = '';
    
    let subtotal = 0;
    
    cart.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.name}<br><small>(${item.mode.toUpperCase()})</small></td>
            <td>
                <div class="qty-control">
                    <button class="qty-btn" onclick="updateCartQuantity(${index}, -0.1)">-</button>
                    <span>${item.quantity} ${item.unit}</span>
                    <button class="qty-btn" onclick="updateCartQuantity(${index}, 0.1)">+</button>
                </div>
            </td>
            <td>Rp ${item.price.toLocaleString('id-ID')}</td>
            <td>Rp ${item.total.toLocaleString('id-ID')}</td>
            <td><button class="remove-btn" onclick="removeFromCart(${index})">Hapus</button></td>
        `;
        
        cartItems.appendChild(row);
        subtotal += item.total;
    });
    
    document.getElementById('cart-count').textContent = cart.length;
    document.getElementById('subtotal').textContent = `Rp ${subtotal.toLocaleString('id-ID')}`;
    
    const discount = calculateDiscount(subtotal);
    document.getElementById('discount').textContent = `Rp ${discount.toLocaleString('id-ID')}`;
    
    const grandTotal = subtotal - discount;
    document.getElementById('grand-total').innerHTML = `<strong>Rp ${grandTotal.toLocaleString('id-ID')}</strong>`;
    
    calculateChange();
}

function calculateDiscount(subtotal) {
    return (currentMode === 'grosir' && subtotal > 100000) ? subtotal * 0.05 : 0;
}

function updateCartQuantity(index, change) {
    if (cart[index]) {
        const oldQuantity = cart[index].quantity;
        cart[index].quantity += change;
        
        if (cart[index].quantity <= 0) {
            cart.splice(index, 1);
        } else {
            cart[index].total = cart[index].quantity * cart[index].price;
        }
        
        // Update stok di data produk
        const productIndex = products.findIndex(p => p.id === cart[index]?.id);
        if (productIndex !== -1 && products[productIndex].stock !== null) {
            products[productIndex].stock += (oldQuantity - cart[index].quantity);
            if (products[productIndex].stock < 0) products[productIndex].stock = 0;
        }
        
        updateCartDisplay();
        displayProducts(); // Refresh display stok
    }
}

function removeFromCart(index) {
    if (confirm('Hapus barang ini dari keranjang?')) {
        // Kembalikan stok
        const productIndex = products.findIndex(p => p.id === cart[index].id);
        if (productIndex !== -1 && products[productIndex].stock !== null) {
            products[productIndex].stock += cart[index].quantity;
        }
        
        cart.splice(index, 1);
        updateCartDisplay();
        displayProducts(); // Refresh display stok
    }
}

function clearInput() {
    document.getElementById('quantity').value = '1';
    document.getElementById('item-total').textContent = '0';
    if (selectedProduct) calculateItemTotal();
}

// ===================== FUNGSI PEMBAYARAN =====================
function calculateChange() {
    const cashPaid = parseFloat(document.getElementById('cash-paid').value) || 0;
    const grandTotalText = document.getElementById('grand-total').textContent;
    const grandTotal = parseFloat(grandTotalText.replace(/[^\d]/g, '')) || 0;
    const change = cashPaid - grandTotal;
    document.getElementById('change-amount').textContent = 
        `Rp ${change >= 0 ? change.toLocaleString('id-ID') : '0'}`;
}

function processPayment() {
    if (cart.length === 0) {
        alert('Keranjang belanja kosong!');
        return;
    }
    
    const cashPaid = parseFloat(document.getElementById('cash-paid').value) || 0;
    const grandTotalText = document.getElementById('grand-total').textContent;
    const grandTotal = parseFloat(grandTotalText.replace(/[^\d]/g, '')) || 0;
    
    if (cashPaid < grandTotal) {
        alert(`Uang kurang! Masih kurang: Rp ${(grandTotal - cashPaid).toLocaleString('id-ID')}`);
        return;
    }
    
    const change = cashPaid - grandTotal;
    saveTransactionToHistory(grandTotal);
    showReceipt(cashPaid, change);
    
    setTimeout(() => {
        if (confirm('Transaksi berhasil! Lakukan transaksi baru?')) {
            newTransaction();
        }
    }, 1000);
}

function saveTransactionToHistory(total) {
    const transaction = {
        id: Date.now(),
        date: new Date().toISOString(),
        items: [...cart],
        total: total,
        mode: currentMode
    };
    
    transactionHistory.push(transaction);
    updateTransactionCount();
    saveToLocalStorage();
}

function updateTransactionCount() {
    const count = transactionHistory.length;
    document.getElementById('transaction-count').textContent = count;
    localStorage.setItem('transactionCount', count);
}

// ===================== FUNGSI NOTA/CETAK =====================
function showReceipt(cashPaid, change) {
    const receiptContent = document.getElementById('receipt-content');
    const now = new Date();
    
    let receiptHTML = `
        <div class="receipt">
            <div class="receipt-header">
                <h2>TOKO KELONTONG PURWANTO</h2>
                <p>Jl. Raya No. 123, Kota</p>
                <p>Telp: 0812-3456-7890</p>
                <hr>
                <p>Tanggal: ${now.toLocaleDateString('id-ID')}</p>
                <p>Jam: ${now.toLocaleTimeString('id-ID')}</p>
                <p>Kasir: ${document.getElementById('kasir-name').textContent}</p>
                <p>No. Trans: ${String(transactionHistory.length).padStart(6, '0')}</p>
                <hr>
            </div>
            
            <div class="receipt-items">
    `;
    
    cart.forEach((item) => {
        receiptHTML += `
            <div class="receipt-item">
                <div style="flex: 1;">
                    ${item.name}<br>
                    <small>${item.quantity} ${item.unit} x Rp ${item.price.toLocaleString('id-ID')}</small>
                </div>
                <div>Rp ${item.total.toLocaleString('id-ID')}</div>
            </div>
        `;
    });
    
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    const discount = calculateDiscount(subtotal);
    const grandTotal = subtotal - discount;
    
    receiptHTML += `
            </div>
            
            <div class="receipt-totals">
                <hr>
                <div class="receipt-total-row">
                    <span>Subtotal:</span>
                    <span>Rp ${subtotal.toLocaleString('id-ID')}</span>
                </div>
                <div class="receipt-total-row">
                    <span>Diskon:</span>
                    <span>Rp ${discount.toLocaleString('id-ID')}</span>
                </div>
                <div class="receipt-total-row">
                    <span><strong>TOTAL:</strong></span>
                    <span><strong>Rp ${grandTotal.toLocaleString('id-ID')}</strong></span>
                </div>
                <div class="receipt-total-row">
                    <span>Bayar:</span>
                    <span>Rp ${cashPaid.toLocaleString('id-ID')}</span>
                </div>
                <div class="receipt-total-row">
                    <span>Kembali:</span>
                    <span>Rp ${change.toLocaleString('id-ID')}</span>
                </div>
                <hr>
            </div>
            
            <div class="receipt-footer">
                <p>Terima kasih telah berbelanja</p>
                <p>*** ${now.toLocaleDateString('id-ID')} ${now.toLocaleTimeString('id-ID')} ***</p>
            </div>
        </div>
    `;
    
    receiptContent.innerHTML = receiptHTML;
    document.getElementById('receipt-popup').style.display = 'block';
}

function printReceipt() {
    window.print();
}

function closeReceipt() {
    document.getElementById('receipt-popup').style.display = 'none';
}

function newTransaction() {
    if (cart.length > 0 && !confirm('Transaksi saat ini akan hilang. Lanjutkan?')) {
        return;
    }
    
    cart = [];
    selectedProduct = null;
    
    document.getElementById('selected-product').value = '';
    document.getElementById('quantity').value = '1';
    document.getElementById('item-total').textContent = '0';
    document.getElementById('cash-paid').value = '0';
    document.getElementById('change-amount').textContent = '0';
    document.getElementById('search-input').value = '';
    
    updateCartDisplay();
    displayProducts();
    closeReceipt();
    window.scrollTo(0, 0);
}

// ===================== FUNGSI PRODUCT MANAGER =====================
function openProductManager() {
    updateManagerTable();
    document.getElementById('manager-modal').style.display = 'block';
}

function closeManagerModal() {
    document.getElementById('manager-modal').style.display = 'none';
}

function updateManagerTable(filter = '') {
    const tableBody = document.getElementById('manager-table-body');
    tableBody.innerHTML = '';
    
    const filteredProducts = filter ? 
        products.filter(p => 
            p.name.toLowerCase().includes(filter.toLowerCase()) ||
            p.category.toLowerCase().includes(filter.toLowerCase()) ||
            p.barcode.toLowerCase().includes(filter.toLowerCase())
        ) : products;
    
    filteredProducts.forEach((product, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>${product.unit}</td>
            <td>Rp ${product.price_ecer.toLocaleString('id-ID')}</td>
            <td>Rp ${product.price_grosir.toLocaleString('id-ID')}</td>
            <td>${product.stock !== null ? product.stock : '-'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-edit" onclick="editProduct(${product.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-delete-item" onclick="deleteProduct(${product.id})">
                        <i class="fas fa-trash"></i> Hapus
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // Update summary
    document.getElementById('total-products').textContent = products.length;
    const uniqueCategories = [...new Set(products.map(p => p.category))];
    document.getElementById('total-categories').textContent = uniqueCategories.length;
}

function searchInManager() {
    const searchTerm = document.getElementById('manager-search').value;
    updateManagerTable(searchTerm);
}

function showAllProducts() {
    document.getElementById('manager-search').value = '';
    updateManagerTable();
}

function exportProducts() {
    const dataStr = JSON.stringify(products, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `data-barang-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    alert(`Data ${products.length} barang berhasil diexport!`);
}

function importProducts() {
    document.getElementById('import-file').click();
}

function handleFileImport(input) {
    const file = input.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            if (!Array.isArray(importedData)) {
                throw new Error('Format file tidak valid');
            }
            
            // Validasi data
            const isValid = importedData.every(item => 
                item.name && item.price_ecer && item.price_grosir
            );
            
            if (!isValid) {
                throw new Error('Data tidak valid');
            }
            
            if (confirm(`Import ${importedData.length} barang? Data lama akan ditimpa.`)) {
                // Update ID untuk menghindari duplikat
                const maxId = products.length > 0 ? Math.max(...products.map(p => p.id)) : 0;
                importedData.forEach((item, index) => {
                    item.id = maxId + index + 1;
                    if (!item.created_at) item.created_at = new Date().toISOString().split('T')[0];
                    if (!item.updated_at) item.updated_at = new Date().toISOString().split('T')[0];
                });
                
                products = importedData;
                displayProducts();
                updateManagerTable();
                saveToLocalStorage();
                
                alert(`Berhasil import ${importedData.length} barang!`);
            }
        } catch (error) {
            alert(`Error import data: ${error.message}`);
        }
        
        // Reset input file
        input.value = '';
    };
    
    reader.readAsText(file);
}

// ===================== LOCAL STORAGE =====================
function saveToLocalStorage() {
    try {
        localStorage.setItem('kasir_cart', JSON.stringify(cart));
        localStorage.setItem('kasir_transactions', JSON.stringify(transactionHistory));
        localStorage.setItem('kasir_mode', currentMode);
        localStorage.setItem('kasir_products', JSON.stringify(products));
        localStorage.setItem('kasir_last_save', new Date().toISOString());
    } catch (e) {
        console.log('Gagal menyimpan ke localStorage:', e);
    }
}

function loadFromLocalStorage() {
    try {
        const savedCart = localStorage.getItem('kasir_cart');
        if (savedCart) cart = JSON.parse(savedCart);
        
        const savedTransactions = localStorage.getItem('kasir_transactions');
        if (savedTransactions) transactionHistory = JSON.parse(savedTransactions);
        
        const savedMode = localStorage.getItem('kasir_mode');
        if (savedMode) currentMode = savedMode;
        
        const savedProducts = localStorage.getItem('kasir_products');
        if (savedProducts) products = JSON.parse(savedProducts);
    } catch (e) {
        console.log('Gagal load dari localStorage:', e);
    }
}