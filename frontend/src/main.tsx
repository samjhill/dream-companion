import ReactDOM from 'react-dom';
import App from './App';
import { Amplify } from 'aws-amplify';
import awsExports from './aws-exports';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import './index.css';

Amplify.configure(awsExports);

ReactDOM.render(
  <Authenticator.Provider>
    <App />
  </Authenticator.Provider>,
  document.getElementById('root')
);
