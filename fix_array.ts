import * as fs from 'node:fs';

const p = '/home/mitch/projects/maintainer-one/apps/landing/src/components/MockMultiviewCard.svelte';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(
	`controlMap: Array(10).fill(null).map(() => Array(10).fill(null)),`,
	`controlMap: [
				[null,null,null,null,null,null,null,null,null,null],
				[null,null,null,null,null,null,null,null,null,null],
				[null,null,null,null,null,null,null,null,null,null],
				[null,null,null,null,null,null,null,null,null,null],
				[null,null,null,null,null,null,null,null,null,null],
				[null,null,null,null,null,null,null,null,null,null],
				[null,null,null,null,null,null,null,null,null,null],
				[null,null,null,null,null,null,null,null,null,null],
				[null,null,null,null,null,null,null,null,null,null],
				[null,null,null,null,null,null,null,null,null,null]
			],`
);

fs.writeFileSync(p, c);
