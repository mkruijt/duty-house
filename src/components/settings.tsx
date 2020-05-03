import * as React from 'react';
import { RadioControlComponent } from './radio-control';
import { caseSwitch } from '../utils';
import { emoji } from '../emoji';
import { HouseSpreadsheet } from '../models/house-sheet';

interface ISettingItemProps {
    onCancel: () => {},
    onSaved: () => {},
}

interface ISettingTaskProps implements ISettingItemProps {
    task: [string, string, string]
}

interface ISettingUserProps implements ISettingItemProps {
    user: [string, string, string]
}

const EditTaskComponent = ({ task, onCancel, onSaved }: ISettingTaskProps) => {
    const ref = React.createRef();
    const refValue = React.createRef();
    const [state, dispatch] = React.useState(task);

    return <div className="edit edit--user">
        <h4>{state[2]}<br /><span>{state[0]}</span> {state[1]}</h4>
        <input name="" type="text" ref={ref} onChange={() => dispatch([ref.current.value, state[1], state[2]])} value={state[0]} />
        <input name="" type="number" ref={refValue} onChange={() => dispatch([state[0], refValue.current.value, state[2]])} value={state[1]} />
        <div className="emoji-board" onClick={(e) => e.target.tagName === 'BUTTON' ? dispatch([state[0], state[1], e.target.textContent]) : null} dangerouslySetInnerHTML={{ __html: `<button>${emoji.join('</button><button>')}` }}></div>
        <div className="settings__controls">
            <button onClick={() => onCancel()} className="btn btn--small red">Cancel</button>
            <button onClick={() => onSaved(state)} className="btn btn--small green">Save</button>
        </div >
    </div>;
};

const EditUserComponent = ({ user, onCancel, onSaved }: ISettingUserProps) => {
    const ref = React.createRef();
    const refColor = React.createRef();
    const [state, dispatch] = React.useState(user);

    return <div className="edit edit--user">
        <h4>{state[1]}<br /><span>{state[0]}</span></h4>
        <input name="" type="text" ref={ref} onChange={() => dispatch([ref.current.value, state[1], state[2]])} value={state[0]} />
        <input name="" type="color" ref={refColor} onChange={() => dispatch([state[0], state[1], refColor.current.value])} value={state[2]} />
        <div className="emoji-board" onClick={(e) => e.target.tagName === 'BUTTON' ? dispatch([state[0], e.target.textContent, state[2]]) : null} dangerouslySetInnerHTML={{ __html: `<button>${emoji.join('</button><button>')}` }}></div>
        <div className="settings__controls">
            <button onClick={() => onCancel()} className="btn btn--small red">Cancel</button>
            <button onClick={() => onSaved(state)} className="btn btn--small green">Save</button>
        </div >
    </div>;
};

interface ISettingState {
    view: SETTINGS_VIEW,
    sheet: HouseSpreadsheet,
    editUser?: number,
    editTask?: number,
}

enum SETTING_ACTION {
    VIEW_ME,
    VIEW_USERS,
    VIEW_TASKS,
    EDIT_USER,
    DELETE_USER,
    EDIT_TASK,
    DELETE_TASK,
    CHANGE_VIEW,
}

enum SETTINGS_VIEW {
    ME,
    USERS,
    EDIT_USER,
    EDIT_TASK,
    TASKS,
}

interface ISettingAction {
    type: typeof SETTING_ACTION
}

interface ISettingActionChangeView implements ISettingAction {
    type: SETTING_ACTION.CHANGE_VIEW,
    view: typeof SETTINGS_VIEW,
}

interface ISettingActionEditUser implements ISettingAction {
    type: SETTING_ACTION.EDIT_USER | SETTING_ACTION.DELETE_USER,
    user: number,
}

interface ISettingActionEditTask implements ISettingAction {
    type: SETTING_ACTION.EDIT_TASK | SETTING_ACTION.DELETE_TASK
    task: number
}

type SettingAction = ISettingActionChangeView | ISettingActionEditUser | ISettingActionEditTask;

const SettingReduce = (state: ISettingState, action: SettingAction): ISettingState => {
    switch (action.type) {
        case SETTING_ACTION.CHANGE_VIEW:
            return { ...state, view: action.view };

        case SETTING_ACTION.EDIT_USER:
            return { ...state, view: SETTINGS_VIEW.EDIT_USER, editUser: action.user };

        case SETTING_ACTION.EDIT_TASK:
            return { ...state, view: SETTINGS_VIEW.EDIT_TASK, editTask: action.task };

        case SETTING_ACTION.DELETE_TASK:
            const tasks = [...state.sheet.tasks];
            tasks.splice(action.task, 1);
            state.sheet.tasks = tasks;
            return { ...state, sheet: state.sheet };

        case SETTING_ACTION.DELETE_USER:
            const users = [...state.sheet.users];
            users.splice(action.user, 1);
            state.sheet.users = users;
            return { ...state, sheet: state.sheet };

        default:
            return state;
    }
};


