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
    <div className="login-container">
        <div className="login-content">
            <h1 className="login-header">Welcome to SimplePlanner</h1>
            <button className="google-signin-button" onClick={signInWithGoogle}>
                Sign in with Google
            </button>
        </div>
    </div>
);
}

export default LoginComponent;