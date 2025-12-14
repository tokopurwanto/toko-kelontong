// app.js - Logika Aplikasi Kasir

// Data global
let products = [];
let transaction = [];
let selectedProductId = null;
let currentMode = 'ecer'; // 'ecer' atau 'grosir'
let pendingAction = null;

// Inisialisasi aplikasi
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Aplikasi sedang dimuat...');
    
    try {
        // Tunggu 1 detik untuk efek loading
        setTimeout(async () => {
            // Load data dari Supabase
            await loadProductsFromSupabase();
            
            // Setup UI
            setupEventListeners();
            updateDateTime();
            setInterval(updateDateTime, 1000);
            
            // Sembunyikan loading, tampilkan aplikasi
            document.getElementById('loading').style.display = 'none';
            document.querySelector('.container').style.display = 'block';
            
            console.log('Aplikasi siap digunakan');
        }, 1000);
    } catch (error) {
        console.error('Gagal memuat aplikasi:', error);
        alert('Gagal memuat aplikasi. Silakan refresh halaman.');
    }
});

// ===================== FUNGSI DATABASE SUPABASE =====================

// Load produk dari Supabase
async function loadProductsFromSupabase() {
    try {
        console.log('Memuat produk dari Supabase...');
        
        const { data, error } = await window.supabaseClient
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        products = data.map(product => ({
            id: product.id,
            code: product.code,
            name: product.name,
            price: product.retail_price, // Harga ecer
            wholesale_price: product.wholesale_price,
            stock: product.stock,
            category: product.category,
            description: product.description,
            created_at: product.created_at
        }));
        
        console.log(`Berhasil memuat ${products.length} produk`);
        renderProducts();
    } catch (error) {
        console.error('Error loading products:', error);
        // Fallback ke data lokal jika Supabase gagal
        loadSampleProducts();
    }
}

// Load data contoh jika Supabase kosong
function loadSampleProducts() {
    products = [
        { id: 1, code: 'BR001', name: 'Beras Premium (1kg)', price: 12000, wholesale_price: 11000, stock: 50, category: 'Sembako' },
        { id: 2, code: 'MG002', name: 'Minyak Goreng (2L)', price: 25000, wholesale_price: 23000, stock: 30, category: 'Sembako' },
        { id: 3, code: 'GP003', name: 'Gula Pasir (1kg)', price: 15000, wholesale_price: 14000, stock: 40, category: 'Sembako' },
        { id: 4, code: 'TA004', name: 'Telur Ayam (1kg)', price: 28000, wholesale_price: 26000, stock: 20, category: 'Sembako' },
        { id: 5, code: 'MI005', name: 'Mie Instant (1 bungkus)', price: 3000, wholesale_price: 2800, stock: 100, category: 'Makanan' },
        { id: 6, code: 'SM006', name: 'Sabun Mandi', price: 5000, wholesale_price: 4500, stock: 60, category: 'Kebersihan' }
    ];
    console.log('Menggunakan data contoh:', products.length, 'produk');
    renderProducts();
}

// Simpan transaksi ke Supabase
async function saveTransactionToSupabase() {
    try {
        const subtotal = transaction.reduce((sum, item) => sum + (getCurrentPrice(item.id) * item.quantity), 0);
        const tax = Math.floor(subtotal * 0.1);
        const total = subtotal + tax;
        const cash = parseInt(document.getElementById('cashInput').value) || 0;
        const change = cash - total;
        
        const transactionData = {
            transaction_date: new Date().toISOString(),
            subtotal: subtotal,
            tax: tax,
            total_amount: total,
            cash_given: cash,
            change_given: change,
            items: transaction.map(item => ({
                product_id: item.id,
                product_name: item.name,
                quantity: item.quantity,
                unit_price: getCurrentPrice(item.id),
                total_price: getCurrentPrice(item.id) * item.quantity
            }))
        };
        
        const { data, error } = await window.supabaseClient
            .from('transactions')
            .insert([transactionData]);
        
        if (error) throw error;
        
        // Update stok produk
        await updateProductStock();
        
        console.log('Transaksi berhasil disimpan:', data);
        return data;
    } catch (error) {
        console.error('Error saving transaction:', error);
        throw error;
    }
}

