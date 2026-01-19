// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getDatabase, ref, get, child, set, remove, onValue } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import { firebaseConfig } from "./firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

let currentPlaceData = null;
let currentUser = null;
let isFavorited = false;
let map = null;
let marker = null;

// Global callback for Google Maps API
window.initMap = function () {
  console.log("Place.js: Google Maps API loaded.");
  if (currentPlaceData) {
    renderMap(currentPlaceData);
  }
};

// Check if Maps is already loaded (in case script finishes before window.initMap is set)
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

  // 2. Prepare search candidates: Title components and Address parts
  const candidates = [];
  if (title) candidates.push(title.split(',')[0].trim());
  if (address) {
    const parts = address.split(',').map(p => p.trim()).filter(p => p.length > 2);
    candidates.push(...parts.reverse()); // Try from most specific/last parts (usually city/district)
  }

  // Remove duplicates and try searching
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
            District: po.District,
            State: po.State,
            Region: po.Region
          };
        }
      }
    } catch (err) {
      console.warn(`Pincode fetch failed for ${name}:`, err);
    }
  }
  return null;
}

// --- Favorite Functionality ---
function setupFavoriteButton(placeId) {
  const favoriteBtn = document.getElementById('favorite-btn');
  if (!favoriteBtn) return;

  console.log("Setting up favorite button for:", placeId);

  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    console.log("Auth state changed in Place.js:", user ? user.uid : "None");
    if (user) {
      // Check if favorited
      const favRef = ref(db, `Favorite/Place/${user.uid}/${placeId}`);
      onValue(favRef, (snapshot) => {
        isFavorited = snapshot.exists() && snapshot.val() === true;
        console.log("Favorite state for", placeId, ":", isFavorited);
        updateFavoriteUI();
      });
    } else {
      isFavorited = false;
      updateFavoriteUI();
    }
  });

  favoriteBtn.addEventListener('click', async () => {
    console.log("Favorite button clicked. CurrentUser:", currentUser ? currentUser.uid : "None");
    if (!currentUser) {
      alert("Please login to add favorites.");
      window.location.href = 'login.html';
      return;
    }

    const favRef = ref(db, `Favorite/Place/${currentUser.uid}/${placeId}`);
    try {
      if (isFavorited) {
        console.log("Removing favorite...");
        await remove(favRef);
      } else {
        console.log("Adding favorite...");
        await set(favRef, true);
      }
    } catch (error) {
      console.error("Error updating favorite:", error);
      alert("Failed to update favorite. Check console for details.");
    }
  });

  function updateFavoriteUI() {
    const icon = document.getElementById('favorite-icon');
    const text = document.getElementById('favorite-text');

    if (!icon || !text) return;

    if (isFavorited) {
      icon.classList.add('fill-current', 'text-red-500');
      text.textContent = 'Favorited';
      favoriteBtn.classList.add('bg-red-500/20', 'border-red-500/50');
      favoriteBtn.classList.remove('bg-white/20', 'border-white/30');
    } else {
      icon.classList.remove('fill-current', 'text-red-500');
      text.textContent = 'Add to Favorites';
      favoriteBtn.classList.remove('bg-red-500/20', 'border-red-500/50');
      favoriteBtn.classList.add('bg-white/20', 'border-white/30');
    }

    // Ensure icon is always shown even after state changes
    if (window.lucide) window.lucide.createIcons();
  }
}

