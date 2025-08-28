// Google Apps Script endpoints
const scriptURL = 'https://script.google.com/macros/s/AKfycbyJSvJg3jrRoqixLlpoP_m-3-Qd3Jh2blobCEKpNOjsa-9NFl3WgiJiCSP-Rvy89-xvgQ/exec';

// Initialize cart
let cart = [];
let products = [];
let banners = [];
let currentUser = null;
let currentSlide = 0;
let slideInterval;

// DOM Elements
const slideshowContainer = document.getElementById('slideshow');
const slideshowLoader = document.getElementById('slideshowLoader');
const productsContainer = document.getElementById('productsContainer');
const productsLoader = document.getElementById('productsLoader');
const cartCount = document.getElementById('cartCount');
const cartItems = document.getElementById('cartItems');
const cartTotal = document.getElementById('cartTotal');
const cartModal = document.getElementById('cartModal');
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const addressModal = document.getElementById('addressModal');
const notification = document.getElementById('notification');
const userBtn = document.getElementById('userBtn');
const userText = document.getElementById('userText');

// Function to convert Google Drive share URL to direct image URL
function convertGoogleDriveUrl(url) {
    if (!url) return 'https://via.placeholder.com/300x200?text=No+Image';
    
    // If it's already a direct link
    if (url.includes('uc?id=') || url.includes('uc?export=view')) {
        return url;
    }
    
    // If it's a share link
    if (url.includes('drive.google.com/file/d/')) {
        const match = url.match(/\/d\/([^\/]+)/);
        if (match && match[1]) {
            return `https://drive.google.com/uc?export=view&id=${match[1]}`;
        }
    }
    
    // If it's a share link with open?id format
    if (url.includes('open?id=')) {
        const match = url.match(/open\?id=([^&]+)/);
        if (match && match[1]) {
            return `https://drive.google.com/uc?export=view&id=${match[1]}`;
        }
    }
    
    // If it's a shortened URL
    if (url.includes('drive.google.com/open?id=')) {
        const match = url.match(/open\?id=([^&]+)/);
        if (match && match[1]) {
            return `https://drive.google.com/uc?export=view&id=${match[1]}`;
        }
    }
    
    // Return original URL if it doesn't match Google Drive patterns
    return url;
}

// Format price with Indian Rupee symbol
function formatPrice(price) {
    return `₹${price.toFixed(2)}`;
}

// Initialize the application
function init() {
    loadBanners();
    loadProducts();
    setupEventListeners();
    checkLoginStatus();
}

