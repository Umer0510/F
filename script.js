
 // Initialize EmailJS
        (function() {
            emailjs.init("2knfj1vhtQ6isPTXh");
        })();

const scriptURL = 'https://script.google.com/macros/s/AKfycbyJSvJg3jrRoqixLlpoP_m-3-Qd3Jh2blobCEKpNOjsa-9NFl3WgiJiCSP-Rvy89-xvgQ/exec';

        // Initialize cart
        let cart = [];
        let products = [];
        let banners = [];
        let currentUser = null;
        let currentSlide = 0;
        let slideInterval;
        let cachedData = {
            banners: null,
            products: null,
            about: null,
            contact: null,
            timestamp: null
        };

       

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
        const profileModal = document.getElementById('profileModal');
        const addressModal = document.getElementById('addressModal');
        const ordersModal = document.getElementById('ordersModal');
        const notification = document.getElementById('notification');
        const userBtn = document.getElementById('userBtn');
        const userText = document.getElementById('userText');
        const userDropdown = document.getElementById('userDropdown');
        const logoutBtn = document.getElementById('logoutBtn');
        const profileBtn = document.getElementById('profileBtn');
        const ordersBtn = document.getElementById('ordersBtn');
        const aboutContent = document.getElementById('aboutContent');
        const contactContent = document.getElementById('contactContent');
        const ordersContent = document.getElementById('ordersContent');

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
            checkLoginStatus();
            setupEventListeners();
            loadCachedData();
        }

        // Load cached data from localStorage
        function loadCachedData() {
            const now = new Date().getTime();
            const cache = localStorage.getItem('foodMartCache');
            
            if (cache) {
                cachedData = JSON.parse(cache);
                
                // Use cache if it's less than 1 hour old
                if (cachedData.timestamp && now - cachedData.timestamp < 3600000) {
                    if (cachedData.banners) {
                        banners = cachedData.banners;
                        renderSlideshow(banners);
                        startSlideshow();
                        slideshowLoader.style.display = 'none';
                    }
                    
                    if (cachedData.products) {
                        products = cachedData.products;
                        renderProducts(products);
                        productsLoader.style.display = 'none';
                    }
                    
                    if (cachedData.about) {
                        renderAboutContent(cachedData.about);
                    }
                    
                    if (cachedData.contact) {
                        renderContactContent(cachedData.contact);
                    }
                    
                    // Load fresh data in the background
                    setTimeout(() => {
                        loadBanners();
                        loadProducts();
                        loadAboutContent();
                        loadContactContent();
                    }, 1000);
                    
                    return;
                }
            }
            
            // No cache or cache expired, load fresh data
            loadBanners();
            loadProducts();
            loadAboutContent();
            loadContactContent();
        }

        // Save data to cache
        function saveToCache() {
            cachedData = {
                banners: banners,
                products: products,
                about: cachedData.about,
                contact: cachedData.contact,
                timestamp: new Date().getTime()
            };
            localStorage.setItem('foodMartCache', JSON.stringify(cachedData));
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
                    saveToCache();
                    showNotification('Banners loaded successfully!', 'success');
                } else {
                    throw new Error(result.message || 'Failed to load banners');
                }
            } catch (error) {
                console.error('Error:', error);
                // If we have cached banners, use them
                if (banners.length === 0) {
                    // Fallback to default banner
                    banners = [{
                        Image: 'https://drive.google.com/thumbnail?id=1UZUtFzV92YLLJJb7H13ohTWiNmQ_NefA',
                        Title: 'Welcome to FOOD MART',
                        Description: 'Your one-stop shop for all your grocery needs. Fresh products at affordable prices.',
                        Link: '#products'
                    }];
                    renderSlideshow(banners);
                    startSlideshow();
                }
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
                nextArrow.innerHTML = '<i class="fas fa-chevron-right"></i';
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
                    saveToCache();
                    showNotification('Products loaded successfully!', 'success');
                } else {
                    throw new Error(result.message || 'Failed to load products');
                }
            } catch (error) {
                console.error('Error:', error);
                showNotification('Error loading products: ' + error.message, 'error');
                // If we have cached products, use them
                if (products.length === 0) {
                    products = [];
                    renderProducts(products);
                }
            } finally {
                productsLoader.style.display = 'none';
            }
        }

        // Render products to the page
        function renderProducts(products) {
            productsContainer.innerHTML = '';
            
            if (products.length === 0) {
                roductsContainer.innerHTML = '<p class="text-center" style="grid-column: 1 / -1; padding: 40px; text-align: center;">No products available. Please check back later.</p>';
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

        // Load about content from Google Sheets
        async function loadAboutContent() {
            try {
                const response = await fetch(`${scriptURL}?action=load&sheet=About`);
                const result = await response.json();
                
                if (result.result === 'success') {
                    cachedData.about = result.data;
                    renderAboutContent(result.data);
                    saveToCache();
                } else {
                    throw new Error(result.message || 'Failed to load about content');
                }
            } catch (error) {
                console.error('Error:', error);
                // Fallback to default about content
                aboutContent.innerHTML = `
                    <img src="https://element502.com/wp-content/uploads/2017/01/about-post.jpg" alt="About Us" class="about-img">
                    <div class="about-text">
                        <h3>Welcome to Food Mart</h3>
                        <p>
                            At Food Mart, we believe in delivering fresh, quality groceries right at your doorstep. 
                            From daily essentials to premium products, our mission is to make your shopping easy, 
                            affordable, and enjoyable.
                        </p>
                        <p>
                            With a wide range of products, fast delivery, and customer-first service, 
                            Food Mart is your trusted neighborhood grocery partner.
                        </p>
                        <a href="#" class="btn contact-toggle" data-section="contact">Contact Us</a>
                    </div>
                `;
            }
        }

        // Render about content
        function renderAboutContent(aboutData) {
            if (!aboutData || aboutData.length === 0) {
                aboutContent.innerHTML = `
                    <img src="https://element502.com/wp-content/uploads/2017/01/about-post.jpg" alt="About Us" class="about-img">
                    <div class="about-text">
                        <h3>Welcome to Food Mart</h3>
                        <p>
                            At Food Mart, we believe in delivering fresh, quality groceries right at your doorstep. 
                            From daily essentials to premium products, our mission is to make your shopping easy, 
                            affordable, and enjoyable.
                        </p>
                        <p>
                            With a wide range of products, fast delivery, and customer-first service, 
                            Food Mart is your trusted neighborhood grocery partner.
                        </p>
                        <a href="#" class="btn contact-toggle" data-section="contact">Contact Us</a>
                    </div>
                `;
                return;
            }
            
            const about = aboutData[0];
            const image = convertGoogleDriveUrl(about.Image || about.image);
            const title = about.Title || about.title || 'Welcome to Food Mart';
            const content = about.Content || about.content || '';
            
            aboutContent.innerHTML = `
                <img src="${image}" alt="About Us" class="about-img" onerror="this.src='https://via.placeholder.com/500x300'">
                <div class="about-text">
                    <h3>${title}</h3>
                    ${content.split('\n').map(paragraph => `<p>${paragraph}</p>`).join('')}
                    <a href="#" class="btn contact-toggle" data-section="contact">Contact Us</a>
                </div>
            `;
        }

        // Load contact content from Google Sheets
        async function loadContactContent() {
            try {
                const response = await fetch(`${scriptURL}?action=load&sheet=Contact`);
                const result = await response.json();
                
                if (result.result === 'success') {
                    cachedData.contact = result.data;
                    renderContactContent(result.data);
                    saveToCache();
                } else {
                    throw new Error(result.message || 'Failed to load contact content');
                }
            } catch (error) {
                console.error('Error:', error);
                // Fallback to default contact content
                contactContent.innerHTML = `
                    <div class="contact-info">
                        <h3>Get in Touch</h3>
                        <p><i class="fas fa-map-marker-alt"></i> 123 Market Street, New Delhi, India</p>
                        <p><i class="fas fa-phone"></i> +91 98765 43210</p>
                        <p><i class="fas fa-envelope"></i> support@foodmart.com</p>
                        <div class="social-icons">
                            <a href="#"><i class="fab fa-facebook-f"></i></a>
                            <a href="#"><i class="fab fa-twitter"></i></a>
                            <a href="#"><i class="fab fa-instagram"></i></a>
                        </div>
                    </div>

                    <form class="contact-form" id="contactForm">
                        <div class="form-group">
                            <label for="contactName">Your Name</label>
                            <input type="text" id="contactName" placeholder="Enter your name" required>
                        </div>
                        <div class="form-group">
                            <label for="contactEmail">Your Email</label>
                            <input type="email" id="contactEmail" placeholder="Enter your email" required>
                        </div>
                        <div class="form-group">
                            <label for="contactMessage">Your Message</label>
                            <textarea id="contactMessage" rows="5" placeholder="Type your message..." required></textarea>
                        </div>
                        <button type="submit" class="btn">Send Message</button>
                    </form>
                `;
            }
        }

        // Render contact content
        function renderContactContent(contactData) {
            if (!contactData || contactData.length === 0) {
                contactContent.innerHTML = `
                    div class="contact-info">
                        <h3>Get in Touch</h3>
                        <p><i class="fas fa-map-marker-alt"></i> 123 Market Street, New Delhi, India</p>
                        <p><i class="fas fa-phone"></i> +91 98765 43210</p>
                        <p><i class="fas fa-envelope"></i> support@foodmart.com</p>
                        <div class="social-icons">
                            <a href="#"><i class="fab fa-facebook-f"></i></a>
                            <a href="#"><i class="fab fa-twitter"></i></a>
                            <a href="#"><i class="fab fa-instagram"></i></a>
                        </div>
                    </div>

                    <form class="contact-form" id="contactForm">
                        <div class="form-group">
                            <label for="contactName">Your Name</label>
                            <input type="text" id="contactName" placeholder="Enter your name" required>
                        </div>
                        <div class="form-group">
                            <label for="contactEmail">Your Email</label>
                            <input type="email" id="contactEmail" placeholder="Enter your email" required>
                        </div>
                        <div class="form-group">
                            <label for="contactMessage">Your Message</label>
                            <textarea id="contactMessage" rows="5" placeholder="Type your message..." required></textarea>
                        </div>
                        <button type="submit" class="btn">Send Message</button>
                    </form>
                `;
                return;
            }
            
            const contact = contactData[0];
            const address = contact.Address || contact.address || '123 Market Street, New Delhi, India';
            const phone = contact.Phone || contact.phone || '+91 98765 43210';
            const email = contact.Email || contact.email || 'support@foodmart.com';
            
            contactContent.innerHTML = `
                <div class="contact-info">
                    <h3>Get in Touch</h3>
                    <p><i class="fas fa-map-marker-alt"></i> ${address}</p>
                    <p><i class="fas fa-phone"></i> ${phone}</p>
                    <p><i class="fas fa-envelope"></i> ${email}</p>
                    <div class="social-icons">
                        <a href="#"><i class="fab fa-facebook-f"></i></a>
                        <a href="#"><i class="fab fa-twitter"></i></a>
                        <a href="#"><i class="fab fa-instagram"></i></a>
                    </div>
                </div>

                <form class="contact-form" id="contactForm">
                    <div class="form-group">
                        <label for="contactName">Your Name</label>
                        <input type="text" id="contactName" placeholder="Enter your name" required>
                    </div>
                    <div class="form-group">
                        <label for="contactEmail">Your Email</label>
                        <input type="email" id="contactEmail" placeholder="Enter your email" required>
                    </div>
                    <div class="form-group">
                        <label for="contactMessage">Your Message</label>
                        <textarea id="contactMessage" rows="5" placeholder="Type your message..." required></textarea>
                    </div>
                    <button type="submit" class="btn">Send Message</button>
                </form>
            `;
        }

        // Load user orders
        async function loadUserOrders() {
            if (!currentUser) return;
            
            try {
                const response = await fetch(`${scriptURL}?action=loadOrders&email=${encodeURIComponent(currentUser.email)}`);
                const result = await response.json();
                
                if (result.result === 'success') {
                    renderOrders(result.data);
                } else {
                    ordersContent.innerHTML = '<p>No orders found.</p>';
                }
            } catch (error) {
                console.error('Error:', error);
                ordersContent.innerHTML = '<p>Error loading orders. Please try again later.</p>';
            }
        }

        // Render orders
        function renderOrders(orders) {
            if (!orders || orders.length === 0) {
                ordersContent.innerHTML = '<p>No orders found.</p>';
                return;
            }
            
            let ordersHTML = `
                <table class="orders-table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Date</th>
                            <th>Items</th>
                            <th>Total</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            orders.forEach(order => {
                const orderDate = new Date(order.date || order.Date).toLocaleDateString();
                const status = order.status || order.Status || 'pending';
                const statusClass = `status-${status.toLowerCase()}`;
                
                ordersHTML += `
                    tr>
                        <td>#${order.id || order.Id || 'N/A'}</td>
                        <td>${orderDate}</td>
                        <td>${order.items ? order.items.length : 0} items</td>
                        <td>${formatPrice(order.total || order.Total || 0)}</td>
                        <td><span class="order-status ${statusClass}">${status}</span></td>
                    </tr>
                `;
            });
            
            ordersHTML += `
                    </tbody>
                </table>
            `;
            
            ordersContent.innerHTML = ordersHTML;
        }

        // Set up event listeners
        function setupEventListeners() {
            // Mobile menu toggle
            document.getElementById('mobileMenuBtn').addEventListener('click', () => {
                document.getElementById('navMenu').classList.toggle('show');
            });

            // User dropdown toggle
            userBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (currentUser) {
                    userDropdown.classList.toggle('show');
                } else {
                    loginModal.style.display = 'flex';
                }
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!userBtn.contains(e.target) && !userDropdown.contains(e.target)) {
                    userDropdown.classList.remove('show');
                }
            });

            // Logout button
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                logout();
            });

            // Profile button
            profileBtn.addEventListener('click', (e) => {
                e.preventDefault();
                openProfileModal();
            });

            // Orders button
            ordersBtn.addEventListener('click', (e) => {
                e.preventDefault();
                openOrdersModal();
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

            // Close modals
            document.getElementById('closeModal').addEventListener('click', () => {
                loginModal.style.display = 'none';
            });

            document.getElementById('closeRegisterModal').addEventListener('click', () => {
                registerModal.style.display = 'none';
            });

            document.getElementById('closeProfileModal').addEventListener('click', () => {
                profileModal.style.display = 'none';
            });

            document.getElementById('closeAddressModal').addEventListener('click', () => {
                addressModal.style.display = 'none';
            });

            document.getElementById('closeOrdersModal').addEventListener('click', () => {
                ordersModal.style.display = 'none';
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

            // Edit address button
            document.getElementById('editAddressBtn').addEventListener('click', () => {
                document.getElementById('addressEditForm').style.display = 'block';
                document.getElementById('editAddress').value = currentUser.address;
            });

            // Save address button
            document.getElementById('saveAddressBtn').addEventListener('click', () => {
                const newAddress = document.getElementById('editAddress').value;
                if (!newAddress) {
                    showNotification('Please enter a valid address', 'error');
                    return;
                }
                
                currentUser.address = newAddress;
                saveUserToStorage();
                document.getElementById('addressDetails').textContent = newAddress;
                document.getElementById('addressEditForm').style.display = 'none';
                showNotification('Address updated successfully', 'success');
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
                    loginUser({ 
                        email, 
                        name: email.split('@')[0],
                        address: "123 User Address, City - 110001",
                        phone: "9876543210"
                    });
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
                    registerUser({ 
                        email, 
                        name,
                        address,
                        phone
                    });
                }
            });

            // Profile form submission
            document.getElementById('profileForm').addEventListener('submit', (e) => {
                e.preventDefault();
                const name = document.getElementById('profileName').value;
                const email = document.getElementById('profileEmail').value;
                const phone = document.getElementById('profilePhone').value;
                const address = document.getElementById('profileAddress').value;
                
                // Simple validation
                if (name && email && phone && address) {
                    updateProfile({ 
                        email, 
                        name,
                        address,
                        phone
                    });
                }
            });

            // Toggle section visibility
            document.querySelectorAll('.section-toggle').forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    const sectionId = this.getAttribute('data-section');
                    const section = document.getElementById(sectionId);
                    
                    // Hide all expandable sections
                    document.querySelectorAll('#about, #contact, #orders').forEach(sec => {
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
                        
                        // Load orders if orders section is opened
                        if (sectionId === 'orders') {
                            if (currentUser) {
                                loadUserOrders();
                            } else {
                                ordersContent.innerHTML = '<p>Please log in to view your order status.</p>';
                            }
                        }
                    }
                });
            });

            // Contact form submission
            document.addEventListener('submit', function(e) {
                if (e.target.id === 'contactForm') {
                    e.preventDefault();
                    
                    const name = document.getElementById('contactName').value;
                    const email = document.getElementById('contactEmail').value;
                    const message = document.getElementById('contactMessage').value;
                    
                    // Simple validation
                    if (!name || !email || !message) {
                        showNotification('Please fill all fields', 'error');
                        return;
                    }
                    
                    // Send contact notification using EmailJS
                    emailjs.send('service_f8b5ami', 'template_w851iqx', {
                        from_name: name,
                        from_email: email,
                        message: message,
                        to_email: "umer0510@gmail.com"
                    }).then(function(response) {
                        showNotification('Your message has been sent successfully! We will contact you soon.', 'success');
                        e.target.reset();
                    }, function(error) {
                        showNotification('Failed to send message. Please try again later.', 'error');
                    });
                }
            });

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

        // Login user
        function loginUser(user) {
            currentUser = user;
            saveUserToStorage();
            loginModal.style.display = 'none';
            updateUserInterface();
            showNotification(`Welcome ${currentUser.name}!`, 'success');
        }

        // Register user
        function registerUser(user) {
            currentUser = user;
            saveUserToStorage();
            registerModal.style.display = 'none';
            updateUserInterface();
            showNotification(`Account created successfully! Welcome ${currentUser.name}!`, 'success');
        }

        // Update profile
        function updateProfile(user) {
            currentUser = { ...currentUser, ...user };
            saveUserToStorage();
            profileModal.style.display = 'none';
            showNotification('Profile updated successfully!', 'success');
        }

        // Logout user
        function logout() {
            currentUser = null;
            localStorage.removeItem('foodMartUser');
            updateUserInterface();
            userDropdown.classList.remove('show');
            showNotification('Logged out successfully', 'success');
        }

        // Save user to localStorage
        function saveUserToStorage() {
            if (currentUser) {
                localStorage.setItem('foodMartUser', JSON.stringify(currentUser));
            }
        }

        // Check login status
        function checkLoginStatus() {
            const userData = localStorage.getItem('foodMartUser');
            if (userData) {
                currentUser = JSON.parse(userData);
                updateUserInterface();
            }
        }

        // Update user interface based on login status
        function updateUserInterface() {
            if (currentUser) {
                userText.textContent = currentUser.name;
                userBtn.innerHTML = '<i class="fas fa-user"></i> ' + currentUser.name;
                // Don't show dropdown by default - only on click
            } else {
                userText.textContent = 'Login';
                userBtn.innerHTML = '<i class="fas fa-user"></i> Login';
                userDropdown.style.display = 'none';
            }
        }

        // Open profile modal
        function openProfileModal() {
            if (!currentUser) {
                showNotification('Please login to edit your profile', 'error');
                loginModal.style.display = 'flex';
                return;
            }
            
            document.getElementById('profileName').value = currentUser.name;
            document.getElementById('profileEmail').value = currentUser.email;
            document.getElementById('profilePhone').value = currentUser.phone;
            document.getElementById('profileAddress').value = currentUser.address;
            profileModal.style.display = 'flex';
            userDropdown.classList.remove('show');
        }

        // Open orders modal
        function openOrdersModal() {
            if (!currentUser) {
                showNotification('Please login to view your orders', 'error');
                loginModal.style.display = 'flex';
                return;
            }
            
            ordersModal.style.display = 'flex';
            userDropdown.classList.remove('show');
            
            // Load orders
            loadUserOrders();
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
            document.getElementById('editAddress').value = currentUser.address;
            document.getElementById('addressEditForm').style.display = 'none';
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
                instructions: document.getElementById('deliveryInstructions').value || 'No special instructions',
                status: 'pending'
            };
            
            // In a real application, you would send this data to your server
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

        // Initialize the app
        init();