async function fetchPlaceDataAndRender() {
  const placeId = getQueryParam('link'); // Get the 'link' query parameter
  if (!placeId) {
    console.error("Place.js: No 'link' query parameter found in URL.");
    return;
  }
  console.log("Place.js: Fetching data for placeId:", placeId);

  // Set up favorite logic
  setupFavoriteButton(placeId);

  const dbRef = ref(db);
  try {
    const snapshot = await get(child(dbRef, `Place/${placeId}`));
    if (snapshot.exists()) {
      let data = snapshot.val();
      // Handle case where data might be an array with a single object
      if (Array.isArray(data) && data.length > 0) {
        data = data[0];
      }
      currentPlaceData = data;
      console.log("Place.js: Processed place data:", currentPlaceData);

      // Explicitly log latitude and longitude as requested
      console.log("%c >>> FIREBASE COORDINATES <<< ", "background: #222; color: #bada55; font-size: 14px; font-weight: bold;");
      console.log("Latitude:", currentPlaceData.latitude);
      console.log("Longitude:", currentPlaceData.longitude);

      renderPlaceDetails(currentPlaceData);
      fetchAlsoLike(placeId, currentPlaceData.Type);
    } else {
      console.log("Place.js: No data available for this place ID:", placeId);
      const descEl = document.getElementById('descriptions-container');
      if (descEl) descEl.textContent = "Place details not found.";
    }
  } catch (error) {
    console.error("Place.js: Error fetching place data:", error);
    const descEl = document.getElementById('descriptions-container');
    if (descEl) descEl.textContent = "Error loading data. Please try again later.";
  }
}

// document.addEventListener('DOMContentLoaded', fetchPlaceDataAndRender); // Moved to end of file and consolidated

// Language selector logic removed as all descriptions are now shown simultaneously

function renderAllDescriptions(data) {
  const container = document.getElementById('descriptions-container');
  if (!container) return;

  container.innerHTML = ''; // Clear loading state

  if (data.Descriptions && Object.keys(data.Descriptions).length > 0) {
    Object.entries(data.Descriptions).forEach(([lang, content]) => {
      const section = document.createElement('div');
      section.className = 'bg-gray-50 p-6 rounded-xl border border-gray-100 shadow-sm';
      section.innerHTML = `
                <h4 class="text-lg font-bold text-blue-600 mb-3 flex items-center gap-2">
                    <i data-lucide="languages" class="h-5 w-5"></i>
                    ${lang} Description
                </h4>
                <p class="text-gray-700 leading-relaxed whitespace-pre-line">${content.Description}</p>
            `;
      container.appendChild(section);
    });
  } else {
    const fallback = document.createElement('p');
    fallback.className = 'text-gray-700 leading-relaxed';
    fallback.textContent = data.Desc || "No description available.";
    container.appendChild(fallback);
  }

  if (window.lucide) window.lucide.createIcons();
}

