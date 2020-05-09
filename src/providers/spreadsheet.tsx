import * as React from 'react';
import config from '../../../packages/google-sheet-config.json';
import { HouseSpreadsheet, DemoHouseSpreadsheet } from '../models/house-sheet';
import { GoogleDriveProvider, GoogleDriveContext } from './drive';
import { subDays, subHours } from 'date-fns';
import { demoSheet } from '../demo';
import { caseSwitch } from '../utils';

export const AppContext = React.createContext();

export enum APP_VIEWS {
    INITIAL,
    LOADING,
    SELECT_DOCUMENT,
    LOGIN,
}

export enum APP_ACTIONS {
    CLIENT_INIT,
    SET_ID,
    LOADING,
    LOADED,
    CLIENT_LOADED,
    RESET,
    LOGIN_CHANGE,
    SET_USERS,
    SET_TASKS,
    SET_ITEMS,
    ADD_ITEMS,
}


const AppActionReduce = (state, action) => {
    switch (action.type) {
        case APP_ACTIONS.SET_ID:
            if (action.id === 'DEMO') {
                state.sheet = demoSheet;
            } else {
                state.sheet.id = action.id;
            }
            const params = (new URL(document.location)).searchParams;
            params.set("sheet", action.id);
            window.history.pushState(state, 'Sheet View', `${document.location}?${params.toString()}`);
            return { ...state, sheet: state.sheet };

        case APP_ACTIONS.CLIENT_INIT:
        case APP_ACTIONS.LOADING:
            return { ...state, loading: true };

        case APP_ACTIONS.CLIENT_LOADED:
            return { ...state, init: true };

        case APP_ACTIONS.LOADED:
            return { ...state, loading: false };

        case APP_ACTIONS.RESET:
            return initialState;

        case APP_ACTIONS.LOGIN_CHANGE:
            return { ...state, isSignedIn: action.isSignedIn };

        case APP_ACTIONS.SET_USERS:
            state.sheet.setUsers(action.users);
            return { ...state, sheet: state.sheet };

        case APP_ACTIONS.SET_TASKS:
            state.sheet.setTasks(action.tasks);
            return { ...state, sheet: state.sheet };

        case APP_ACTIONS.SET_ITEMS:
            state.sheet.setActivities(action.items);
            return { ...state, sheet: state.sheet, loading: false };

        case APP_ACTIONS.ADD_ITEMS:
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
    init: false,
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

    const [contentLoaded, contentLoadedDispatch] = React.useState(false);
    const [state, dispatch] = React.useReducer(AppActionReduce, {
        ...InitialAppState,
        sheet: new HouseSpreadsheet(spreadsheetId)
    });

    const initLogin = () => new Promise(resolve => {

        dispatch({ type: APP_ACTIONS.LOADING });
        const authInstance = gapi.auth2.getAuthInstance();
        const isSignedIn = authInstance.isSignedIn.get();

        authInstance.isSignedIn.listen((isSignedIn) => dispatch({ type: APP_ACTIONS.LOGIN_CHANGE, isSignedIn }));

        if (isSignedIn) {
            dispatch({ type: APP_ACTIONS.LOGIN_CHANGE, isSignedIn });
        }

        resolve();
    });

    React.useEffect(() => {
        if (!state.init && !state.loading) {
            dispatch({ type: APP_ACTIONS.LOADING });
            gapi.client
                .init(CONFIG)
                .then(() => new Promise(resolve => gapi.auth2.init(CONFIG).then(resolve)))
                .then(initLogin)
                .then(() => {
                    dispatch({ type: APP_ACTIONS.CLIENT_LOADED })
                    dispatch({ type: APP_ACTIONS.LOADED })
                });
            return;
        }

        if (state.init && !contentLoaded && !state.loading && !!state.sheet.id && state.sheet.id !== 'DEMO') {
            dispatch({ type: APP_ACTIONS.LOADING });
            state.sheet.load().then(() => {
                contentLoadedDispatch(true);
                dispatch({ type: APP_ACTIONS.LOADED });
            });
        }

        if (state.sheet.id) {
            document.body.classList.remove('home');
            document.body.classList.add('app');
        }

    }, [state.init, state.isSignedIn, state.loading, state.sheet.id, contentLoaded]);
    const LoginButton = () => <button className="btn blue" onClick={() => gapi.auth2.getAuthInstance().signIn()}>Login with Google</button>;

    let value = { state, dispatch };
    const Loading = () => <div>⏳</div>;
    const refSpreadSheetId = React.createRef();

    const copyFileFrom = () => {
        dispatch({ type: APP_ACTIONS.LOADING });
        gapi.client.drive.files.copy({
            fileId: '1qzQNxMI71HeRX89aP5b9ZX_6XQKXy7_eKWpMwc5ckL0',
            properties: {
                'house.duty': '1.0',
            }
        }).then(({ result }) => {
            state.sheet.id = result.id;
            dispatch({ type: APP_ACTIONS.LOADED });
        })
    };

    const handleSelectFile = (id) => {
        if (id === 'NEW') {
            copyFileFrom();
            return;
        }

        dispatch({ type: APP_ACTIONS.SET_ID, id });
    };

    const SelectFile = ({ files }) => {
        return <>
            Select a Duty file:
            <select ref={refSpreadSheetId} onChange={() => handleSelectFile(refSpreadSheetId.current.value)}>
                <option value=""></option>
                {files.map(file => <option key={file.id} value={file.id}>{file.name}</option>)}
                <option value="new">Create a new one</option>
            </select></>
    };

    const BrowseFiles = () => !!state.isSignedIn
        ? <GoogleDriveProvider>
            <GoogleDriveContext.Consumer>
                {({ state: { loaded, files } }) => {
                    files = Array.from(files || []);
                    if (loaded && files.length === 0) return <button className="btn blue" onClick={() => copyFileFrom()} >Create a new Duty Sheet</button>;
                    return loaded ? <SelectFile files={files} /> : null;
                }}
            </GoogleDriveContext.Consumer>
        </GoogleDriveProvider>
        : <LoginButton />;

    return <AppContext.Provider value={value}>
        {
            state.loading ? <Loading /> : null
        }
        {state.sheet.id
            ? children
            : <>
                {
                    !state.loading
                        ? <BrowseFiles />
                        : null
                }
                <p className="check-the-demo">
                    or<br /><a href="#"
                        onClick={e => {
                            e.preventDefault();
                            dispatch({ type: APP_ACTIONS.SET_ID, id: 'DEMO' });
                        }}
                    >just check a demo</a>
                </p>
            </>
        }
    </AppContext.Provider>;
};
