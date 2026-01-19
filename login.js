import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import {
    getAuth,
    signInWithPopup,
    GoogleAuthProvider,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();

const statusMessage = document.getElementById('status-message');
const loginForm = document.getElementById('login-form');
const googleBtn = document.getElementById('google-login-btn');
const signupLink = document.getElementById('signup-link');

function showMessage(text, type = 'error') {
    statusMessage.textContent = text;
    statusMessage.className = `mt-4 p-4 rounded-lg text-center font-medium ${type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`;
    statusMessage.classList.remove('hidden');

    // Hide after 5 seconds if success
    if (type === 'success') {
        setTimeout(() => {
            statusMessage.classList.add('hidden');
        }, 5000);
    }
}

// Check if already logged in
onAuthStateChanged(auth, (user) => {
    if (user) {
        window.location.href = 'index.html';
    }
});

// Google Login
googleBtn.addEventListener('click', async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        console.log('Login success:', result.user);
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Google login error:', error);
        showMessage(error.message);
    }
});

// Email Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Email login error:', error);
        if (error.code === 'auth/user-not-found') {
            showMessage("No user found with this email. Try creating an account.");
        } else if (error.code === 'auth/wrong-password') {
            showMessage("Incorrect password.");
        } else {
            showMessage(error.message);
        }
    }
});

// Signup Toggle (Simple version: just changes button text for now)
let isSignup = false;
signupLink.addEventListener('click', (e) => {
    e.preventDefault();
    isSignup = !isSignup;
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    const title = document.querySelector('h1');
    const subtitle = document.querySelector('p.text-gray-600');

    if (isSignup) {
        title.textContent = 'Create Account';
        subtitle.textContent = 'Join Pirates Droid and start exploring';
        submitBtn.textContent = 'Sign Up';
        signupLink.textContent = 'Sign In';
        document.querySelector('p.text-sm.text-gray-600').firstChild.textContent = 'Already have an account? ';
    } else {
        title.textContent = 'Welcome Back';
        subtitle.textContent = 'Sign in to continue your journey';
        submitBtn.textContent = 'Sign In';
        signupLink.textContent = 'Create account';
        document.querySelector('p.text-sm.text-gray-600').firstChild.textContent = "Don't have an account? ";
    }
});

// Modified login form to handle signup
loginForm.onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        if (isSignup) {
            await createUserWithEmailAndPassword(auth, email, password);
            showMessage("Account created successfully! Redirecting...", "success");
        } else {
            await signInWithEmailAndPassword(auth, email, password);
        }
        // Redirect will be handled by onAuthStateChanged or after delay
    } catch (error) {
        showMessage(error.message);
    }
};
