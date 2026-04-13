// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA1RE1tjCQNi_F1lvaUnmV9VPhcF5L7FAc",
  authDomain: "decideforus-ebc07.firebaseapp.com",
  projectId: "decideforus-ebc07",
  appId: "1:902400606616:web:4c84843c02f7b846072bed",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
