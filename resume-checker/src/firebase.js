// Import the functions we need from Firebase
import { initializeApp } from "firebase/app"
import { getAuth, GoogleAuthProvider } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

// Your Firebase config — these are safe to have in code
// (unlike API keys, Firebase config is meant to be public)
const firebaseConfig = {
  apiKey: "AIzaSyDabrdGQJrKWEv-acJ6J5JV94ryQ6yCIjg",
  authDomain: "ai-resume-analyzer-ad529.firebaseapp.com",
  projectId: "ai-resume-analyzer-ad529",
  storageBucket: "ai-resume-analyzer-ad529.firebasestorage.app",
  messagingSenderId: "783942219549",
  appId: "1:783942219549:web:54fee00719c937fde553f4",
  measurementId: "G-3X9Q093SCG"
}

// Initialize Firebase — this connects our app to Firebase
const app = initializeApp(firebaseConfig)

// auth handles everything related to login/logout
export const auth = getAuth(app)

// GoogleAuthProvider is what powers the Google sign in button
export const googleProvider = new GoogleAuthProvider()

// db is our Firestore database — we use this to save and read data
export const db = getFirestore(app)