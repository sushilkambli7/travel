import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

// Your web app's Firebase configuration
import { firebaseConfig } from "./firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

function renderCategories(types) {
    const container = document.getElementById('footer-categories');
    if (!container) return;

    container.innerHTML = '';

    // Default categories if nothing is found (optional, but good for UI)
    if (types.length === 0) {
        types = ["Historical", "Nature", "Adventure", "Religious", "Urban"];
    }

    types.sort().forEach(type => {
        const li = document.createElement('li');
        // We'll use a link that filters on the places page
        // If the places page doesn't support a 'type' param yet, we can add it later or just make them spans for now
        // But the user asked for dynamic categories, implying they should be useful.
        const a = document.createElement('a');
        a.href = `places.html?type=${encodeURIComponent(type)}`;
        a.className = "text-gray-400 hover:text-white transition-colors capitalize";
        a.textContent = type;
        li.appendChild(a);
        container.appendChild(li);
    });
}

const placesRef = ref(db, 'Place');
onValue(placesRef, (snapshot) => {
    if (snapshot.exists()) {
        const data = snapshot.val();
        const types = new Set();

        Object.values(data).forEach(place => {
            if (place.Type) {
                // If Type is a string, add it
                if (typeof place.Type === 'string') {
                    types.add(place.Type.trim());
                } else if (Array.isArray(place.Type)) {
                    place.Type.forEach(t => types.add(t.trim()));
                }
            }
        });

        renderCategories(Array.from(types));
    } else {
        renderCategories([]);
    }
});
