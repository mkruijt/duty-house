import * as React from 'react';
import { HouseSpreadsheet } from "../models/house-sheet";
import { formatDistance } from 'date-fns';


export const ActivityListComponent = ({ sheet: { activities } }: { sheet: HouseSpreadsheet }) => <div className="table-wrapper">
    <table>
        <thead>
            <tr>
                <th>When</th>
                <th>Activity</th>
                <th>Who</th>
            </tr>
        </thead>
        <tbody>
            {activities.map((u, i) => {
                return <tr>
                    <td>{formatDistance(new Date(u[0]), new Date()}</td>
                    <td>{u[1]}</td>
                    <td>{u[2]}</td>
                </tr>;
            })}
        </tbody>
    </table>
</div>;
