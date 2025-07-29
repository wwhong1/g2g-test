// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// import { getStorage } from 'firebase/storage'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDGUneR-eua3IOb30mIQnfHCGtXLSZFpBU",
  authDomain: "g2g-test-firebase.firebaseapp.com",
  projectId: "g2g-test-firebase",
  storageBucket: "g2g-test-firebase.firebasestorage.app",
  messagingSenderId: "979574851033",
  appId: "1:979574851033:web:8dec5f5d576d03092285c8",
  measurementId: "G-FV2NTQ7WJ7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app)
// export const storage = getStorage(app)