// Update stok produk setelah transaksi
async function updateProductStock() {
    for (const item of transaction) {
        const product = products.find(p => p.id === item.id);
        if (product) {
            const newStock = product.stock - item.quantity;
            
            const { error } = await window.supabaseClient
                .from('products')
                .update({ stock: newStock })
                .eq('id', item.id);
            
            if (error) {
                console.error(`Error updating stock for product ${item.id}:`, error);
            } else {
                product.stock = newStock;
            }
        }
    }
}

// CRUD Products
async function addProductToSupabase(product) {
    try {
        const { data, error } = await window.supabaseClient
            .from('products')
            .insert([{
                code: product.code,
                name: product.name,
                retail_price: product.retailPrice,
                wholesale_price: product.wholesalePrice,
                stock: product.stock,
                category: product.category,
                description: product.description
            }])
            .select();
        
        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('Error adding product:', error);
        throw error;
    }
}

async function updateProductInSupabase(id, product) {
    try {
        const { data, error } = await window.supabaseClient
            .from('products')
            .update({
                code: product.code,
                name: product.name,
                retail_price: product.retailPrice,
                wholesale_price: product.wholesalePrice,
                stock: product.stock,
                category: product.category,
                description: product.description
            })
            .eq('id', id)
            .select();
        
        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('Error updating product:', error);
        throw error;
    }
}

async function deleteProductFromSupabase(id) {
    try {
        const { error } = await window.supabaseClient
            .from('products')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting product:', error);
        throw error;
    }
}

// ===================== FUNGSI UI =====================

// Setup event listeners
function setupEventListeners() {
    // Mode penjualan
    document.getElementById('ecer-btn').addEventListener('click', () => setSellingMode('ecer'));
    document.getElementById('grosir-btn').addEventListener('click', () => setSellingMode('grosir'));
    
    // Pencarian
    document.getElementById('searchInput').addEventListener('input', (e) => renderProducts(e.target.value));
    document.getElementById('managerSearch').addEventListener('input', searchManagerProducts);
    
    // Input uang
    document.getElementById('cashInput').addEventListener('input', calculateChange);
    
    // Hotkey
    document.addEventListener('keydown', handleHotkeys);
}

// Render daftar produk
function renderProducts(filter = '') {
    const productGrid = document.getElementById('productGrid');
    productGrid.innerHTML = '';
    
    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(filter.toLowerCase()) ||
        product.code.toLowerCase().includes(filter.toLowerCase())
    );
    
    filteredProducts.forEach(product => {
        const isOutOfStock = product.stock <= 0;
        const currentPrice = getCurrentPrice(product.id);
        
        const productCard = document.createElement('div');
        productCard.className = `product-card ${selectedProductId === product.id ? 'selected' : ''} ${isOutOfStock ? 'out-of-stock' : ''}`;
        productCard.innerHTML = `
            <div class="product-name">${product.code} - ${product.name}</div>
            <div class="product-price">Rp ${currentPrice.toLocaleString()}</div>
            ${currentMode === 'ecer' && product.wholesale_price ? 
                `<div class="wholesale-price">Grosir: Rp ${product.wholesale_price.toLocaleString()}</div>` : ''}
            <div class="product-stock ${product.stock <= 10 ? 'stock-low' : 'stock-ok'}">
                Stok: ${product.stock} ${product.stock <= 10 ? ' (Hampir Habis!)' : ''}
            </div>
        `;
        
        if (!isOutOfStock) {
            productCard.onclick = () => selectProduct(product.id);
        }
        
        productGrid.appendChild(productCard);
    });
}

