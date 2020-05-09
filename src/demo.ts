import { DemoHouseSpreadsheet } from "./models/house-sheet";
import { emoji } from './emoji';
import { subHours } from "date-fns";



const getRand = (m) => Math.floor(Math.random() * m);
const randomColor = () => [getRand(255), getRand(255), getRand(255)].join(',');
export const users = [
    ...new Array(getRand(5) + 2)
].map((el, i) => [
    `Human ${i}`,
    emoji[getRand(emoji.length)],
    `rgb(${randomColor()})`,
]);

export const tasks = [
    ['Coffee', '1', emoji[getRand(emoji.length)]],
    ['Dinner', '3', emoji[getRand(emoji.length)]],
];
export const activities = [...new Array(getRand(200)].map((e, i) => {
    return [
        subHours(new Date(), i * 3),
        tasks[getRand(tasks.length)][0],
        users[getRand(users.length)][0],
    ]
});

export const demoSheet = new DemoHouseSpreadsheet(
    'DEMO',
    activities,
    tasks,
    users,
);
