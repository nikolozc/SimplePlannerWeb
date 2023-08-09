import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from './firebase'; 
import './styles/MainPage.css';

function MainPage() {

    const handleLogout = async () => {
        try {
            await signOut(auth);
            console.log('Successfully signed out');
            // Redirect or do something after logging out if needed
        } catch (error) {
            console.error('Error signing out: ', error);
        }
    };

    return (
      <div className="main-container">
          <h1 className="main-header">Welcome to MainPage</h1>
          {/* Your other components or elements */}
          <button className="logout-button" onClick={handleLogout}>Logout</button>
      </div>
  );
}

export default MainPage;