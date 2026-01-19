// Pincode Search Tool Logic
const searchInput = document.getElementById('pincode-search-input');
const searchBtn = document.getElementById('search-btn');
const resultsGrid = document.getElementById('results-grid');
const resultsMeta = document.getElementById('results-meta');
const resultsCount = document.getElementById('results-count');
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const featuredTitle = document.getElementById('featured-section-title');

const featuredPincodes = [
    { Name: "New Delhi G.P.O.", Pincode: "110001", District: "Central Delhi", State: "Delhi", DeliveryStatus: "Delivery" },
    { Name: "Lucknow G.P.O.", Pincode: "226001", District: "Lucknow", State: "Uttar Pradesh", DeliveryStatus: "Delivery" },
    { Name: "Jaipur G.P.O.", Pincode: "302001", District: "Jaipur", State: "Rajasthan", DeliveryStatus: "Delivery" },
    { Name: "Mumbai G.P.O.", Pincode: "400001", District: "Mumbai", State: "Maharashtra", DeliveryStatus: "Delivery" },
    { Name: "Bengaluru G.P.O.", Pincode: "560001", District: "Bengaluru", State: "Karnataka", DeliveryStatus: "Delivery" },
    { Name: "Chennai G.P.O.", Pincode: "600001", District: "Chennai", State: "Tamil Nadu", DeliveryStatus: "Delivery" },
    { Name: "Kolkata G.P.O.", Pincode: "700001", District: "Kolkata", State: "West Bengal", DeliveryStatus: "Delivery" },
    { Name: "Patna G.P.O.", Pincode: "800001", District: "Patna", State: "Bihar", DeliveryStatus: "Delivery" },
    { Name: "Kishanganj G.P.O.", Pincode: "855117", District: "Kishanganj", State: "Bihar", DeliveryStatus: "Delivery" },
    { Name: "Army Postal Service", Pincode: "999999", District: "APS HQ", State: "Military", DeliveryStatus: "Delivery" }
];

console.log('Pincode tool initialized:', { searchInput, searchBtn, resultsGrid });

const searchAction = async () => {
    const query = searchInput.value.trim();
    console.log('Searching for:', query);
    if (!query) return;

    // Reset UI
    resultsGrid.innerHTML = '';
    resultsMeta.classList.add('hidden');
    errorState.classList.add('hidden');
    loadingState.classList.remove('hidden');
    if (featuredTitle) featuredTitle.classList.add('hidden');

    try {
        const isPincode = /^\d{6}$/.test(query);
        const endpoint = isPincode
            ? `https://api.postalpincode.in/pincode/${query}`
            : `https://api.postalpincode.in/postoffice/${encodeURIComponent(query)}`;

        console.log('Fetching from:', endpoint);
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error(`API request failed with status: ${response.status}`);

        const data = await response.json();
        console.log('API Response:', data);

        loadingState.classList.add('hidden');

        if (data[0].Status === "Success" && data[0].PostOffice && data[0].PostOffice.length > 0) {
            renderResults(data[0].PostOffice);
        } else {
            console.warn('No results found status:', data[0].Status);
            errorState.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Search error:', error);
        loadingState.classList.add('hidden');
        errorState.classList.remove('hidden');
    }
};

const renderResults = (postOffices) => {
    console.log('Rendering results:', postOffices.length);
    resultsMeta.classList.remove('hidden');
    resultsCount.textContent = `(${postOffices.length} locations found)`;

    postOffices.forEach(po => {
        const card = document.createElement('a');
        card.href = `pincodedetails.html?name=${encodeURIComponent(po.Name)}&pincode=${po.Pincode}`;
        card.className = 'bg-white p-6 rounded-2xl border border-gray-100 shadow-sm result-card block hover:no-underline';
        card.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <span class="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-blue-100">${po.DeliveryStatus}</span>
                <span class="text-blue-600 font-bold text-lg">#${po.Pincode}</span>
            </div>
            <h3 class="text-lg font-bold text-gray-900 mb-3">${po.Name}</h3>
            <div class="space-y-2 text-sm text-gray-600">
                <p class="flex items-center gap-2"><i data-lucide="map-pin" class="h-4 w-4 text-gray-400"></i> ${po.District}, ${po.State}</p>
                <div class="flex items-center justify-between mt-4 text-blue-600 font-semibold group cursor-pointer">
                    <span class="text-xs">View Full Details</span>
                    <i data-lucide="arrow-right" class="h-4 w-4 transition-transform group-hover:translate-x-1"></i>
                </div>
            </div>
        `;
        resultsGrid.appendChild(card);
    });

    // Initialize lucide icons for new elements
    if (window.lucide) window.lucide.createIcons();
};

const init = () => {
    // Render featured pincodes by default
    if (featuredPincodes && featuredPincodes.length > 0) {
        renderFeatured();
    }
};

const renderFeatured = () => {
    resultsGrid.innerHTML = '';
    featuredPincodes.forEach(po => {
        const card = document.createElement('a');
        card.href = `pincodedetails.html?name=${encodeURIComponent(po.Name)}&pincode=${po.Pincode}`;
        card.className = 'bg-white p-6 rounded-2xl border border-gray-100 shadow-sm result-card block hover:no-underline';
        card.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <span class="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-blue-100">${po.DeliveryStatus}</span>
                <span class="text-blue-600 font-bold text-lg">#${po.Pincode}</span>
            </div>
            <h3 class="text-lg font-bold text-gray-900 mb-3">${po.Name}</h3>
            <div class="space-y-2 text-sm text-gray-600">
                <p class="flex items-center gap-2"><i data-lucide="map-pin" class="h-4 w-4 text-gray-400"></i> ${po.District}, ${po.State}</p>
                <div class="flex items-center justify-between mt-4 text-blue-600 font-semibold group cursor-pointer">
                    <span class="text-xs">View Full Details</span>
                    <i data-lucide="arrow-right" class="h-4 w-4 transition-transform group-hover:translate-x-1"></i>
                </div>
            </div>
        `;
        resultsGrid.appendChild(card);
    });
    if (window.lucide) window.lucide.createIcons();
};

// Event Listeners
if (searchBtn) {
    searchBtn.addEventListener('click', (e) => {
        e.preventDefault();
        searchAction();
    });
}
if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            searchAction();
        }
    });

    // Handle clearing the search input to restore featured pincodes
    searchInput.addEventListener('input', (e) => {
        if (e.target.value.trim() === '') {
            if (featuredTitle) featuredTitle.classList.remove('hidden');
            resultsMeta.classList.add('hidden');
            errorState.classList.add('hidden');
            renderFeatured();
        }
    });
}

// Initial rendering
init();
