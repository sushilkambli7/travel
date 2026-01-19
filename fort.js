// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getDatabase, ref, get, child, set, remove, onValue } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import { firebaseConfig } from "./firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

let currentFortData = null;
let currentUser = null;
let isFavorited = false;
let map = null;

// Global callback for Google Maps API
window.initMap = function () {
    if (currentFortData) {
        renderMap(currentFortData);
    }
};

if (window.google && window.google.maps) {
    window.initMap();
}

function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Function to fetch Pincode from postalpincode.in API
async function fetchPincodeInfo(title, address) {
    // 1. Try to extract from address strings first
    const match = address ? address.match(/\b\d{6}\b/) : null;
    if (match) return { Pincode: match[0] };

    // 2. Prepare search candidates
    const candidates = [];
    if (title) candidates.push(title.split(',')[0].trim());
    if (address) {
        const parts = address.split(',').map(p => p.trim()).filter(p => p.length > 2);
        candidates.push(...parts.reverse());
    }

    const uniqueCandidates = [...new Set(candidates)];
    for (const name of uniqueCandidates) {
        try {
            const response = await fetch(`https://api.postalpincode.in/postoffice/${encodeURIComponent(name)}`);
            if (response.ok) {
                const data = await response.json();
                if (data[0].Status === "Success" && data[0].PostOffice && data[0].PostOffice.length > 0) {
                    const po = data[0].PostOffice[0];
                    return {
                        Pincode: po.Pincode,
                        District: po.District
                    };
                }
            }
        } catch (err) {
            console.warn(`Pincode fetch failed for ${name}:`, err);
        }
    }
    return null;
}

// Function to fetch image or summary from Wikipedia
async function fetchWikiData(title) {
    if (!title) return null;
    try {
        const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.error("Wiki fetch error:", error);
        return null;
    }
}

// --- Favorite Functionality ---
function setupFavoriteButton(placeId) {
    const favoriteBtn = document.getElementById('favorite-btn');
    if (!favoriteBtn) return;

    onAuthStateChanged(auth, (user) => {
        currentUser = user;
        if (user) {
            const favRef = ref(db, `Favorite/Place/${user.uid}/${placeId}`);
            onValue(favRef, (snapshot) => {
                isFavorited = snapshot.exists() && snapshot.val() === true;
                updateFavoriteUI();
            });
        } else {
            isFavorited = false;
            updateFavoriteUI();
        }
    });

    favoriteBtn.addEventListener('click', async () => {
        if (!currentUser) {
            alert("Please login to add favorites.");
            window.location.href = 'login.html';
            return;
        }

        const favRef = ref(db, `Favorite/Place/${currentUser.uid}/${placeId}`);
        try {
            if (isFavorited) {
                await remove(favRef);
            } else {
                await set(favRef, true);
            }
        } catch (error) {
            console.error("Error updating favorite:", error);
        }
    });

    function updateFavoriteUI() {
        const icon = document.getElementById('favorite-icon');
        const text = document.getElementById('favorite-text');
        if (!icon || !text) return;

        if (isFavorited) {
            icon.classList.add('fill-current', text.classList.contains('text-red-500') ? 'red' : 'text-red-500');
            icon.classList.add('text-red-500');
            text.textContent = 'Favorited';
            favoriteBtn.classList.add('bg-red-500/20', 'border-red-500/50');
            favoriteBtn.classList.remove('bg-white/20', 'border-white/30');
        } else {
            icon.classList.remove('fill-current', 'text-red-500');
            text.textContent = 'Add to Favorites';
            favoriteBtn.classList.remove('bg-red-500/20', 'border-red-500/50');
            favoriteBtn.classList.add('bg-white/20', 'border-white/30');
        }
        if (window.lucide) window.lucide.createIcons();
    }
}

async function fetchFortDataAndRender() {
    const fortId = getQueryParam('id');
    if (!fortId) {
        console.error("No fort id found in URL.");
        return;
    }

    setupFavoriteButton(fortId);

    const dbRef = ref(db);
    try {
        const snapshot = await get(child(dbRef, `Fort/${fortId}`));
        if (snapshot.exists()) {
            let data = snapshot.val();
            if (Array.isArray(data) && data.length > 0) data = data[0];

            // Map Fort fields to Place Detail schema for consistent rendering
            const mappedData = {
                Title: data.name || data.Title || "Fort",
                Add: data.Address || data.Add || "",
                State: data.State || "",
                Thumb: data.Thumb || data.Image || null,
                Desc: data.Desc || "",
                Images: data.Images || [],
                latitude: data.latitude,
                longitude: data.longitude,
                rating: data.rating || "4.5"
            };

            currentFortData = mappedData;

            // Try to get more info from Wikipedia if description is thin
            if (!mappedData.Desc || mappedData.Desc.length < 50) {
                const wiki = await fetchWikiData(mappedData.Title);
                if (wiki) {
                    mappedData.Desc = wiki.extract || mappedData.Desc;
                    if (!mappedData.Thumb) mappedData.Thumb = wiki.originalimage ? wiki.originalimage.source : (wiki.thumbnail ? wiki.thumbnail.source : null);
                }
            }

            renderFortDetails(mappedData);
        } else {
            document.getElementById('place-title').textContent = "Fort not found.";
        }
    } catch (error) {
        console.error("Error fetching fort data:", error);
    }
}

