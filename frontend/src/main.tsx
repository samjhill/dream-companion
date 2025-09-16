import { createRoot } from 'react-dom/client';
import App from './App';
import { Amplify } from 'aws-amplify';
import awsExports from './aws-exports';
import { Authenticator } from '@aws-amplify/ui-react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import '@aws-amplify/ui-react/styles.css';
import './index.css';
import { MarketingPage } from './components/MarketingPage';
import { SmsConsent } from './components/SmsConsent';

Amplify.configure(awsExports);

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);

root.render(
  <Authenticator.Provider>
    <Router>
      <Routes>
        {/* Public route for marketing page */}
        <Route path="/" element={<MarketingPage />} />
        <Route path="/sms-consent" element={<SmsConsent />} />
        {/* Authenticated routes */}
        <Route
          path="/app"
          element={
            <Authenticator>
               <App />
            </Authenticator>
          }
        />
        <Route
          path="/app/:section"
          element={
            <Authenticator>
               <App />
            </Authenticator>
          }
        />
        {/* Catch-all route for any unmatched paths */}
        <Route
          path="*"
          element={
            <Authenticator>
               <App />
            </Authenticator>
          }
        />
      </Routes>
    </Router>
  </Authenticator.Provider>
);
