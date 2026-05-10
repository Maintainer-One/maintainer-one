let state = {
    controlMap: Array(10).fill(null).map(() => Array(10).fill(null)),
};

let players = [
    { id: 'p1', team: 'A', position: { x: 2, y: 2 } },
    { id: 'p2', team: 'A', position: { x: 2, y: 4 } }
];

for(let i = 0; i < 1; i++) {
    players.forEach(p => {
        // Update Control Map
        if (state.controlMap[p.position.y][p.position.x] !== p.team) {
            state.controlMap[p.position.y][p.position.x] = p.team;
        }
    });
}
console.log(state.controlMap[2]);
