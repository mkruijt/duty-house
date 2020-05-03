import * as React from 'react';
import config from '../../../packages/google-sheet-config.json';
import { HouseSpreadsheet } from '../models/house-sheet';
import { GoogleDriveProvider, GoogleDriveContext } from './drive';


export const AppContext = React.createContext();

const AppActionReduce = (state, action) => {
    switch (action.type) {
        case "set-id":
            state.sheet.id = action.id;
            return { ...state, sheet: state.sheet };
        case "loading":
            return { ...state, loading: true };
        case "loaded":
            return { ...state, loading: false };
        case "reset":
            return initialState;
        case "login-change":
            return { ...state, isSignedIn: action.isSignedIn };
        case "set-users":
            state.sheet.setUsers(action.users);
            return { ...state, sheet: state.sheet };
        case "set-tasks":
            state.sheet.setTasks(action.tasks);
            return { ...state, sheet: state.sheet };
        case "set-items":
            state.sheet.setActivities(action.items);
            return { ...state, sheet: state.sheet, loading: false };
        case "add-item":
            state.sheet.addActivity(action.item);
            return { ...state, sheet: state.sheet };
    }
};

export interface IAppContextProviderProps {
    spreadsheetId: string;
    discoveryDocs: string[];
    scope: string;
    apiKey: string;
    clientId: string;
    children: any;
}

const InitialAppState = {
    isLoaded: false,
    isSignedIn: false,
};


export const AppContextProvider = ({ discoveryDocs, scope, apiKey, clientId, spreadsheetId, children }: IAppContextProviderProps) => {
    const CONFIG = {
        apiKey,
        clientId,
        scope,
        discoveryDocs,
    };

    const [clientInit, clientInitDispatch] = React.useState(false);
    const [contentLoaded, contentLoadedDispatch] = React.useState(false);
    const [state, dispatch] = React.useReducer(AppActionReduce, {
        ...InitialAppState,
        sheet: new HouseSpreadsheet(spreadsheetId)
    });

    const login = () => {
        const authInstance = gapi.auth2.getAuthInstance();
        authInstance.isSignedIn.listen((isSignedIn) => dispatch({ type: 'login-change', isSignedIn }));
        dispatch({ type: 'login-change', isSignedIn: authInstance.isSignedIn.get() });
        dispatch({ type: 'loaded' });
    };

    React.useEffect(() => {
        if (!clientInit) {
            gapi.client
                .init(CONFIG)
                .then(() => gapi.auth2.init(CONFIG).then())
                .then(() => clientInitDispatch(true));
            return;
        }

        if (clientInit && !state.isSignedIn && !state.loading) {
            dispatch({ type: 'loading' });
            login();
        }

        if (clientInit && !contentLoaded && !state.loading && !!state.sheet.id) {
            dispatch({ type: 'loading' });
            state.sheet.load().then(() => {
                contentLoadedDispatch(true);
                dispatch({ type: 'loaded' });
            });
        }

    }, [state.isSignedIn, clientInit, contentLoaded, state.sheet.id]);
    const LoginButton = () => <button className="btn blue" onClick={() => gapi.auth2.getAuthInstance().signIn()}>Login with Google</button>;

    let value = { state, dispatch };
    const Loading = () => <div>⏳</div>;
    const refSpreadSheetId = React.createRef();

    const copyFileFrom = () => {
        dispatch({ type: 'loading' });
        gapi.client.drive.files.copy({
            fileId: '1qzQNxMI71HeRX89aP5b9ZX_6XQKXy7_eKWpMwc5ckL0',
            properties: {
                'house.duty': '1.0',
            }
        }).then(({ result }) => {
            state.sheet.id = result.id;
            dispatch({ type: 'loaded' });
        })
    };

    return <AppContext.Provider value={value}>
        {
            !!state.loading ? <Loading /> : null
        }
        {!!state.sheet.id ? children : <>
            {!!state.isSignedIn
                ?
                <GoogleDriveProvider>
                    <GoogleDriveContext.Consumer>
                        {({ state: files }) => <>
                            Select a Duty file:
                         <select ref={refSpreadSheetId} onChange={() => dispatch({ type: 'set-id', id: refSpreadSheetId.current.value })}>
                                <option value=""></option>
                                {Array.from(files || []).map(file => <option key={file.id} value={file.id}>{file.name}</option>)}
                            </select></>}
                    </GoogleDriveContext.Consumer>
                    <p>
                        or<br />
                        <button className="btn blue" onClick={() => copyFileFrom()} >Create a new Duty Sheet</button>
                    </p>
                </GoogleDriveProvider>
                : <LoginButton />
            }
            <p>
                or<br />just check a demo
            </p>
        </>}
    </AppContext.Provider>;
};
