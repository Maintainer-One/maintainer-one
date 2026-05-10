const BOARD_SIZE = 10;
function calculateControlMap(players) {
    const controlMap = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
    const distMap = {
        A: Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(Infinity)),
        B: Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(Infinity))
    };

    for (const teamId of ['A', 'B']) {
        const queue = [];
        for (const p of players.filter(p => p.team === teamId)) {
            queue.push({ ...p.position, d: 0 });
            distMap[teamId][p.position.y][p.position.x] = 0;
        }

        while (queue.length > 0) {
            const { x, y, d } = queue.shift();
            for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE) {
                    if (distMap[teamId][ny][nx] > d + 1) {
                        distMap[teamId][ny][nx] = d + 1;
                        queue.push({ x: nx, y: ny, d: d + 1 });
                    }
                }
            }
        }
    }

    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            const dA = distMap.A[y][x];
            const dB = distMap.B[y][x];
            if (dA === Infinity && dB === Infinity) continue;
            if (dA < dB) controlMap[y][x] = 'A';
            else if (dB < dA) controlMap[y][x] = 'B';
            else controlMap[y][x] = 'CONTESTED';
        }
    }
    return controlMap;
}

const players = [
    { id: 'p1', team: 'A', position: { x: 2, y: 2 }, status: 'active' },
    { id: 'p2', team: 'A', position: { x: 2, y: 4 }, status: 'active' },
    { id: 'p3', team: 'A', position: { x: 2, y: 7 }, status: 'active' },
    { id: 'p4', team: 'B', position: { x: 7, y: 2 }, status: 'active' },
    { id: 'p5', team: 'B', position: { x: 7, y: 4 }, status: 'active' },
    { id: 'p6', team: 'B', position: { x: 7, y: 7 }, status: 'active' }
];

const cmap = calculateControlMap(players);
cmap.forEach(row => console.log(row.join('')));
