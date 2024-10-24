// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBceAm1vt9u4F8ecttTLefjQy1LbFxvKbQ",
  authDomain: "nextupmvp.firebaseapp.com",
  projectId: "nextupmvp",
  storageBucket: "nextupmvp.appspot.com",
  messagingSenderId: "961851004001",
  appId: "1:961851004001:web:245b7e530dff50970d4620",
  measurementId: "G-E7ZYVS8JSV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
export const db = getFirestore();
export const storage = getStorage();