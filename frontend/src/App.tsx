import React from 'react';
import DreamList from './components/DreamList';
import { WakingLife } from './components/WakingLife';
import { withAuthenticator } from '@aws-amplify/ui-react';
import {signOut} from 'aws-amplify/auth'

function App() {
  return (
    <div className="App" style={{ "padding": ".5rem", width: "100%"}}>
      <button onClick={() => signOut()}>sign out</button>
      <h1>Dream Companion</h1>

        <WakingLife />
        <DreamList />
    </div>
  );
}

export default withAuthenticator(App);
