// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB81PetYNI3B4amuHGkYyMpflZPvAxpio0",
  authDomain: "simple-planner-487fd.firebaseapp.com",
  projectId: "simple-planner-487fd",
  storageBucket: "simple-planner-487fd.appspot.com",
  messagingSenderId: "939095767809",
  appId: "1:939095767809:web:df6ab5d882b6a0a62b3900",
  measurementId: "G-3L6H1KPRN1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);
export { auth };