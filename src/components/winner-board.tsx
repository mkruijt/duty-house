import * as React from 'react';
import { HouseSpreadsheet, TIME_VIEW } from "../models/house-sheet";
import { RadioControlComponent } from './radio-control';

export interface IWinnerBoardComponentProps {
    sheet: HouseSpreadsheet,
    timeFrame?: string
}

export const WinnerBoardComponent = ({ sheet, timeFrame }: IWinnerBoardComponentProps) => {
    let { users } = sheet;
    const [state, dispatch] = React.useState(TIME_VIEW.WEEK);
    const [showMoreState, showMoreDispatch] = React.useState(false);
    const form = React.createRef();
    const score = sheet.getScores(state);
    const winner = Object.keys(score).reduce((s, u) => {
        if (s.score < score[u]) {
            return { user: u, score: score[u] };
        }
        return s;
    }, { user: null, score: 0 })
    users = users.sort((a, b) => {
        const user_a = a[0].toLowerCase();
        const user_b = b[0].toLowerCase();
        if (!score[user_a] && !score[user_b]) {
            return 0;
        }

        if (!score[user_a]) {
            return 1;
        }

        if (!score[user_b]) {
            return -1;
        }

        return score[user_a] < score[user_b] ? 1 : -1;
    });
    const total = Object.values(score).filter(n => !Number.isNaN(n)).reduce((s, i) => s + i, 0);
    const randomColor = () => {
        return `rgb(${Math.random() * 255},${Math.random() * 255},${Math.random() * 255})`;
    };
    return <div className="winner-board">
        <h3 className="scoreboard__title">Leader <span className="scoreboard__view">
            <span className={`${TIME_VIEW.DAY === state ? 'active' : null}`} > Day</span>
            <span className={`${TIME_VIEW.WEEK === state ? 'active' : null}`} > Weekly</span>
            <span className={`${TIME_VIEW.MONTH === state ? 'active' : null}`} > Month</span>
            <span className={`${TIME_VIEW.YEAR === state ? 'active' : null}`} > Year</span>
            <span className={`${TIME_VIEW.ALL === state ? 'active' : null}`} > All the Time</span>
        </span> Board</h3>
        <h5><i>from <span>{sheet.getTimeViewActivities(state).length}</span></i> activities</h5>
        {!showMoreState ? <div className="score-board">
            {users.map((u, i) => {
                const user = u[0].toLowerCase();
                const percentage = (score[user] / total) * 100;
                if (i > 2) {
                    return null;
                }
                return <div key={`user-score-bar-${i}`}>
                    <span className="user">{u[1]}</span>
                    <div className="score" style={{ backgroundColor: u[2] || randomColor(), paddingTop: `${(percentage || 0) * 2}px` }}>
                        <span className="score__label">{score[user] ? score[user] * 1000 : 0}</span>
                    </div>
                    <span className="name">{(winner.user === user) ? "🏆" : null} {u[0]}</span>
                </div>;
            })}
        </div> : null}
        <RadioControlComponent name="time-view" options={[
            { name: 'Day', value: TIME_VIEW.DAY },
            { name: 'Week', value: TIME_VIEW.WEEK },
            { name: 'Month', value: TIME_VIEW.MONTH },
            { name: 'Year', value: TIME_VIEW.YEAR },
        ]} currentValue={state} onChange={(view) => dispatch(parseInt(view))} />
        {!showMoreState
            ? users.length > 3 ? <p>
                And other {users.length - 3} users <br />
                <a href="#" onClick={() => showMoreDispatch(true)}>Show all scores</a>
            </p> : null
            : <div className="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th></th>
                            <th>User</th>
                            <th>Points</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u, i) => {
                            const user = u[0].toLowerCase();
                            return <tr key={`user-score-${i}`}>
                                <td>{i + 1}</td>
                                <td>{u[1} {u[0]}</td>
                                <td>{score[user] ? score[user] * 1000 : 0}</td>
                            </tr>;
                        })}
                    </tbody>
                </table>
                <p>
                    <a href="#" onClick={() => showMoreDispatch(false)}>Go to top 3 view</a>
                </p>
            </div>}
    </div>;
}
