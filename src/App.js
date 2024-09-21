import React from 'react';
import { BrowserRouter as Router, Route, Link, Routes } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Container, Button, Box } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import UserPage from './components/UserPage';
import BuyerPage from './components/BuyerPage';
import icon from './assets/icon128.png'; // Make sure to put your icon in the src/assets folder

const theme = createTheme({
  palette: {
    primary: {
      main: '#3f51b5',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <AppBar position="static">
          <Toolbar>
            <img src={icon} alt="Ollie Cookies" style={{ width: 40, marginRight: 10 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Ollie Cookies Marketplace
            </Typography>
            <Button color="inherit" component={Link} to="/user">User</Button>
            <Button color="inherit" component={Link} to="/buyer">Buyer</Button>
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Routes>
            <Route path="/user" element={<UserPage />} />
            <Route path="/buyer" element={<BuyerPage />} />
            <Route path="/" element={
              <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Typography variant="h4" gutterBottom>
                  Welcome to Ollie Cookies Marketplace
                </Typography>
                <Typography variant="body1">
                  Please select a page from the navigation bar above.
                </Typography>
              </Box>
            } />
          </Routes>
        </Container>
      </Router>
    </ThemeProvider>
  );
}

export default App;