// Pilih produk untuk transaksi
function selectProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product || product.stock <= 0) return;
    
    selectedProductId = productId;
    renderProducts(document.getElementById('searchInput').value);
    
    // Tambahkan ke transaksi
    const existingItem = transaction.find(item => item.id === productId);
    
    if (existingItem) {
        // Cek stok
        if (existingItem.quantity >= product.stock) {
            alert(`Stok ${product.name} hanya tersedia ${product.stock} item!`);
            return;
        }
        existingItem.quantity += 1;
    } else {
        transaction.push({
            id: productId,
            name: product.name,
            quantity: 1
        });
    }
    
    updateTransactionTable();
    updatePaymentSummary();
    
    // Reset selection setelah 300ms
    setTimeout(() => {
        selectedProductId = null;
        renderProducts(document.getElementById('searchInput').value);
    }, 300);
}

// Update tabel transaksi
function updateTransactionTable() {
    const tableBody = document.getElementById('transactionTable');
    tableBody.innerHTML = '';
    
    transaction.forEach((item, index) => {
        const product = products.find(p => p.id === item.id);
        const price = getCurrentPrice(item.id);
        const total = price * item.quantity;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.name}</td>
            <td>
                <div class="qty-control">
                    <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)" ${item.quantity <= 1 ? 'disabled' : ''}>-</button>
                    <span class="qty-value">${item.quantity}</span>
                    <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)" ${item.quantity >= (product?.stock || 0) ? 'disabled' : ''}>+</button>
                </div>
            </td>
            <td class="price-display">Rp ${price.toLocaleString()}</td>
            <td class="price-display">Rp ${total.toLocaleString()}</td>
            <td><button class="remove-btn" onclick="removeItem(${item.id})"><i class="fas fa-trash"></i> Hapus</button></td>
        `;
        tableBody.appendChild(row);
    });
}

// Update kuantitas item
function updateQuantity(productId, change) {
    const item = transaction.find(item => item.id === productId);
    const product = products.find(p => p.id === productId);
    
    if (item && product) {
        const newQuantity = item.quantity + change;
        
        if (newQuantity <= 0) {
            transaction = transaction.filter(item => item.id !== productId);
        } else if (newQuantity > product.stock) {
            alert(`Stok ${product.name} hanya tersedia ${product.stock} item!`);
            return;
        } else {
            item.quantity = newQuantity;
        }
        
        updateTransactionTable();
        updatePaymentSummary();
    }
}

// Hapus item dari transaksi
function removeItem(productId) {
    transaction = transaction.filter(item => item.id !== productId);
    updateTransactionTable();
    updatePaymentSummary();
}

// Update ringkasan pembayaran
function updatePaymentSummary() {
    const subtotal = transaction.reduce((sum, item) => sum + (getCurrentPrice(item.id) * item.quantity), 0);
    const tax = Math.floor(subtotal * 0.1);
    const total = subtotal + tax;
    
    document.getElementById('subtotal').textContent = `Rp ${subtotal.toLocaleString()}`;
    document.getElementById('tax').textContent = `Rp ${tax.toLocaleString()}`;
    document.getElementById('total').textContent = `Rp ${total.toLocaleString()}`;
    
    calculateChange();
}

// Hitung kembalian
function calculateChange() {
    const cashInput = document.getElementById('cashInput');
    const changeDisplay = document.getElementById('changeDisplay');
    
    const total = parseInt(document.getElementById('total').textContent.replace(/[^\d]/g, '')) || 0;
    const cash = parseInt(cashInput.value) || 0;
    const change = cash - total;
    
    if (change >= 0) {
        changeDisplay.innerHTML = `<i class="fas fa-exchange-alt"></i> Kembalian: Rp ${change.toLocaleString()}`;
        changeDisplay.className = 'change-display';
    } else {
        changeDisplay.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Kurang: Rp ${Math.abs(change).toLocaleString()}`;
        changeDisplay.className = 'change-display negative';
    }
}

