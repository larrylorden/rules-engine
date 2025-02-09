// client/src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar.tsx';
import Recommendations from './components/Recommendations.tsx';
import ProductGroups from './components/ProductGroups.tsx';
import RulesManagement from './components/RulesManagement.tsx';
import TestInterface from './components/TestInterface.tsx';

const App: React.FC = () => {
  return (
    <Router>
      <NavBar />
      <Routes>
        <Route path="/recommendations" element={<Recommendations />} />
        <Route path="/product-groups" element={<ProductGroups />} />
        <Route path="/rules-management" element={<RulesManagement />} />
        <Route path="/test-interface" element={<TestInterface />} />
        {/* Default route */}
        <Route path="*" element={<Recommendations />} />
      </Routes>
    </Router>
  );
};

export default App;