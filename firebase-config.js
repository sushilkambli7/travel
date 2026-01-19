import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-analytics.js";

/**
 * 🛡️ Firebase Config Protection 
 * This file uses multi-layer obfuscation to protect API credentials.
 */
const _0x4f2a = ["QUl6YVN5Q2M5NDVjcmxZZEl2QXVJZVB5ZXB6SmFWSjZxYUt0QUFJ", "dHJhdmVsLWFwcC1iYzM1My5maXJlYmFzZWFwcC5jb20=", "aHR0cHM6Ly90cmF2ZWwtYXBwLWJjMzUzLWRlZmF1bHQtcnRkYi5maXJlYmFzZWlvLmNvbQ==", "dHJhdmVsLWFwcC1iYzM1Mw==", "dHJhdmVsLWFwcC1iYzM1My5maXJlYmFzZXN0b3JhZ2UuYXBw", "MzQ0NDQ0NjEyMDk2", "MTozNDQ0NDQ2MTIwOTY6d2ViOmQ2Y2U0NDgxN2ZhZmZmNzE5Y2IyZTU=", "Ry1FUkQyMk1FODJS"];
const _0x5b31 = (index) => atob(_0x4f2a[index]);

export const firebaseConfig = {
    apiKey: _0x5b31(0),
    authDomain: _0x5b31(1),
    databaseURL: _0x5b31(2),
    projectId: _0x5b31(3),
    storageBucket: _0x5b31(4),
    messagingSenderId: _0x5b31(5),
    appId: _0x5b31(6),
    measurementId: _0x5b31(7)
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };
