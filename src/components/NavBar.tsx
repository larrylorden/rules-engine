import React from 'react';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const NavBar: React.FC = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          CRU Rules Engine
        </Typography>
        <Button color="inherit" component={RouterLink} to="/recommendations">
          Recommendations
        </Button>
        <Button color="inherit" component={RouterLink} to="/product-groups">
          Product Groups
        </Button>
        <Button color="inherit" component={RouterLink} to="/rules-management">
          Rules Management
        </Button>
        <Button color="inherit" component={RouterLink} to="/test-interface">
          Test Interface
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;

