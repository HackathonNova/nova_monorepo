import React, { useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';

const App: React.FC = () => {
  const [showLogin, setShowLogin] = useState(false);

  return showLogin ? <Dashboard /> : <LandingPage onEnter={() => setShowLogin(true)} />;
};

export default App;
