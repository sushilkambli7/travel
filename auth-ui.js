import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

document.addEventListener('DOMContentLoaded', () => {
    const desktopNav = document.querySelector('.md\\:flex.items-center.space-x-4');
    const mobileNav = document.getElementById('mobile-menu');

    onAuthStateChanged(auth, (user) => {
        updateDesktopHeader(user, desktopNav);
        updateMobileHeader(user, mobileNav);
    });
});

function updateDesktopHeader(user, container) {
    if (!container) return;

    // Clear previous auth elements
    const existingAuthBtn = container.querySelector('.auth-btn');
    if (existingAuthBtn) existingAuthBtn.remove();

    if (user) {
        // User is signed in
        const profileDiv = document.createElement('div');
        profileDiv.className = 'auth-btn flex items-center gap-3 ml-4 bg-gray-50 p-1 pr-3 rounded-full border border-gray-200';
        profileDiv.innerHTML = `
            <img src="${user.photoURL || 'https://ui-avatars.com/api/?name=' + (user.displayName || 'User')}" class="h-8 w-8 rounded-full border border-white shadow-sm">
            <span class="text-xs font-semibold text-gray-700">${user.displayName || user.email.split('@')[0]}</span>
            <button id="logout-btn" class="text-xs text-red-500 hover:text-red-700 font-medium">Logout</button>
        `;
        container.appendChild(profileDiv);

        document.getElementById('logout-btn')?.addEventListener('click', () => {
            signOut(auth);
        });
    } else {
        // User is signed out
        const loginLink = document.createElement('a');
        loginLink.href = 'login.html';
        loginLink.className = 'auth-btn';
        loginLink.innerHTML = `
            <button class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 hover:bg-blue-700 text-white h-9 px-4">
                Login
            </button>
        `;
        container.appendChild(loginLink);
    }
}

function updateMobileHeader(user, container) {
    if (!container) return;

    // Clear previous auth elements
    const existingAuthBtn = container.querySelector('.auth-btn-mobile');
    if (existingAuthBtn) existingAuthBtn.remove();

    const authContainer = document.createElement('div');
    authContainer.className = 'auth-btn-mobile pt-4 border-t mt-4';

    if (user) {
        authContainer.innerHTML = `
            <div class="flex items-center gap-4 px-2 py-3 bg-gray-50 rounded-lg">
                <img src="${user.photoURL || 'https://ui-avatars.com/api/?name=' + (user.displayName || 'User')}" class="h-10 w-10 rounded-full">
                <div class="flex-1">
                    <p class="text-sm font-bold text-gray-900">${user.displayName || 'User'}</p>
                    <p class="text-xs text-gray-500">${user.email}</p>
                </div>
                <button id="logout-btn-mobile" class="text-red-500">
                    <i data-lucide="log-out" class="h-5 w-5"></i>
                </button>
            </div>
        `;
        container.querySelector('.flex.flex-col')?.appendChild(authContainer);
        document.getElementById('logout-btn-mobile')?.addEventListener('click', () => {
            signOut(auth);
        });
    } else {
        authContainer.innerHTML = `
            <a href="login.html" class="block">
                <button class="w-full inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-10 px-4">
                    Login / Sign Up
                </button>
            </a>
        `;
        container.querySelector('.flex.flex-col')?.appendChild(authContainer);
    }

    // Refresh lucide icons
    if (window.lucide) {
        window.lucide.createIcons();
    }
}
