import * as React from 'react';

export const LocalStorageProviderContext = React.createContext();

export const LocalStorageSheet = (props) => {

    const [state, dispatch] = React.useState({});

    React.useEffect(() => {
        const data = window.localStorage.get('spreadsheets');
        dispatch(!!data ? JSON.parse(data) : {});
    }, []);

    return <LocalStorageProviderContext value={state, dispatch}>{props.children}</LocalStorageProviderContext>

}
