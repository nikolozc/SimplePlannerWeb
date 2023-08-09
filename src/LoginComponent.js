import React from 'react';
import { auth } from './firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import './styles/LoginComponent.css';

function LoginComponent() {
  const signInWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider);
  };

  return (
    <div className="container">
      <h2>Welcome to SimplePlanner</h2>
      <p>Please sign in to continue:</p>
      <button className="button" onClick={signInWithGoogle}>Sign in with Google</button>
    </div>
  );
}

export default LoginComponent;