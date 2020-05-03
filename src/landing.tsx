const emojRange = [
    [128513, 128591], [9986, 10160], [128640, 128704]
];

const emoji = [];

for (let i = 0; i < emojRange.length; i++) {
    let range = emojRange[i];
    for (let x = range[0]; x < range[1]; x++) {
        emoji.push(`&#${x};`);
    }

}

console.log(emoji);
