/**
 * Seedable LCG (Linear Congruential Generator) for deterministic randomness.
 * We store the state as a single number to make GameState easily serializable.
 */

export class DeterministicRNG {
	private state: number;

	constructor(seed: number) {
		this.state = seed || 1;
		if (this.state < 0) {
			this.state = (this.state % 4294967296) + 4294967296;
		}
	}

	/**
	 * Returns a pseudo-random number between 0 and 1.
	 * Updates the internal state.
	 */
	next(): number {
		// LCG parameters (using common ones)
		this.state = (this.state * 1664525 + 1013904223) % 4294967296;
		if (this.state < 0) {
			this.state += 4294967296;
		}
		return this.state / 4294967296;
	}

	/**
	 * Returns a random integer between min (inclusive) and max (inclusive).
	 */
	nextInt(min: number, max: number): number {
		return Math.floor(this.next() * (max - min + 1)) + min;
	}

	getState(): number {
		return this.state;
	}
}