// Load banners from Google Sheets
async function loadBanners() {
    try {
        showNotification('Loading banners...', 'success');
        
        const response = await fetch(`${scriptURL}?action=load&sheet=Banners`);
        const result = await response.json();
        
        if (result.result === 'success') {
            banners = result.data;
            renderSlideshow(banners);
            startSlideshow();
            showNotification('Banners loaded successfully!', 'success');
        } else {
            throw new Error(result.message || 'Failed to load banners');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error loading banners: ' + error.message, 'error');
        // Fallback to default banner
        banners = [{
            Image: 'https://drive.google.com/thumbnail?id=1UZUtFzV92YLLJJb7H13ohTWiNmQ_NefA',
            Title: 'Welcome to FOOD MART',
            Description: 'Your one-stop shop for all your grocery needs. Fresh products at affordable prices.',
            Link: '#products'
        }];
        renderSlideshow(banners);
        startSlideshow();
    } finally {
        slideshowLoader.style.display = 'none';
    }
}

// Render slideshow
function renderSlideshow(banners) {
    slideshowContainer.innerHTML = '';
    
    if (banners.length === 0) {
        // Default banner if no banners are available
        slideshowContainer.innerHTML = `
            <div class="slide active" style="background: linear-gradient(135deg, #ff7e5f, #feb47b);">
                <div class="slide-content">
                    <h2>Welcome to FOOD MART</h2>
                    <p>Your one-stop shop for all your grocery needs. Fresh products at affordable prices.</p>
                    <a href="#products" class="btn">Shop Now</a>
                </div>
            </div>
        `;
        return;
    }
    
    banners.forEach((banner, index) => {
        const image = convertGoogleDriveUrl(banner.Images || banner.images);
        const title = banner.Title || banner.title || 'Special Offer';
        const description = banner.Description || banner.description || '';
        const link = banner.Link || banner.link || '#';
        
        const slide = document.createElement('div');
        slide.className = `slide ${index === 0 ? 'active' : ''}`;
        slide.style.backgroundImage = `url('${image}')`;
        slide.innerHTML = `
            <div class="slide-content">
                <h2>${title}</h2>
                ${description ? `<p>${description}</p>` : ''}
                <a href="${link}" class="btn">Shop Now</a>
            </div>
        `;
        slideshowContainer.appendChild(slide);
    });
    
    // Add navigation dots
    if (banners.length > 1) {
        const navDots = document.createElement('div');
        navDots.className = 'slide-nav';
        
        banners.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.className = `slide-dot ${index === 0 ? 'active' : ''}`;
            dot.dataset.index = index;
            navDots.appendChild(dot);
        });
        
        slideshowContainer.appendChild(navDots);
        
        // Add navigation arrows
        const prevArrow = document.createElement('button');
        prevArrow.className = 'slide-arrow prev';
        prevArrow.innerHTML = '<i class="fas fa-chevron-left"></i>';
        slideshowContainer.appendChild(prevArrow);
        
        const nextArrow = document.createElement('button');
        nextArrow.className = 'slide-arrow next';
        nextArrow.innerHTML = '<i class="fas fa-chevron-right"></i>';
        slideshowContainer.appendChild(nextArrow);
    }
}

// Start the slideshow
function startSlideshow() {
    if (banners.length <= 1) return;
    
    clearInterval(slideInterval);
    slideInterval = setInterval(() => {
        nextSlide();
    }, 5000);
}

// Show next slide
function nextSlide() {
    currentSlide = (currentSlide + 1) % banners.length;
    showSlide(currentSlide);
}

// Show previous slide
function prevSlide() {
    currentSlide = (currentSlide - 1 + banners.length) % banners.length;
    showSlide(currentSlide);
}

// Show specific slide
function showSlide(index) {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.slide-dot');
    
    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));
    
    slides[index].classList.add('active');
    if (dots[index]) {
        dots[index].classList.add('active');
    }
    
    currentSlide = index;
}

