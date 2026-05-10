let state = {
    tick: 0,
    players: [
        { id: 'p1', team: 'A', position: { x: 2, y: 2 } },
        { id: 'p2', team: 'A', position: { x: 2, y: 4 } },
        { id: 'p3', team: 'A', position: { x: 2, y: 7 } },
        { id: 'p4', team: 'B', position: { x: 7, y: 2 } },
        { id: 'p5', team: 'B', position: { x: 7, y: 4 } },
        { id: 'p6', team: 'B', position: { x: 7, y: 7 } }
    ],
    pointZones: [{ position: { x: 4, y: 5 }, age: 0 }]
};

for (let tick = 1; tick <= 45; tick++) {
    state.tick = tick;
    let zone = state.pointZones[0];
    if (zone) zone.age++;

    const occupied = new Set(state.players.map(p => `${p.position.x},${p.position.y}`));
    
    state.players.forEach(p => {
        occupied.delete(`${p.position.x},${p.position.y}`);
        
        let dx = 0; let dy = 0;
        if (zone) {
            const diffX = zone.position.x - p.position.x;
            const diffY = zone.position.y - p.position.y;
            
            if (diffX !== 0 && diffY !== 0) {
                if (Math.random() > 0.5) dx = diffX > 0 ? 1 : -1;
                else dy = diffY > 0 ? 1 : -1;
            } else if (diffX !== 0) {
                dx = diffX > 0 ? 1 : -1;
            } else if (diffY !== 0) {
                dy = diffY > 0 ? 1 : -1;
            }
        }
        
        if (Math.abs(dx) > 0 && Math.abs(dy) > 0) {
            if (Math.random() > 0.5) dx = 0; else dy = 0;
        }

        let nx = p.position.x + dx;
        let ny = p.position.y + dy;
        nx = Math.max(0, Math.min(9, nx));
        ny = Math.max(0, Math.min(9, ny));

        if (!occupied.has(`${nx},${ny}`)) {
            p.position.x = nx;
            p.position.y = ny;
        }
        occupied.add(`${p.position.x},${p.position.y}`);
    });

    if (zone) {
        const playersOnZone = state.players.filter(p => p.position.x === zone.position.x && p.position.y === zone.position.y);
        if (playersOnZone.length === 1) {
            state.pointZones[0] = { position: { x: Math.floor(Math.random()*6)+2, y: Math.floor(Math.random()*6)+2 }, age: 0 };
        }
    }
}
console.log(state.players);
