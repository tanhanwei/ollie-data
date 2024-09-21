# Ollie Cookies

## Overview

Ollie Cookies is a revolutionary project that aims to transform the way we interact with online data. It's a privacy-preserving data marketplace that allows users to monetize their browsing data while maintaining anonymity and control over their personal information.

## Features

- **Chrome Extension**: Collect browsing data anonymously and securely.
- **World ID Integration**: Ensure user authenticity while preserving privacy.
- **Data Marketplace**: A platform for users to sell their anonymized data.
- **Privacy-First Approach**: All data is encrypted and anonymized.
- **Blockchain-Based**: Utilizing Oasis Network for secure and transparent transactions.

## Components

1. **Chrome Extension**: Collects browsing data and interfaces with World ID for authentication.
2. **Frontend Application**: React-based web app for user interaction with the marketplace.
3. **Backend Server**: Handles data storage, processing, and marketplace operations.
4. **Smart Contracts**: Manage transactions and data ownership on the Oasis Network.

## Setup Instructions

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Google Chrome browser
- MetaMask extension (for interacting with blockchain features)

### Chrome Extension Setup

1. Clone the repository:
   ```
   git clone https://github.com/your-username/ollie-cookies.git
   cd ollie-cookies/chrome-extension
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Build the extension:
   ```
   npm run build
   ```

4. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `build` directory

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd ../frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd ../backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Fill in the required values

4. Start the server:
   ```
   npm start
   ```

## Usage

1. Install the Chrome extension and log in using World ID.
2. Browse the web as normal. The extension will collect anonymized data.
3. Visit the Ollie Cookies marketplace website to view your collected data and potential earnings.
4. Data buyers can browse available datasets and make purchases.

## Technology Stack

- Frontend: React, Material-UI
- Backend: Node.js, Express
- Database: MongoDB
- Blockchain: Oasis Network
- Authentication: World ID
- Chrome Extension: JavaScript

## Future Developments

- Implementation of data purchase transactions
- User reward distribution system
- Integration with Oasis Sapphire ParaTime for enhanced privacy features
- Mobile app for on-the-go data management

## Contributing

We welcome contributions to Ollie Cookies! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) file for details on how to get involved.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Contact

For any queries or support, please contact us at support@olliecookies.com.

---

Ollie Cookies - Empowering users in the data economy, one cookie at a time!