function renderFortDetails(data) {
    const displayTitle = data.Title;
    document.title = displayTitle;

    // Hero Section
    document.getElementById('place-title').textContent = displayTitle;
    document.getElementById('place-address').textContent = data.Add || data.State;
    if (data.Thumb) {
        document.getElementById('hero-image').style.backgroundImage = `url('${data.Thumb}')`;
    }

    // Scroll handlers
    const scrollTo = (id) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    };
    document.getElementById('hero-view-on-map')?.addEventListener('click', () => scrollTo('map'));
    document.getElementById('sidebar-view-on-map')?.addEventListener('click', () => scrollTo('map'));
    document.getElementById('hero-photo-gallery')?.addEventListener('click', () => scrollTo('gallery-grid'));
    document.getElementById('sidebar-photo-gallery')?.addEventListener('click', () => scrollTo('gallery-grid'));

    // Descriptions
    const descContainer = document.getElementById('descriptions-container');
    descContainer.innerHTML = `<p class="text-gray-700 leading-relaxed">${data.Desc || "No detailed description available."}</p>`;

    // Quick Info
    document.getElementById('quick-info-location').innerHTML = `<strong>Location:</strong> ${data.Add || 'N/A'}`;
    document.getElementById('quick-info-state').innerHTML = `<strong>State:</strong> ${data.State || 'N/A'}`;

    // Fetch and Update Pincode
    fetchPincodeInfo(data.Title, data.Add).then(info => {
        const el = document.getElementById('quick-info-pincode');
        if (el) {
            if (info) {
                let display = `<strong>Pincode:</strong> ${info.Pincode}`;
                if (info.District) display += ` <span class="text-xs text-gray-400">(${info.District})</span>`;
                el.innerHTML = display;
                el.style.display = 'block';
            } else {
                el.style.display = 'none';
            }
        }
    });

    // Gallery
    const galleryGrid = document.getElementById('gallery-grid');
    galleryGrid.innerHTML = '';
    if (data.Images && data.Images.length > 0) {
        data.Images.forEach(src => {
            const div = document.createElement('div');
            div.innerHTML = `<img src="${src}" alt="${displayTitle}" class="w-full h-64 object-cover rounded-xl shadow-md transition-transform hover:scale-105 duration-300">`;
            galleryGrid.appendChild(div);
        });
    } else if (data.Thumb) {
        galleryGrid.innerHTML = `<div><img src="${data.Thumb}" alt="${displayTitle}" class="w-full h-64 object-cover rounded-xl shadow-md"></div>`;
    } else {
        galleryGrid.innerHTML = '<p class="text-gray-400 italic col-span-full text-center">No images available in gallery.</p>';
    }

    // Highlights (Mocked for now since schema might not have it)
    const highlightsGrid = document.getElementById('key-highlights-grid');
    highlightsGrid.innerHTML = `
        <div class="bg-white p-4 rounded-md shadow-sm border border-gray-200 flex items-center gap-3">
            <i data-lucide="shield" class="text-blue-600"></i>
            <span>Historic Fortification</span>
        </div>
        <div class="bg-white p-4 rounded-md shadow-sm border border-gray-200 flex items-center gap-3">
            <i data-lucide="mountain" class="text-green-600"></i>
            <span>Strategic Strategic Location</span>
        </div>
    `;

    // Render Map
    if (window.google && window.google.maps) {
        renderMap(data);
    }

    if (window.lucide) window.lucide.createIcons();
}

function renderMap(data) {
    const lat = parseFloat(data.latitude);
    const lng = parseFloat(data.longitude);
    const mapElement = document.getElementById('map');

    if (isNaN(lat) || isNaN(lng)) {
        mapElement.innerHTML = '<div class="flex items-center justify-center h-full text-gray-400 italic bg-gray-50 rounded-xl">Map coordinates not available.</div>';
        return;
    }

    const pos = { lat, lng };
    map = new google.maps.Map(mapElement, {
        center: pos,
        zoom: 15,
        mapTypeControl: false,
    });

    new google.maps.Marker({
        position: pos,
        map: map,
        title: data.Title
    });
}

document.addEventListener('DOMContentLoaded', fetchFortDataAndRender);