// Proses pembayaran
async function processPayment() {
    try {
        const cashInput = document.getElementById('cashInput');
        const total = parseInt(document.getElementById('total').textContent.replace(/[^\d]/g, '')) || 0;
        const cash = parseInt(cashInput.value) || 0;
        
        if (transaction.length === 0) {
            alert('Silakan tambahkan barang terlebih dahulu!');
            return;
        }
        
        if (cash < total) {
            alert('Uang yang diberikan kurang!');
            return;
        }
        
        // Simpan transaksi ke database
        await saveTransactionToSupabase();
        
        const change = cash - total;
        
        // Tampilkan struk
        openReceiptModal();
        
        // Reset transaksi
        setTimeout(() => {
            resetTransaction();
            loadProductsFromSupabase(); // Reload stok terbaru
        }, 3000);
        
    } catch (error) {
        console.error('Error processing payment:', error);
        alert('Gagal memproses pembayaran. Silakan coba lagi.');
    }
}

// Reset transaksi
function resetTransaction() {
    transaction = [];
    document.getElementById('cashInput').value = '';
    updateTransactionTable();
    updatePaymentSummary();
    renderProducts(document.getElementById('searchInput').value);
}

// ===================== MODE PENJUALAN =====================

// Set mode penjualan
function setSellingMode(mode) {
    currentMode = mode;
    
    const ecerBtn = document.getElementById('ecer-btn');
    const grosirBtn = document.getElementById('grosir-btn');
    const currentModeSpan = document.getElementById('current-mode');
    const priceTypeSpan = document.getElementById('price-type');
    
    if (mode === 'ecer') {
        ecerBtn.classList.add('active');
        grosirBtn.classList.remove('active');
        currentModeSpan.textContent = 'Ecer';
        priceTypeSpan.textContent = 'Harga Ecer';
    } else {
        ecerBtn.classList.remove('active');
        grosirBtn.classList.add('active');
        currentModeSpan.textContent = 'Grosir';
        priceTypeSpan.textContent = 'Harga Grosir';
    }
    
    renderProducts(document.getElementById('searchInput').value);
    updateTransactionTable();
    updatePaymentSummary();
}

// Dapatkan harga berdasarkan mode
function getCurrentPrice(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return 0;
    
    return currentMode === 'grosir' && product.wholesale_price 
        ? product.wholesale_price 
        : product.price;
}

// ===================== PRODUCT MANAGER =====================

// Buka modal manager produk
async function openProductManager() {
    await loadManagerProducts();
    document.getElementById('productManagerModal').style.display = 'block';
}

// Tutup modal manager produk
function closeProductManager() {
    document.getElementById('productManagerModal').style.display = 'none';
    hideProductForm();
}

