import * as React from 'react';
import config from '../../../packages/google-sheet-config.json';
import { HouseSpreadsheet, DemoHouseSpreadsheet } from '../models/house-sheet';
import { GoogleDriveProvider, GoogleDriveContext } from './drive';
import { subDays, subHours } from 'date-fns';


export const AppContext = React.createContext();


const getRand = (m) => Math.floor(Math.random() * m);
const randomColor = () => [getRand(255), getRand(255), getRand(255)].join(',');

const AppActionReduce = (state, action) => {
    switch (action.type) {
        case "set-id":
            if (action.id === 'DEMO') {
                const users = [
                    ['Mauro', '🎅', `rgb(${randomColor()})`],
                    ['Maartje', '🎅', `rgb(${randomColor()})`],
                    ['Matteo', '🎅', `rgb(${randomColor()})`],
                ];
                const tasks = [
                    ['Coffee', '1', '☕️'],
                    ['Dinner', '3', '🍳'],
                ];
                const activities = [...new Array(getRand(200)].map((e, i) => {
                    return [
                        subHours(new Date(), i * 3),
                        tasks[getRand(tasks.length)][0],
                        users[getRand(users.length)][0],
                    ]
                });
                state.sheet = new DemoHouseSpreadsheet(
                    action.id,
                    activities,
                    tasks,
                    users,
                );
            } else {
                state.sheet.id = action.id;
            }
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

        if (clientInit && !contentLoaded && !state.loading && !!state.sheet.id && state.sheet.id !== 'DEMO') {
            dispatch({ type: 'loading' });
            state.sheet.load().then(() => {
                contentLoadedDispatch(true);
                dispatch({ type: 'loaded' });
            });
        }

        if (state.sheet.id) {
            document.body.classList.remove('home');
            document.body.classList.add('app');
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

    const handleSelectFile = (id) => {
        if (id === 'NEW') {
            copyFileFrom();
            return;
        }

        dispatch({ type: 'set-id', id });
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

    return <AppContext.Provider value={value}>
        {
            !!state.loading ? <Loading /> : null
        }
        {!!state.sheet.id ? children : <>
            {!!state.isSignedIn
                ?
                <GoogleDriveProvider>
                    <GoogleDriveContext.Consumer>
                        {({ state: files }) => {
                            files = Array.from(files || []);
                            if (files.length === 0) return <button className="btn blue" onClick={() => copyFileFrom()} >Create a new Duty Sheet</button>;
                            return <SelectFile files={files} />;
                        }}
                    </GoogleDriveContext.Consumer>
                </GoogleDriveProvider>
                : <LoginButton />
            }
            <p className="check-the-demo">
                or<br /><a href="#"
                    onClick={e => {
                        e.preventDefault();
                        dispatch({ type: 'set-id', id: 'DEMO' });
                    }}
                >just check a demo</a>
            </p>
        </>}
    </AppContext.Provider>;
};
