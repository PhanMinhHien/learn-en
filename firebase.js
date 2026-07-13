// firebase.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";

import {
    getFirestore,
    collection
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyBLstzXnRQAq36gn38C6PFgDCud2qwdxo8",
    authDomain: "english-journey-3458a.firebaseapp.com",
    projectId: "english-journey-3458a",
    storageBucket: "english-journey-3458a.firebasestorage.app",
    messagingSenderId: "966616195855",
    appId: "1:966616195855:web:ace115a2d0baa0f7e7547a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firestore
export const db = getFirestore(app);

// Collections
export const usersCollection = collection(db, "users");