// Load products from Google Sheets
async function loadProducts() {
    try {
        showNotification('Loading products...', 'success');
        
        const response = await fetch(`${scriptURL}?action=load&sheet=Products`);
        const result = await response.json();
        
        if (result.result === 'success') {
            products = result.data;
            renderProducts(products);
            showNotification('Products loaded successfully!', 'success');
        } else {
            throw new Error(result.message || 'Failed to load products');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error loading products: ' + error.message, 'error');
        // Fallback to empty products array
        products = [];
        renderProducts(products);
    } finally {
        productsLoader.style.display = 'none';
    }
}

// Render products to the page
function renderProducts(products) {
    productsContainer.innerHTML = '';
    
    if (products.length === 0) {
        productsContainer.innerHTML = '<p class="text-center" style="grid-column: 1 / -1; padding: 40px; text-align: center;">No products available. Please check back later.</p>';
        return;
    }
    
    products.forEach(product => {
        // Use the column names from your Google Sheet
        const name = product.Name || product.name || 'Unnamed Product';
        const price = parseFloat(product.Price || product.price || 0);
        const discount = parseFloat(product.Discount || product.discount || 0);
        const unit = product.Unit || product.unit || 'unit';
        const imageUrl = product.Image || product.image || '';
        const description = product.Description || product.description || 'No description available';
        
        // Convert Google Drive URL if needed
        const image = convertGoogleDriveUrl(imageUrl);
        const discountedPrice = price * (1 - discount / 100);
        
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <div class="product-img-container">
                <img src="${image}" alt="${name}" class="product-img" onerror="this.onerror=null; this.src='https://via.placeholder.com/300x200?text=Image+Not+Found'">
                ${discount > 0 ? `<div class="product-discount">${discount}% OFF</div>` : ''}
            </div>
            <div class="product-info">
                <h3 class="product-title">${name}</h3>
                <p class="product-desc">${description}</p>
                <div class="product-price">
                    ${discount > 0 ? `<span class="original-price">${formatPrice(price)}</span>` : ''}
                    <span class="discounted-price">${formatPrice(discountedPrice)}</span>
                    <span class="product-unit">/ ${unit}</span>
                </div>
                <div class="product-actions">
                    <div class="quantity-controls">
                        <button class="quantity-btn decrease" data-id="${name}">-</button>
                        <input type="number" class="quantity-input" data-id="${name}" value="1" min="1">
                        <button class="quantity-btn increase" data-id="${name}">+</button>
                    </div>
                    <button class="add-to-cart" data-id="${name}">
                        <i class="fas fa-cart-plus"></i> Add
                    </button>
                </div>
            </div>
        `;
        productsContainer.appendChild(productCard);
    });
}

// Set up event listeners
function setupEventListeners() {
    // Mobile menu toggle
    document.getElementById('mobileMenuBtn').addEventListener('click', () => {
        document.getElementById('navMenu').classList.toggle('show');
    });

    // Cart button
    document.getElementById('cartBtn').addEventListener('click', (e) => {
        e.preventDefault();
        if (!currentUser) {
            showNotification('Please login to view your cart', 'error');
            loginModal.style.display = 'flex';
            return;
        }
        updateCartModal();
        cartModal.style.display = 'flex';
    });

    // User button
    userBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentUser) {
            // Logout functionality
            currentUser = null;
            userText.textContent = 'Login';
            userBtn.innerHTML = '<i class="fas fa-user"></i> Login';
            showNotification('Logged out successfully', 'success');
        } else {
            // Login functionality
            loginModal.style.display = 'flex';
        }
    });

    // Close modals
    document.getElementById('closeModal').addEventListener('click', () => {
        loginModal.style.display = 'none';
    });

    document.getElementById('closeRegisterModal').addEventListener('click', () => {
        registerModal.style.display = 'none';
    });

    document.getElementById('closeAddressModal').addEventListener('click', () => {
        addressModal.style.display = 'none';
    });

    document.getElementById('closeCartModal').addEventListener('click', () => {
        cartModal.style.display = 'none';
    });

    // Toggle between login and register forms
    document.getElementById('toggleForm').addEventListener('click', (e) => {
        e.preventDefault();
        loginModal.style.display = 'none';
        registerModal.style.display = 'flex';
    });

    document.getElementById('toggleToLogin').addEventListener('click', (e) => {
        e.preventDefault();
        registerModal.style.display = 'none';
        loginModal.style.display = 'flex';
    });

    // Checkout button
    document.getElementById('checkoutBtn').addEventListener('click', () => {
        if (cart.length === 0) {
            showNotification('Your cart is empty', 'error');
            return;
        }
        
        // Show address confirmation modal
        showAddressConfirmation();
    });

    // Confirm address button
    document.getElementById('confirmAddressBtn').addEventListener('click', () => {
        processOrder();
    });

    // Auth form submission
    document.getElementById('authForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        // Simple validation
        if (email && password) {
            // In a real app, you would verify credentials with a server
            // For demo purposes, we'll just set a mock user
            currentUser = { 
                email, 
                name: email.split('@')[0],
                address: "123 User Address, City - 110001",
                phone: "9876543210"
            };
            loginModal.style.display = 'none';
            userText.textContent = currentUser.name;
            userBtn.innerHTML = '<i class="fas fa-user"></i> ' + currentUser.name;
            showNotification(`Welcome ${currentUser.name}!`, 'success');
        }
    });

    // Register form submission
    document.getElementById('registerForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('regName').value;
        const email = document.getElementById('regEmail').value;
        const phone = document.getElementById('regPhone').value;
        const address = document.getElementById('regAddress').value;
        const password = document.getElementById('regPassword').value;
        
        // Simple validation
        if (name && email && phone && address && password) {
            currentUser = { 
                email, 
                name,
                address,
                phone
            };
            registerModal.style.display = 'none';
            userText.textContent = currentUser.name;
            userBtn.innerHTML = '<i class="fas fa-user"></i> ' + currentUser.name;
            showNotification(`Account created successfully! Welcome ${currentUser.name}!`, 'success');
        }
    });

    // Toggle section visibility
    document.querySelectorAll('.section-toggle').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('data-section');
            const section = document.getElementById(sectionId);
            
            // Hide all expandable sections
            document.querySelectorAll('#about, #contact').forEach(sec => {
                if (sec.id !== sectionId) {
                    sec.style.display = 'none';
                }
            });
            
            // Toggle current section
            if (section.style.display === 'block') {
                section.style.display = 'none';
            } else {
                section.style.display = 'block';
                section.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Contact form submission
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('contactName').value;
            const email = document.getElementById('contactEmail').value;
            const message = document.getElementById('contactMessage').value;
            
            // Simple validation
            if (!name || !email || !message) {
                showNotification('Please fill all fields', 'error');
                return;
            }
            
            // In a real application, you would send this data to your server
            // For demo purposes, we'll just show a success message
            showNotification('Your message has been sent successfully! We will contact you soon.', 'success');
            
            // Reset form
            contactForm.reset();
        });
    }

    // Slideshow navigation
    document.addEventListener('click', (e) => {
        // Next arrow
        if (e.target.closest('.slide-arrow.next')) {
            nextSlide();
            startSlideshow(); // Reset the interval
        }
        
        // Previous arrow
        if (e.target.closest('.slide-arrow.prev')) {
            prevSlide();
            startSlideshow(); // Reset the interval
        }
        
        // Navigation dots
        if (e.target.classList.contains('slide-dot')) {
            const index = parseInt(e.target.dataset.index);
            showSlide(index);
            startSlideshow(); // Reset the interval
        }
        
        // Increase quantity
        if (e.target.classList.contains('increase')) {
            const input = e.target.parentElement.querySelector('.quantity-input');
            input.value = parseInt(input.value) + 1;
        }
        
        // Decrease quantity
        if (e.target.classList.contains('decrease')) {
            const input = e.target.parentElement.querySelector('.quantity-input');
            if (parseInt(input.value) > 1) {
                input.value = parseInt(input.value) - 1;
            }
        }
        
        // Add to cart
        if (e.target.classList.contains('add-to-cart')) {
            const productName = e.target.dataset.id;
            const quantityInput = document.querySelector(`.quantity-input[data-id="${productName}"]`);
            const quantity = parseInt(quantityInput.value);
            addToCart(productName, quantity);
            quantityInput.value = 1; // Reset quantity
        }
        
        // Remove item from cart
        if (e.target.classList.contains('remove-item')) {
            const productName = e.target.dataset.id;
            removeFromCart(productName);
        }
    });
}

// Add product to cart
function addToCart(productName, quantity) {
    if (!currentUser) {
        showNotification('Please login to add items to cart', 'error');
        loginModal.style.display = 'flex';
        return;
    }

    const product = products.find(p => (p.Name || p.name) === productName);
    
    if (!product) {
        showNotification('Product not found', 'error');
        return;
    }

    const existingItem = cart.find(item => item.name === productName);

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        const price = parseFloat(product.Price || product.price || 0);
        const discount = parseFloat(product.Discount || product.discount || 0);
        const image = product.Image || product.image || '';
        
        cart.push({
            name: productName,
            quantity,
            price,
            discount,
            image: convertGoogleDriveUrl(image)
        });
    }

    updateCartCount();
    showNotification(`${quantity} ${productName} added to cart`, 'success');
}

// Remove product from cart
function removeFromCart(productName) {
    cart = cart.filter(item => item.name !== productName);
    updateCartCount();
    updateCartModal();
    showNotification(`${productName} removed from cart`, 'success');
}

// Update cart count badge
function updateCartCount() {
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    cartCount.textContent = count;
}

// Update cart modal
function updateCartModal() {
    cartItems.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="text-center">Your cart is empty</p>';
        document.getElementById('checkoutBtn').disabled = true;
    } else {
        cart.forEach(item => {
            const discountedPrice = item.price * (1 - item.discount / 100);
            const itemTotal = discountedPrice * item.quantity;
            total += itemTotal;

            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <img src="${item.image}" alt="${item.name}" class="cart-item-img" onerror="this.src='https://via.placeholder.com/80x80?text=No+Image'">
                <div class="cart-item-details">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-price">${formatPrice(discountedPrice)} x ${item.quantity}</div>
                    <div class="cart-item-actions">
                        <div>${formatPrice(itemTotal)}</div>
                        <button class="remove-item" data-id="${item.name}">Remove</button>
                    </div>
                </div>
            `;
            cartItems.appendChild(cartItem);
        });
        document.getElementById('checkoutBtn').disabled = false;
    }

    cartTotal.textContent = formatPrice(total);
}

