import DreamList from './components/DreamList';
import { WakingLife } from './components/WakingLife';
import { Themes } from './components/Themes';
import { Greet } from './components/Greet';
import { withAuthenticator } from '@aws-amplify/ui-react';
import {signOut} from 'aws-amplify/auth'
import { LucidDreamGuide } from './components/LucidDreamGuide';

function App() {
  return (
    <div className="App" style={{ "padding": ".5rem", width: "100%"}}>
      <button onClick={() => signOut()}>sign out</button>
        <Greet />
        <LucidDreamGuide />
        <Themes />
        <WakingLife />
        <DreamList />
    </div>
  );
}

export default withAuthenticator(App);
