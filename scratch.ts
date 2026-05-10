let state = {
    controlMap: Array(10).fill(null).map(() => Array(10).fill(null)),
};
state.controlMap[2][5] = 'A';
console.log(state.controlMap[2]);