function renderPlaceDetails(data) {
  // Update Page Title and SEO Meta Tags
  const displayTitle = data.Title || "Destination";
  document.title = displayTitle;

  // Extract description for meta tags (prioritize Descriptions object if available)
  let metaDescString = "";
  if (data.Descriptions && Object.keys(data.Descriptions).length > 0) {
    // Get the first available description
    metaDescString = Object.values(data.Descriptions)[0].Description;
  } else {
    metaDescString = data.Desc || "Discover amazing places with Pirates Droid.";
  }

  // Clean description: limit length and remove extra whitespace
  const metaDesc = metaDescString.substring(0, 160).trim() + (metaDescString.length > 160 ? "..." : "");

  const pageUrl = window.location.href;
  const thumbImage = data.Thumb || 'header_banner.jpg';

  // Update Meta Tags
  document.getElementById('meta-description')?.setAttribute('content', metaDesc);

  // OG Tags
  document.getElementById('og-title')?.setAttribute('content', displayTitle);
  document.getElementById('og-description')?.setAttribute('content', metaDesc);
  document.getElementById('og-image')?.setAttribute('content', thumbImage);
  document.getElementById('og-url')?.setAttribute('content', pageUrl);

  // Twitter Tags
  document.getElementById('twitter-title')?.setAttribute('content', displayTitle);
  document.getElementById('twitter-description')?.setAttribute('content', metaDesc);
  document.getElementById('twitter-image')?.setAttribute('content', thumbImage);
  document.getElementById('twitter-url')?.setAttribute('content', pageUrl);

  // Update Hero Section
  document.getElementById('place-title').textContent = displayTitle;
  document.getElementById('place-address').textContent = data.Add || "";

  // Synchronize Page Title
  document.title = displayTitle;

  if (data.Thumb) {
    document.getElementById('hero-image').style.backgroundImage = `url('${data.Thumb}')`;
  }

  // Add click handlers for scrolling
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  document.getElementById('hero-view-on-map')?.addEventListener('click', () => scrollTo('map'));
  document.getElementById('sidebar-view-on-map')?.addEventListener('click', () => scrollTo('map'));
  document.getElementById('hero-photo-gallery')?.addEventListener('click', () => scrollTo('gallery-grid'));
  document.getElementById('sidebar-photo-gallery')?.addEventListener('click', () => scrollTo('gallery-grid'));

  // Update Descriptions
  renderAllDescriptions(data);
  document.getElementById('about-title').textContent = `About ${data.Title || 'this place'}`;

  // Update Quick Info
  const ratingElement = document.querySelector('.rating strong');
  if (ratingElement) ratingElement.innerHTML = `Rating: ${data.rating || 'N/A'}/5`;

  document.getElementById('quick-info-location').innerHTML = `<strong>Location:</strong> ${data.Add || 'Unknown'}`;
  document.getElementById('quick-info-category').innerHTML = `<strong>Category:</strong> ${data.Type || 'Place'}`;

  const tagsStr = Array.isArray(data.Tags) ? data.Tags.join(', ') : (data.Tag || 'N/A');
  document.getElementById('quick-info-tags').innerHTML = `<strong>Tags:</strong> ${tagsStr}`;

  // Fetch and Update Pincode
  fetchPincodeInfo(data.Title, data.Add).then(info => {
    const el = document.getElementById('quick-info-pincode');
    if (el) {
      if (info) {
        let display = `<strong>Pincode:</strong> ${info.Pincode}`;
        if (info.District) display += ` <span class="text-xs text-gray-500">(${info.District})</span>`;
        el.innerHTML = display;
        el.style.display = 'block';
      } else {
        el.style.display = 'none';
      }
    }
  });

  // Coordinates removed from Quick Info as per user request

  // Update AI Insights
  if (data.aiInsights) {
    document.getElementById('insight-best-time').textContent = data.aiInsights.bestTime || 'N/A';
    document.getElementById('insight-budget').textContent = data.aiInsights.budget || 'N/A';
    document.getElementById('insight-crowd').textContent = data.aiInsights.crowd || 'N/A';
    document.getElementById('insight-duration').textContent = data.aiInsights.duration || 'N/A';
    document.getElementById('insight-food').textContent = Array.isArray(data.aiInsights.food) ? data.aiInsights.food.join(', ') : (data.aiInsights.food || 'N/A');
    document.getElementById('insight-fun-fact').textContent = data.aiInsights.funFact || 'N/A';

    const tipsList = document.getElementById('insight-tips');
    tipsList.innerHTML = '';
    if (Array.isArray(data.aiInsights.tips) && data.aiInsights.tips.length > 0) {
      data.aiInsights.tips.forEach(tip => {
        const li = document.createElement('li');
        li.textContent = tip;
        tipsList.appendChild(li);
      });
    } else {
      tipsList.innerHTML = '<li>No tips available</li>';
    }

    const photoSpotsList = document.getElementById('insight-photo-spots');
    photoSpotsList.innerHTML = '';
    if (Array.isArray(data.aiInsights.photoSpots) && data.aiInsights.photoSpots.length > 0) {
      data.aiInsights.photoSpots.forEach(spot => {
        const li = document.createElement('li');
        li.textContent = spot;
        photoSpotsList.appendChild(li);
      });
    } else {
      photoSpotsList.innerHTML = '<li>No photo spots available</li>';
    }
  }

  // Update Gallery
  const galleryGrid = document.getElementById('gallery-grid');
  galleryGrid.innerHTML = '';
  if (Array.isArray(data.Images) && data.Images.length > 0) {
    data.Images.forEach(imgUrl => {
      const galleryItem = document.createElement('div');
      galleryItem.classList.add('gallery-item');
      galleryItem.innerHTML = `<img src="${imgUrl}" alt="${data.Title} Image" class="w-full h-64 object-cover rounded-xl shadow-md transition-transform hover:scale-105 duration-300">`;
      galleryGrid.appendChild(galleryItem);
    });
  } else {
    galleryGrid.innerHTML = '<p class="text-gray-400 italic col-span-full text-center">No images available in gallery.</p>';
  }

  // Render Map
  console.log("Place.js: Data for map rendering:", { title: data.Title, lat: data.latitude, lng: data.longitude });
  if (window.google && window.google.maps) {
    renderMap(data);
  }

  // Refresh Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }
}
function renderMap(data) {
  // Priority: latitude/longitude, then lat/long, then lat/lng
  // Support the structure provided: "latitude": 16.7184, "longitude": 73.3494
  const latField = data.latitude;
  const lngField = data.longitude;

  console.log("Place.js renderMap: Raw input latitude:", latField, "longitude:", lngField);

  const lat = parseFloat(latField !== undefined ? latField : (data.lat !== undefined ? data.lat : NaN));
  const lng = parseFloat(lngField !== undefined ? lngField : (data.long !== undefined ? data.long : (data.lng !== undefined ? data.lng : NaN)));

  console.log("Place.js renderMap: Parsed Map Coordinates - Lat:", lat, "Lng:", lng);

  const mapElement = document.getElementById('map');
  if (!mapElement) return;

  if (isNaN(lat) || isNaN(lng)) {
    console.warn("Place.js: Invalid coordinates for map:", data.latitude, data.longitude);
    mapElement.innerHTML = '<div class="flex items-center justify-center h-full text-gray-400 italic bg-gray-50 rounded-xl">Map coordinates not available for this location.</div>';
    return;
  }

  const pos = { lat, lng };
  console.log("Place.js: Initializing map at:", pos);

  try {
    map = new google.maps.Map(mapElement, {
      center: pos,
      zoom: 14,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });

    marker = new google.maps.Marker({
      position: pos,
      map: map,
      title: data.Title || "Destination",
      animation: google.maps.Animation.DROP
    });
  } catch (error) {
    console.error("Place.js: Error initializing map:", error);
  }
}