// Show address confirmation
function showAddressConfirmation() {
    if (!currentUser.address) {
        showNotification('Please add a delivery address in your profile', 'error');
        return;
    }
    
    document.getElementById('addressDetails').textContent = currentUser.address;
    addressModal.style.display = 'flex';
}

// Process order
function processOrder() {
    // Calculate total
    const total = cart.reduce((sum, item) => {
        const discountedPrice = item.price * (1 - item.discount / 100);
        return sum + (discountedPrice * item.quantity);
    }, 0);
    
    // Prepare order details
    const orderDetails = {
        user: currentUser,
        items: cart,
        total: total,
        date: new Date().toLocaleString(),
        instructions: document.getElementById('deliveryInstructions').value || 'No special instructions'
    };
    
    // In a real application, you would send this data to your server
    // which would then email the admin and generate a PDF invoice
    // For demo purposes, we'll just show a success message
    showNotification('Order placed successfully! Invoice will be sent to your email.', 'success');
    
    // Send email to admin (simulated)
    sendEmailToAdmin(orderDetails);
    
    // Clear cart
    cart = [];
    updateCartCount();
    addressModal.style.display = 'none';
    cartModal.style.display = 'none';
}

// Send email to admin (simulated)
function sendEmailToAdmin(orderDetails) {
    // In a real application, you would use a server-side API to send emails
    // This is just a simulation for demo purposes
    console.log('Sending email to admin with order details:', orderDetails);
    
    // Prepare email content
    const subject = `New Order from ${orderDetails.user.name}`;
    const body = `
        New order received:
        
        Customer: ${orderDetails.user.name}
        Email: ${orderDetails.user.email}
        Phone: ${orderDetails.user.phone}
        Address: ${orderDetails.user.address}
        Delivery Instructions: ${orderDetails.instructions}
        
        Order Details:
        ${orderDetails.items.map(item => {
            const discountedPrice = item.price * (1 - item.discount / 100);
            return `${item.name} - ${item.quantity} x ${formatPrice(discountedPrice)} = ${formatPrice(discountedPrice * item.quantity)}`;
        }).join('\n')}
        
        Total: ${formatPrice(orderDetails.total)}
        Order Date: ${orderDetails.date}
    `;
    
    // In a real application, you would use something like:
    // fetch('/send-email', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({
    //         to: 'umer0510@gmail.com',
    //         subject: subject,
    //         body: body
    //     })
    // });
    
    console.log('Email would be sent to umer0510@gmail.com');
    console.log('Subject:', subject);
    console.log('Body:', body);
}

// Show notification
function showNotification(message, type) {
    notification.textContent = message;
    notification.className = 'notification ' + type;
    
    setTimeout(() => {
        notification.className = 'notification';
    }, 3000);
}

// Check login status
function checkLoginStatus() {
    // In a real app, you would check with a server
    // For demo purposes, we'll assume user is not logged in initially
    currentUser = null;
}

// Initialize the app
init();