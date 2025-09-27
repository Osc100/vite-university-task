// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY!,
  authDomain: "vite-university-task.firebaseapp.com",
  projectId: "vite-university-task",
  storageBucket: "vite-university-task.firebasestorage.app",
  messagingSenderId: "497365399043",
  appId: "1:497365399043:web:81860a79a96ef9c7398036"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };





