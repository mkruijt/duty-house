import { startOfWeek, endOfWeek, isWithinInterval, startOfMonth, endOfMonth, startOfYear, endOfYear, startOfDay, endOfToday, startOfToday } from "date-fns";


const getDate = (date: string) => {
    const d = new Date(date);
    return `${d.getDate()}-${d.getMonth() > 9 ? d.getMonth() : '0' + d.getMonth()}-${d.getFullYear()}`;
}

export enum TIME_VIEW {
    DAY,
    WEEK,
    MONTH,
    YEAR,
    ALL
}

export enum SHEET_VIEWS {
    USERS = 'People',
    TASKS = 'Tasks',
    LOG = 'DutyLog',
}

export class HouseSpreadsheet {

    constructor(
        public id: string = '',
        public activities: [] = [],
        public tasks: [] = [],
        public users: [] = [],
    ) { }

    public load() {
        return new Promise((resolve, reject) => {
            gapi.client.sheets.spreadsheets.values.batchGet({
                spreadsheetId: this.id,
                ranges: [
                    `${SHEET_VIEWS.USERS}!A2:K`,
                    `${SHEET_VIEWS.TASKS}!A2:K`,
                    `${SHEET_VIEWS.LOG}!A2:K`,
                ],
            }).then((response) => {
                const range = response.result;
                if (range.valueRanges.length > 0) {
                    this.users = range?.valueRanges[0]?.values || [];
                    this.tasks = range?.valueRanges[1]?.values || [];
                    this.activities = range?.valueRanges[2]?.values || [];
                    resolve();
                    return;
                }
                reject('No data found.');
            }, (response) => reject('Error: ' + response.result.error.message));
        });
    }

    public saveSettings() {
        return new Promise((resolve, reject) => {
            gapi.client.sheets.spreadsheets.values.batchClear({
                spreadsheetId: this.id,
                ranges: [
                    `${SHEET_VIEWS.USERS}!A2:K`,
                    `${SHEET_VIEWS.TASKS}!A2:K`,
                ]
            }).then(() => {
                gapi.client.sheets.spreadsheets.values.batchUpdate({
                    spreadsheetId: this.id,
                    valueInputOption: 'USER_ENTERED',
                    data: [
                        {
                            range: `${SHEET_VIEWS.USERS}!A2:K`,
                            values: this.users
                        },
                        {
                            range: `${SHEET_VIEWS.TASKS}!A2:K`,
                            values: this.tasks
                        },
                    ],
                }).then(function(response) {
                    resolve(response);
                }, (response) => reject('Error: ' + response.result.error.message));
            }, err => reject(err));
        });
    }

    public getActivitiesFromTo(fromDay: Date, toDay: Date) {
        return this.activities.filter(a => {
            const d = new Date(a[0]);
            return d >= fromDay && d <= toDay;
        });
    }

    public getActivitiesToday() {
        const start = startOfToday();
        const end = endOfToday();
        return this.activities.filter(a => isWithinInterval(new Date(a[0]), { start, end }));
    }

    public getActivitiesThisWeek() {
        const today = new Date();
        const start = startOfWeek(today);
        const end = endOfWeek(today);
        return this.activities.filter(a => isWithinInterval(new Date(a[0]), { start, end }));
    }

    public getActivitiesThisMonth() {
        const today = new Date();
        const start = startOfMonth(today);
        const end = endOfMonth(today);
        return this.activities.filter(a => isWithinInterval(new Date(a[0]), { start, end }));
    }

    public getActivitiesThisYear() {
        const today = new Date();
        const start = startOfYear(today);
        const end = endOfYear(today);
        return this.activities.filter(a => isWithinInterval(new Date(a[0]), { start, end }));
    }

    public getTimeViewActivities(timeFrame: TIME_VIEW) {
        switch (timeFrame) {
            case TIME_VIEW.DAY;
                return this.getActivitiesToday();
            case TIME_VIEW.WEEK:
                return this.getActivitiesThisWeek();
            case TIME_VIEW.MONTH:
                return this.getActivitiesThisMonth();
            case TIME_VIEW.YEAR:
                return this.getActivitiesThisYear();
            case TIME_VIEW.ALL:
                return this.activities;
            default:
                return this.activities;
        }
    }

    public getScores(timeFrame?: TIME_VIEW) {

        const tasks = this.tasks.reduce((state, iter) => {
            const name = iter[0];
            const value = iter[1];
            state[name] = Number(value);
            return state;
        }, {});

        const totals = this.getTotalPerson(timeFrame);
        return Object.keys(totals).reduce((state, person) => {

            state[person] = Object.values(totals[person]).flat().reduce((current, activity) => {
                return current + tasks[activity];
            }, 0);

            return state;

        }, {});
    }

    public getTotalPerson(timeFrame?: TIME_VIEW) {

        return [...this.getTimeViewActivities(timeFrame)].reduce((state, iter) => {
            const name = iter[2];
            const key = name.toLowerCase();
            const activity = iter[1];
            const day = getDate(iter[0]);

            if (!state[key]) {
                state[key] = {};
            }

            if (!state[key][day]) {
                state[key][day] = [activity];
                return state;
            }

            state[key][day].push(activity);

            return state;
        }, {});
    }

    setUsers(users: []) {
        this.users = users;
    }

    setTasks(tasks) {
        this.tasks = tasks;
    }

    setActivities(activities) {
        this.activities = activities;
    }

    addActivity(activity) {

        this.activities.push(activity);
    }

    public appendActivity(values) {
        return new Promise((resolve, reject) => {
            gapi.client.sheets.spreadsheets.values.append({
                spreadsheetId: this.id,
                range: 'DutyLog',
                valueInputOption: 'USER_ENTERED',
                insertDataOption: 'INSERT_ROWS'
            }, {
                values
            }).then(() => {
                this.addActivity(values[0])
                resolve();
            });
        });
    }

}
