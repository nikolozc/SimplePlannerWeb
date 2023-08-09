import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Redirect, Switch } from 'react-router-dom';
import { auth } from './firebase';
import LoginComponent from './LoginComponent';
import MainPage from './MainPage';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // This sets up the authentication state listener
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
    });

    // Cleanup the listener on component unmount
    return () => unsubscribe();
  }, []);

  return (
    <Router>
      <Switch>
        <Route exact path="/login">
          {isAuthenticated ? <Redirect to="/" /> : <LoginComponent />}
        </Route>
        <Route exact path="/">
          {!isAuthenticated ? <Redirect to="/login" /> : <MainPage />}
        </Route>
      </Switch>
    </Router>
  );
}

export default App;