async function fetchAlsoLike(currentPlaceId, currentType) {
  const alsoLikeGrid = document.getElementById('also-like-grid');
  if (!alsoLikeGrid) return;

  const dbRef = ref(db);
  try {
    const snapshot = await get(child(dbRef, 'Place'));
    if (snapshot.exists()) {
      const allPlaces = snapshot.val();
      const placesList = [];

      // Convert object to list and filter out current place
      Object.entries(allPlaces).forEach(([id, data]) => {
        if (id !== currentPlaceId) {
          placesList.push({ id, ...data });
        }
      });

      // Sort: prioritize same type, then shuffle
      const related = placesList.filter(p => p.Type === currentType);
      const others = placesList.filter(p => p.Type !== currentType);

      // Shuffle helper
      const shuffle = (array) => array.sort(() => Math.random() - 0.5);

      const itemsToShow = [...shuffle(related), ...shuffle(others)].slice(0, 3);

      alsoLikeGrid.innerHTML = '';
      itemsToShow.forEach(place => {
        const card = document.createElement('div');
        card.className = 'place-card cursor-pointer';
        card.onclick = () => window.location.href = `Place.html?link=${place.id}`;

        const thumb = place.Thumb || 'header_banner.jpg';
        const rating = place.rating || 'N/A';
        const address = place.Add || 'Unknown';

        card.innerHTML = `
                    <img src="${thumb}" alt="${place.Title}" class="w-full h-48 object-cover rounded-t-md mb-4">
                    <h4 class="text-xl font-semibold text-gray-800">${place.Title}</h4>
                    <p class="text-gray-600">${address}</p>
                    <p class="rating text-green-500 font-semibold">${rating}</p>
                    <p class="text-gray-600 line-clamp-2">${place.Desc || ""}</p>
                `;
        alsoLikeGrid.appendChild(card);
      });
    }
  } catch (error) {
    console.error("Place.js: Error fetching 'Also Like' data:", error);
  }
}

// In fetchPlaceDataAndRender, add: fetchAlsoLike(placeId, currentPlaceData.Type); after renderPlaceDetails(currentPlaceData);
// I will apply this in a separate chunk to be safe.

document.addEventListener('DOMContentLoaded', fetchPlaceDataAndRender);
