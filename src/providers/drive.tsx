import * as React from 'react';

export const GoogleDriveContext = React.createContext();

export const GoogleDriveProvider = (props) => {

    const [state, dispatch] = React.useState({});

    React.useEffect(() => {
        gapi.client.drive.files.list({
            maxResults: 10,
            q: "properties has { key='house.duty' and value='1.0' }"
        }).then(data => {
            dispatch(data?.result?.files || {});
        })
    }, []);

    let value = { state, dispatch };

    return <GoogleDriveContext.Provider value={value}>{props.children}</GoogleDriveContext.Provider>

}
