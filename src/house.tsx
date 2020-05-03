import * as React from 'react';
import { render } from "react-dom";
import { AppContextProvider, AppContext } from './providers/spreadsheet';
import { GoogleDriveProvider } from './providers/drive';
import config from '../../packages/google-sheet-config.json';
import { SheetView } from './components/sheet-view';
import { caseSwitch } from './utils';

declare const gapi;
declare const document;
declare const window;


const DISCOVERY_DOCS = [
    "https://sheets.googleapis.com/$discovery/rest?version=v4",
    "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"
];

const SCOPE = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive'
].join(' ');

const CONFIG = {
    spreadsheetId: '18W23nlOPChrQETYsceMlLKa4pJLz5zIIYjkHJDUNR9U',
    clientId: '1063583421956-852nj4u4i2rqkba8m4htv41u4p6paqmg.apps.googleusercontent.com',
    apiKey: 'AIzaSyBEdZoWbKSnukIZ0DWLMACjgjA8NYQn4Lc',
    scope: SCOPE,
    discoveryDocs: DISCOVERY_DOCS,
};

const InitialScreenComponent = () => {
    const { state, dispatch } = React.useContext(AppContext);
    return !!state.sheet.id ? <SheetView sheet={state.sheet} isSignedIn={state.isSignedIn} addItem={(item) => dispatch({ type: 'add-item', item })} /> : null;
}

const App = () => {
    const [sheetId, dispatchSheetId] = React.useState(null);

    React.useEffect(() => {
        const params = (new URL(document.location)).searchParams;
        const name = params.get("sheet");

        if (!sheetId && name) {
            dispatchSheetId(name);
        }
    }, [])


    return <AppContextProvider apiKey={CONFIG.apiKey} clientId={CONFIG.clientId} scope={CONFIG.scope} discoveryDocs={CONFIG.discoveryDocs} spreadsheetId={sheetId}  >
        <InitialScreenComponent />
    </AppContextProvider>;
};

const start = () => {

    render((
        <App />
    ), document.querySelector('#app'));

}

gapi.load('client:auth2', start);
