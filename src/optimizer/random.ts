export class SeededRandom {
  constructor(private state: number) {}

  next(): number {
    this.state = (1664525 * this.state + 1013904223) >>> 0;
    return this.state / 2 ** 32;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  pick<T>(values: T[]): T {
    return values[this.nextInt(0, values.length - 1)];
  }

  shuffle<T>(arr: T[]): T[] {
    const output = [...arr];
    for (let i = output.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [output[i], output[j]] = [output[j], output[i]];
    }
    return output;
  }
}
