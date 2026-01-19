// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";
// import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-analytics.js"; // Analytics is not strictly needed for data binding

import { firebaseConfig } from "./firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Analytics is not strictly needed for data binding, but can be added if required
// import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-analytics.js";
// const analytics = getAnalytics(app);

const database = getDatabase(app);
const placesRef = ref(database, '/Place/');

// Function to render places
function renderPlaces(placesData, targetElementId) {
    const targetElement = document.getElementById(targetElementId);
    if (!targetElement) return;

    targetElement.innerHTML = ''; // Clear existing content

    // Convert the object of places into an array
    const placesArray = Object.values(placesData);

    placesArray.forEach(place => {
        // Skip user nodes (which don't have a Title)
        if (!place.Title) return;

        const placeCard = document.createElement('div');
        placeCard.className = 'bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:scale-105';

        placeCard.innerHTML = `
            <a href="Place.html?link=${place.ID || ''}" class="block">
                <img src="${place.Thumb || 'https://via.placeholder.com/300x200?text=No+Image'}" alt="${place.Title || 'Destination'}" class="w-full h-48 object-cover">
            </a>
            <div class="p-4">
                <h3 class="text-lg font-semibold text-gray-900 mb-2">${place.Title || 'Untitled Destination'}</h3>
                <p class="text-gray-600 text-sm mb-4 line-clamp-3">${place.Desc || 'No description available.'}</p>
                <div class="flex items-center justify-between">
                    <span class="text-xs font-medium text-blue-600 uppercase">${place.Type || 'General'}</span>
                    <a href="Place.html?link=${place.ID || ''}" class="text-blue-600 hover:underline text-sm font-semibold flex items-center gap-1">
                        View Details
                        <i data-lucide="arrow-right" class="h-4 w-4"></i>
                    </a>
                </div>
            </div>
        `;
        targetElement.appendChild(placeCard);
    });
}

// Fetch and display places
onValue(placesRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        // For the homepage, we might want to show featured places and then all places
        // Let's display the first 3 as featured and all in the main grid for now.
        const allPlaces = Object.values(data);

        // Render featured places (e.g., first 3)
        const featuredPlaces = allPlaces.slice(0, 3);
        renderPlaces(featuredPlaces, 'featured-places-grid');

        // Render all places in the main grid
        renderPlaces(data, 'all-places-grid');

        // Also render trending places if needed, for now, let's use the same data
        renderPlaces(data, 'trending-places-grid');
    } else {
        // Handle case where there's no data
        const noPlacesMessage = document.createElement('p');
        noPlacesMessage.className = 'text-center text-gray-500 text-lg col-span-full';
        noPlacesMessage.textContent = 'No destinations found. Please check back later!';

        const featuredGrid = document.getElementById('featured-places-grid');
        if (featuredGrid) featuredGrid.appendChild(noPlacesMessage.cloneNode(true));

        const allGrid = document.getElementById('all-places-grid');
        if (allGrid) allGrid.appendChild(noPlacesMessage.cloneNode(true));

        const trendingGrid = document.getElementById('trending-places-grid');
        if (trendingGrid) trendingGrid.appendChild(noPlacesMessage.cloneNode(true));
    }
    // Initialize lucide icons after rendering new content
    lucide.createIcons();
});


// General interactivity for the website
document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const typeParam = urlParams.get('type');

    // Mobile menu toggle
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', function () {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // Close mobile menu when clicking on a link
    const mobileMenuLinks = mobileMenu ? mobileMenu.querySelectorAll('a') : [];
    mobileMenuLinks.forEach(link => {
        link.addEventListener('click', function () {
            if (mobileMenu) {
                mobileMenu.classList.add('hidden');
            }
        });
    });

    // Tab functionality for Grid View / Trending
    const gridViewTab = document.getElementById('grid-view-tab');
    const trendingTab = document.getElementById('trending-tab');
    const gridViewContent = document.getElementById('grid-view-content');
    const trendingContent = document.getElementById('trending-content');

    if (gridViewTab && trendingTab && gridViewContent && trendingContent) {
        const switchTab = (activeTab, inactiveTab, activeContent, inactiveContent) => {
            activeContent.style.display = 'block';
            inactiveContent.style.display = 'none';
            activeTab.setAttribute('data-state', 'active');
            inactiveTab.setAttribute('data-state', 'inactive');
            // Support home.js classes if used
            activeTab.classList.add('bg-background', 'text-foreground', 'shadow-sm');
            activeTab.classList.remove('text-muted-foreground');
            inactiveTab.classList.remove('bg-background', 'text-foreground', 'shadow-sm');
            inactiveTab.classList.add('text-muted-foreground');
        };

        gridViewTab.addEventListener('click', () => switchTab(gridViewTab, trendingTab, gridViewContent, trendingContent));
        trendingTab.addEventListener('click', () => switchTab(trendingTab, gridViewTab, trendingContent, gridViewContent));
    }

    // Search and Filter functionality
    const searchInput = document.getElementById('search-input');
    const categoryFilters = document.getElementById('category-filters');

    const handleFiltering = () => {
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        const activeBadge = categoryFilters ? categoryFilters.querySelector('.bg-blue-600') : null;
        let selectedCategory = activeBadge ? activeBadge.textContent : 'All';

        // Override with URL param on first load
        if (typeParam && !this._initialFilterApplied) {
            selectedCategory = typeParam;
            this._initialFilterApplied = true;
        }

        const cards = document.querySelectorAll('#all-places-grid > div');
        cards.forEach(card => {
            const title = card.querySelector('h3').textContent.toLowerCase();
            const location = card.querySelector('p')?.textContent.toLowerCase() || '';
            const type = card.querySelector('span.text-blue-600')?.textContent || '';

            const matchesSearch = title.includes(searchTerm) || location.includes(searchTerm);
            const matchesCategory = selectedCategory === 'All' || type.toLowerCase() === selectedCategory.toLowerCase();

            card.style.display = (matchesSearch && matchesCategory) ? 'block' : 'none';
        });
    };

    if (searchInput) {
        searchInput.addEventListener('input', handleFiltering);
    }

    if (categoryFilters) {
        const badges = categoryFilters.querySelectorAll('span');
        badges.forEach(badge => {
            badge.addEventListener('click', () => {
                badges.forEach(b => {
                    b.classList.remove('bg-blue-600', 'text-white');
                    b.classList.add('bg-gray-100', 'text-gray-800');
                });
                badge.classList.remove('bg-gray-100', 'text-gray-800');
                badge.classList.add('bg-blue-600', 'text-white');
                handleFiltering();
            });
        });
    }

    // Initial filter application after data might have loaded
    setTimeout(handleFiltering, 1000); // Small delay to wait for Firebase render
});
