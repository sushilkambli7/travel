// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

import { firebaseConfig } from "./firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const fortsRef = ref(database, '/Fort/');

// Function to fetch image from Wikipedia
async function fetchWikiImage(title) {
    if (!title) return null;
    try {
        const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
        if (!response.ok) return null;
        const data = await response.json();
        // Prefer originalimage for quality, fallback to thumbnail, then null
        return data.originalimage ? data.originalimage.source : (data.thumbnail ? data.thumbnail.source : null);
    } catch (error) {
        console.error("Wiki fetch error for " + title + ":", error);
        return null;
    }
}

// Function to render forts
async function renderForts(fortsData, targetElementId) {
    const targetElement = document.getElementById(targetElementId);
    if (!targetElement) return;

    targetElement.innerHTML = ''; // Clear existing content
    const fortsArray = Object.values(fortsData);

    // Render cards with placeholders first so UI is responsive
    fortsArray.forEach((fort, index) => {
        const fortCard = document.createElement('div');
        fortCard.className = 'bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:scale-105';
        const imgId = `img-${targetElementId}-${fort.ID || index}`;
        const detailLink = `fort.html?id=${fort.ID || ''}`;

        fortCard.innerHTML = `
            <a href="${detailLink}" class="block relative h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                <img id="${imgId}" src="" 
                     alt="${fort.name || 'Fort'}" class="absolute inset-0 w-full h-full object-cover transition-opacity duration-300 opacity-0">
                <div id="fallback-${imgId}" class="flex flex-col items-center justify-center text-gray-400">
                    <i data-lucide="castle" class="h-12 w-12 mb-2"></i>
                    <span class="text-xs font-medium">No Image Available</span>
                </div>
            </a>
            <div class="p-4">
                <h3 class="text-lg font-semibold text-gray-900 mb-2">${fort.name || 'Untitled Fort'}</h3>
                <p class="text-gray-600 text-sm mb-4 line-clamp-2">${fort.Address || 'No address available.'}</p>
                <div class="flex items-center justify-between">
                    <span class="text-xs font-medium text-blue-600 uppercase">${fort.State || 'Unknown State'}</span>
                    <a href="${detailLink}" class="text-blue-600 hover:underline text-sm font-semibold flex items-center gap-1">
                        View Details
                        <i data-lucide="arrow-right" class="h-4 w-4"></i>
                    </a>
                </div>
            </div>
        `;
        targetElement.appendChild(fortCard);

        const updateImg = (src) => {
            const img = document.getElementById(imgId);
            const fallback = document.getElementById(`fallback-${imgId}`);
            if (img && src) {
                img.src = src;
                img.onload = () => {
                    img.classList.remove('opacity-0');
                    if (fallback) fallback.classList.add('hidden');
                };
            }
        };

        // Fetch Wikipedia image asynchronously if no local image exists
        const localImg = fort.Thumb || fort.Image;
        if (localImg) {
            updateImg(localImg);
        } else {
            fetchWikiImage(fort.name).then(src => {
                if (src) {
                    updateImg(src);
                } else {
                    // Stay with fallback icon, lucide needs to be re-run for the castle icon
                    lucide.createIcons();
                }
            });
        }
    });

    // Initialize icons after rendering
    lucide.createIcons();
}

// Fetch and display forts
onValue(fortsRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        // Render all forts in the main grid
        renderForts(data, 'all-forts-grid'); // Assuming 'all-forts-grid' exists in forts.html

        // Render trending forts if needed, for now, let's use the same data
        renderForts(data, 'trending-forts-grid'); // Assuming 'trending-forts-grid' exists in forts.html
    } else {
        // Handle case where there's no data
        const noFortsMessage = document.createElement('p');
        noFortsMessage.className = 'text-center text-gray-500 text-lg col-span-full';
        noFortsMessage.textContent = 'No forts found. Please check back later!';

        const allFortsGrid = document.getElementById('all-forts-grid');
        if (allFortsGrid) allFortsGrid.appendChild(noFortsMessage.cloneNode(true));

        const trendingFortsGrid = document.getElementById('trending-forts-grid');
        if (trendingFortsGrid) trendingFortsGrid.appendChild(noFortsMessage.cloneNode(true));
    }
    // Initialize lucide icons after rendering new content
    lucide.createIcons();
});

// General interactivity for the website (copied from index.js/places.js)
document.addEventListener('DOMContentLoaded', function () {
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
        gridViewTab.addEventListener('click', () => {
            gridViewContent.style.display = 'block';
            trendingContent.style.display = 'none';
            gridViewTab.setAttribute('data-state', 'active');
            trendingTab.setAttribute('data-state', 'inactive');
        });

        trendingTab.addEventListener('click', () => {
            gridViewContent.style.display = 'none';
            trendingContent.style.display = 'block';
            gridViewTab.setAttribute('data-state', 'inactive');
            trendingTab.setAttribute('data-state', 'active');
        });
    }

    // Search functionality
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            // Assuming the fort cards are within #all-forts-grid and have a common class like .bg-white
            const fortCards = document.querySelectorAll('#all-forts-grid .bg-white');
            const noFortsFoundMessage = document.getElementById('no-forts-found'); // Assuming this ID exists

            let found = false;
            fortCards.forEach(card => {
                const title = card.querySelector('h3').textContent.toLowerCase();
                const address = card.querySelector('p').textContent.toLowerCase(); // Using address for search
                if (title.includes(searchTerm) || address.includes(searchTerm)) {
                    card.style.display = 'block';
                    found = true;
                } else {
                    card.style.display = 'none';
                }
            });

            if (noFortsFoundMessage) {
                noFortsMessage.style.display = found ? 'none' : 'block';
            }
        });
    }
});
