import ReactDOM from 'react-dom';
import App from './App';
import { Amplify } from 'aws-amplify';
import awsExports from './aws-exports';
import { Authenticator } from '@aws-amplify/ui-react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import '@aws-amplify/ui-react/styles.css';
import './index.css';
import { MarketingPage } from './components/MarketingPage';
import { SmsConsent } from  './components/SmsConsent';

Amplify.configure(awsExports);

ReactDOM.render(
  <Authenticator.Provider>
    <Router>
      <Routes>
        {/* Public route for marketing page */}
        <Route path="/" element={<MarketingPage />} />
        <Route path="/sms-consent" element={<SmsConsent />} />
        {/* Authenticated routes */}
        <Route 
          path="/app/*" 
          element={
            <Authenticator>
               <App />
            </Authenticator>
          } 
        />
      </Routes>
    </Router>
  </Authenticator.Provider>,
  document.getElementById('root')
);