// Load produk untuk manager
async function loadManagerProducts(filter = '') {
    try {
        let query = window.supabaseClient
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (filter) {
            query = query.or(`name.ilike.%${filter}%,code.ilike.%${filter}%,category.ilike.%${filter}%`);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        const managerTable = document.getElementById('managerTable');
        managerTable.innerHTML = '';
        
        let totalStock = 0;
        
        data.forEach((product, index) => {
            totalStock += product.stock;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product.code}</td>
                <td>${product.name}</td>
                <td>Rp ${product.retail_price.toLocaleString()}</td>
                <td>Rp ${product.wholesale_price.toLocaleString()}</td>
                <td class="${product.stock <= 10 ? 'stock-low' : 'stock-ok'}">${product.stock}</td>
                <td>${product.category}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-edit" onclick="editProduct(${product.id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn-delete-item" onclick="showDeleteConfirmation(${product.id}, '${product.name}')">
                            <i class="fas fa-trash"></i> Hapus
                        </button>
                    </div>
                </td>
            `;
            managerTable.appendChild(row);
        });
        
        document.getElementById('productCount').textContent = data.length;
        document.getElementById('totalStock').textContent = totalStock;
        
    } catch (error) {
        console.error('Error loading manager products:', error);
        alert('Gagal memuat data produk');
    }
}

// Cari produk di manager
function searchManagerProducts() {
    const searchTerm = document.getElementById('managerSearch').value;
    loadManagerProducts(searchTerm);
}

// Tampilkan form tambah produk
function showAddProductForm() {
    document.getElementById('productForm').style.display = 'block';
    document.getElementById('editProductId').value = '';
    
    // Reset form
    document.getElementById('productCode').value = '';
    document.getElementById('productName').value = '';
    document.getElementById('retailPrice').value = '';
    document.getElementById('wholesalePrice').value = '';
    document.getElementById('stock').value = '';
    document.getElementById('category').value = 'Makanan';
    document.getElementById('description').value = '';
    
    // Fokus ke input pertama
    document.getElementById('productCode').focus();
}

// Sembunyikan form produk
function hideProductForm() {
    document.getElementById('productForm').style.display = 'none';
}

// Batal edit/tambah produk
function cancelProductForm() {
    hideProductForm();
}

// Edit produk
async function editProduct(productId) {
    try {
        const { data, error } = await window.supabaseClient
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();
        
        if (error) throw error;
        
        document.getElementById('productForm').style.display = 'block';
        document.getElementById('editProductId').value = data.id;
        document.getElementById('productCode').value = data.code;
        document.getElementById('productName').value = data.name;
        document.getElementById('retailPrice').value = data.retail_price;
        document.getElementById('wholesalePrice').value = data.wholesale_price;
        document.getElementById('stock').value = data.stock;
        document.getElementById('category').value = data.category;
        document.getElementById('description').value = data.description || '';
        
        document.getElementById('productCode').focus();
    } catch (error) {
        console.error('Error loading product for edit:', error);
        alert('Gagal memuat data produk untuk edit');
    }
}

// Simpan produk (tambah/edit)
async function saveProduct() {
    try {
        const productId = document.getElementById('editProductId').value;
        const productData = {
            code: document.getElementById('productCode').value.trim(),
            name: document.getElementById('productName').value.trim(),
            retailPrice: parseInt(document.getElementById('retailPrice').value),
            wholesalePrice: parseInt(document.getElementById('wholesalePrice').value),
            stock: parseInt(document.getElementById('stock').value),
            category: document.getElementById('category').value,
            description: document.getElementById('description').value.trim()
        };
        
        // Validasi
        if (!productData.code || !productData.name || !productData.retailPrice || !productData.wholesalePrice || isNaN(productData.stock)) {
            alert('Harap isi semua field yang wajib diisi!');
            return;
        }
        
        if (productId) {
            // Update produk
            await updateProductInSupabase(productId, productData);
            alert('Produk berhasil diperbarui!');
        } else {
            // Tambah produk baru
            await addProductToSupabase(productData);
            alert('Produk berhasil ditambahkan!');
        }
        
        // Reload data
        await loadProductsFromSupabase();
        await loadManagerProducts();
        hideProductForm();
        
    } catch (error) {
        console.error('Error saving product:', error);
        alert('Gagal menyimpan produk: ' + error.message);
    }
}

// Tampilkan konfirmasi hapus
function showDeleteConfirmation(productId, productName) {
    pendingAction = {
        type: 'delete',
        productId: productId
    };
    
    document.getElementById('confirmTitle').textContent = 'Konfirmasi Hapus';
    document.getElementById('confirmMessage').textContent = `Apakah Anda yakin ingin menghapus produk "${productName}"?`;
    document.getElementById('confirmModal').style.display = 'block';
}

// Konfirmasi aksi
async function confirmAction(confirmed) {
    const modal = document.getElementById('confirmModal');
    modal.style.display = 'none';
    
    if (!confirmed || !pendingAction) return;
    
    try {
        if (pendingAction.type === 'delete') {
            await deleteProductFromSupabase(pendingAction.productId);
            alert('Produk berhasil dihapus!');
            
            // Reload data
            await loadProductsFromSupabase();
            await loadManagerProducts();
        }
    } catch (error) {
        console.error('Error performing action:', error);
        alert('Gagal melakukan aksi: ' + error.message);
    }
    
    pendingAction = null;
}

// Export data produk
function exportProducts() {
    const dataStr = JSON.stringify(products, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `produk-toko-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

// Import data produk
function importProducts() {
    alert('Fitur import akan segera tersedia!');
}

// ===================== STRUK =====================

// Buka modal struk
function openReceiptModal() {
    const receiptContent = document.getElementById('receipt-content');
    const subtotal = transaction.reduce((sum, item) => sum + (getCurrentPrice(item.id) * item.quantity), 0);
    const tax = Math.floor(subtotal * 0.1);
    const total = subtotal + tax;
    const cash = parseInt(document.getElementById('cashInput').value) || 0;
    const change = cash - total;
    
    const now = new Date();
    const receiptId = 'TRX-' + now.getTime().toString().slice(-8);
    
    receiptContent.innerHTML = `
        <div class="receipt-header">
            <h2>TOKO KELONTONG PURWANTO</h2>
            <p>Jl. Contoh No. 123, Kota Contoh</p>
            <p>Telp: 0812-3456-7890</p>
            <hr>
            <p>No: ${receiptId}</p>
            <p>Tanggal: ${now.toLocaleDateString('id-ID')} ${now.toLocaleTimeString('id-ID')}</p>
            <p>Kasir: Admin</p>
            <p>Mode: ${currentMode === 'ecer' ? 'Ecer' : 'Grosir'}</p>
        </div>
        
        <table class="receipt-items">
            <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Harga</th>
                <th>Total</th>
            </tr>
            ${transaction.map(item => {
                const price = getCurrentPrice(item.id);
                const itemTotal = price * item.quantity;
                return `
                    <tr>
                        <td>${item.name}</td>
                        <td align="center">${item.quantity}</td>
                        <td align="right">${price.toLocaleString()}</td>
                        <td align="right">${itemTotal.toLocaleString()}</td>
                    </tr>
                `;
            }).join('')}
        </table>
        
        <div class="receipt-total">
            <p>Subtotal: Rp ${subtotal.toLocaleString()}</p>
            <p>Pajak (10%): Rp ${tax.toLocaleString()}</p>
            <p><strong>TOTAL: Rp ${total.toLocaleString()}</strong></p>
            <p>TUNAI: Rp ${cash.toLocaleString()}</p>
            <p>KEMBALI: Rp ${change.toLocaleString()}</p>
        </div>
        
        <div class="receipt-footer">
            <p>Terima kasih atas kunjungan Anda</p>
            <p>Barang yang sudah dibeli tidak dapat ditukar/dikembalikan</p>
            <p>*** ${receiptId} ***</p>
        </div>
    `;
    
    document.getElementById('receiptModal').style.display = 'block';
}

// Tutup modal struk
function closeReceiptModal() {
    document.getElementById('receiptModal').style.display = 'none';
}

// Cetak struk
function printReceipt() {
    window.print();
}

// ===================== UTILITY FUNCTIONS =====================

// Update waktu real-time
function updateDateTime() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = now.toLocaleDateString('id-ID', options);
    document.getElementById('currentTime').textContent = now.toLocaleTimeString('id-ID');
}

// Clear search
function clearSearch() {
    document.getElementById('searchInput').value = '';
    renderProducts();
}

// Handle hotkeys
function handleHotkeys(e) {
    // ESC untuk keluar dari modal
    if (e.key === 'Escape') {
        closeProductManager();
        closeReceiptModal();
        const confirmModal = document.getElementById('confirmModal');
        if (confirmModal.style.display === 'block') {
            confirmModal.style.display = 'none';
        }
    }
    
    // Ctrl+F untuk fokus ke search
    if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        document.getElementById('searchInput').focus();
    }
    
    // Ctrl+P untuk proses pembayaran
    if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        processPayment();
    }
    
    // Ctrl+R untuk reset transaksi
    if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        resetTransaction();
    }
}