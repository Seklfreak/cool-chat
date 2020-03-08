import firebase from 'firebase/app';
import 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyAWzFcq6c17TH_oWnAO416LASF_T4EQdbI",
    authDomain: "experimentation-ae2e7.firebaseapp.com",
    databaseURL: "https://experimentation-ae2e7.firebaseio.com",
    projectId: "experimentation-ae2e7",
    storageBucket: "experimentation-ae2e7.appspot.com",
    messagingSenderId: "690804228354",
    appId: "1:690804228354:web:7c691d69f9286b0acfc21b"
};

firebase.initializeApp(firebaseConfig);

const store = firebase.firestore();

export {
    store,
};
