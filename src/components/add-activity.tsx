import * as React from 'react';
import { HouseSpreadsheet } from "../models/house-sheet";

export interface IAddActivityFormProps {
    sheet: HouseSpreadsheet,
    onCreate: () => {},
    onCancel: () => {},
};

export const AddActivityFormComponent = ({ sheet: { users, tasks }, onCancel, onCreate }: IAddActivityFormProps) => {

    const user = React.createRef();
    const task = React.createRef();
    const when = React.createRef();

    return <div className="activity__form">
        <h2>Which <span>activity</span> happen?</h2>
        <select ref={user}>
            {users.map(u => <option key={u[0]} defaultValue={u[0]}>{u[0]} {u[1]}</option>)}
        </select>
        <select ref={task}>
            {tasks.map(u => <option key={u[0]} defaultValue={u[0]}>{u[0]} {u[1]}</option>)}
        </select>
        <input ref={when} type="datetime-local" defaultValue={new Date().toISOString().substring(0, 16)} />
        <div>
            <button className="btn btn--small red" onClick={() => onCancel()}>Cancel</button>
            <button className="btn btn--small cyan" onClick={() => onCreate([when.current.value, task.current.value, user.current.value])}>Add</button>
        </div>
    </div>
};
