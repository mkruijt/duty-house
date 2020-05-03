import * as React from 'react';
import { HouseSpreadsheet } from '../models/house-sheet';
import { WinnerBoardComponent } from './winner-board';
import { ActivityListComponent } from './activity-list';
import { SettingsComponent } from './settings';
import { AddActivityFormComponent } from './add-activity';
import { caseSwitch } from '../utils';

export enum VIEWS {
    MAIN = 'main';
    ADDING = 'adding';
    SETTINGS = 'settings';
    LOG = 'log';
}
const addTask = (id, values) => new Promise((resolve, reject) => {
    gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: id,
        range: 'DutyLog',
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS'
    }, {
        values
    }).then(() => resolve());
});
export const SheetView = (props: { sheet: HouseSpreadsheet, isSignedIn: boolean, addItem: () => {} }) => {
    const { activities, tasks, users } = props.sheet;
    const [state, dispatch] = React.useReducer((state, action) => {
        switch (action.type) {
            case 'add':
                return { ...state, view: VIEWS.ADDING };

            case 'settings':
                return { ...state, view: VIEWS.SETTINGS };

            case 'log':
                return { ...state, view: VIEWS.LOG };

            case 'main':
            case 'added':
            case 'saved':
            case 'cancel':
                props.sheet.saveSettings();
                return { ...state, view: VIEWS.MAIN };
            default:
                return { ...state, view: VIEWS.MAIN };
        }
    }, {
        view: VIEWS.MAIN
    });
    const ListItems = (props: { items: any[] }) => (<ul>
        {activities.map((el, i) => (<li key={i}>{el[0]} - {el[1]} - {el[2]}</li>))}
    </ul>);

    const actionAddTask = (item) => {
        props.sheet.appendActivity([item]).then(() => {
            dispatch({ type: 'added' });
        }).catch(e => console.error(e));
    };


    const LoginButton = () => <button className="btn blue" onClick={() => gapi.auth2.getAuthInstance().signIn()}>Login</button>;
    const AddActivityButton = () => <div className="activities-actions">
        <button onClick={() => dispatch({ type: 'log' })} className="activity-logs" >Activities</button>
        <button onClick={() => dispatch({ type: 'settings' })} className="activity-settings" >Settings</button>
        <button onClick={() => dispatch({ type: 'add' })} className="activity-add" >Add activity</button>
    </div>;
    const total_activities = props.sheet.getActivitiesFromTo(new Date(), new Date());

    return <div className="activity-view">
        {caseSwitch(state.view, {
            [VIEWS.LOG]: <>
                <ActivityListComponent sheet={props.sheet} />
                <div className="activities-actions">
                    <button onClick={() => dispatch({ type: 'main' })} className="activity-board" >Board</button>
                </div>
            </>,
            [VIEWS.SETTINGS]: <>
                <SettingsComponent sheet={props.sheet} onCancel={() => dispatch({ type: 'cancel' })} onSaved={() => dispatch({ type: 'saved' })} />
            </>
            [VIEWS.ADDING]: <AddActivityFormComponent sheet={props.sheet} onCancel={() => dispatch({ type: 'cancel' })} onCreate={(item) => actionAddTask(item)} />,
            default: <>
                <WinnerBoardComponent sheet={props.sheet} />
                {
                    props.isSignedIn ? <AddActivityButton /> : <LoginButton />
                }
            </>
        })}
    </div>;
};