export const SettingsComponent = (props: { sheet: HouseSpreadsheet, onCancel: () => {}, onSaved: () => {} }) => {

    const [state, dispatch] = React.useReducer(SettingReduce, { view: SETTINGS_VIEW.ME, sheet: props.sheet });

    return <div className="settings__form">

        <h3 className="scoreboard__title">
            <span className="scoreboard__view">
                <span className={state.view === SETTINGS_VIEW.USERS ? 'active' : null}>Participants </span>
                <span className={state.view === SETTINGS_VIEW.TASKS || state.view === SETTINGS_VIEW.EDIT_TASK ? 'active' : null}>Tasks </span>
                <span className={state.view === SETTINGS_VIEW.ME ? 'active' : null}>My </span>
            </span> Settings
        </h3>

        <RadioControlComponent name="time-view" options={[
            { name: 'Me', value: SETTINGS_VIEW.ME },
            { name: 'Participants', value: SETTINGS_VIEW.USERS },
            { name: 'Tasks', value: SETTINGS_VIEW.TASKS },
        ]} currentValue={state.view} onChange={(view: typeof SETTINGS_VIEW) => dispatch({ type: SETTING_ACTION.CHANGE_VIEW, view })} />

        {caseSwitch(state.view, {

            [SETTINGS_VIEW.USERS]: <>
                <ul className="settings-list">
                    {state.sheet.users.map((user, index) => <li key={`user-${index}`}>
                        <span>
                            {user[1]}
                            {user[0]}
                        </span>
                        <div className="controls">
                            <button onClick={() => dispatch({ type: SETTING_ACTION.DELETE_USER, user: index })} className="btn-emoji btn-emoji--delete">Delete</button>
                            <button onClick={() => dispatch({ type: SETTING_ACTION.EDIT_USER, user: index })} className="btn-emoji btn-emoji--edit">Edit</button>
                        </div>
                    </li>)}
                </ul>
                <div className="settings__controls">
                    <button onClick={() => props.onCancel()} className="btn btn--small red">Cancel</button>
                    <button onClick={() => {
                        state.sheet.users.push([null, null, null]);
                        dispatch({ type: SETTING_ACTION.EDIT_USER, user: state.sheet.users.length - 1 })
                    }} className="btn btn--small cyan">Add</button>
                    <button onClick={() => props.onSaved()} className="btn btn--small green">Save</button>
                </div >
            </>,

            [SETTINGS_VIEW.EDIT_USER]: <EditUserComponent
                user={state.sheet.users[state.editUser]}
                onCancel={() => dispatch({ type: SETTING_ACTION.CHANGE_VIEW, view: SETTINGS_VIEW.USERS })}
                onSaved={(user) => {
                    state.sheet.users[state.editUser] = user;
                    dispatch({ type: SETTING_ACTION.CHANGE_VIEW, view: SETTINGS_VIEW.USERS });
                }}
            />,

            [SETTINGS_VIEW.TASKS]: <>
                <ul className="settings-list">
                    {state.sheet.tasks.map((task, index) => <li key={`tasks-${index}`}>
                        <span>
                            {task[2]} {task[0]} {task[1]}
                        </span>
                        <div className="controls">
                            <button
                                onClick={() => dispatch({ type: SETTING_ACTION.DELETE_TASK, task: index })}
                                className="btn-emoji btn-emoji--delete">Delete</button>
                            <button
                                onClick={() => dispatch({ type: SETTING_ACTION.EDIT_TASK, task: index })}
                                className="btn-emoji btn-emoji--edit"
                            >Edit</button>
                        </div>
                    </li>)}
                </ul>
                <div className="settings__controls">
                    <button onClick={() => props.onCancel()} className="btn btn--small red">Cancel</button>
                    <button onClick={() => {
                        state.sheet.tasks.push([null, null, null]);
                        dispatch({ type: SETTING_ACTION.EDIT_TASK, task: state.sheet.tasks.length - 1 })
                    }} className="btn btn--small cyan">Add</button>
                    <button onClick={() => props.onSaved()} className="btn btn--small green">Save</button>
                </div >
            </>,

            [SETTINGS_VIEW.EDIT_TASK]: <EditTaskComponent
                task={state.sheet.tasks[state.editTask]}
                onCancel={() => dispatch({ type: SETTING_ACTION.CHANGE_VIEW, view: SETTINGS_VIEW.TASKS })}
                onSaved={(task) => {
                    state.sheet.tasks[state.editTask] = task;
                    dispatch({ type: SETTING_ACTION.CHANGE_VIEW, view: SETTINGS_VIEW.TASKS })
                }}
            />,

            default: <>
                <ul>
                </ul>
                <div className="settings__controls">
                    <button onClick={() => props.onCancel()} className="btn btn--small red">Cancel</button>
                    <button onClick={() => props.onSaved()} className="btn btn--small green">Save</button>
                </div >
            </>
        })}

    </div >;
}
