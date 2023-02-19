import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CircularBufferComponent } from './circular-buffer.component';
import fc from 'fast-check';

class CircularBufferModel {
  capacity?: number = undefined;
  contents: number[] = [];
  next: number = 0;
}

class CircularBufferContext {
  component?: CircularBufferComponent;
}

type CircularBufferCommand = fc.Command<
  CircularBufferModel,
  CircularBufferContext
>;

class ConstructCommand implements CircularBufferCommand {
  constructor(readonly requiredCapacity: number) {}

  check(m: Readonly<CircularBufferModel>): boolean {
    return m.capacity === undefined;
  }
  run(m: CircularBufferModel, c: CircularBufferContext): void {
    c.component = new CircularBufferComponent();
    c.component!.capacity = this.requiredCapacity;
    c.component!.ngOnInit();
    m.capacity = this.requiredCapacity;
  }
  toString(): string {
    return `Construct(${this.requiredCapacity})`;
  }
}

class PutCommand implements CircularBufferCommand {
  check(m: Readonly<CircularBufferModel>): boolean {
    return m.capacity !== undefined && m.capacity > m.contents.length;
  }
  run(m: CircularBufferModel, c: CircularBufferContext): void {
    const x = m.next++;
    m.contents.push(x);
    c.component!.put();
  }
  toString(): string {
    return `Put`;
  }
}

class GetCommand implements CircularBufferCommand {
  check(m: Readonly<CircularBufferModel>): boolean {
    return m.capacity !== undefined && m.contents.length > 0;
  }
  run(m: CircularBufferModel, c: CircularBufferContext): void {
    const [x, ...ignore] = m.contents;
    m.contents = ignore;
    const wrongX = c.component!.get();
    expect(wrongX).toBe(x);
  }
  toString(): string {
    return `Get`;
  }
}

class SizeCommand implements CircularBufferCommand {
  check(m: Readonly<CircularBufferModel>): boolean {
    return m.capacity !== undefined;
  }
  run(m: CircularBufferModel, c: CircularBufferContext): void {
    const size = m.contents.length;
    const wrongSize = c.component!.getSize();
    expect(wrongSize).toBe(size);
  }
  toString(): string {
    return `Size`;
  }
}

describe('CircularBuffer', () => {
  const allCommandsWithCapacityInRange = (
    minCapacity: number,
    maxCapacity: number
  ) =>
    fc.commands([
      fc
        .integer({ min: minCapacity, max: maxCapacity })
        .map((capacity) => new ConstructCommand(capacity)),
      fc.constant(new PutCommand()),
      fc.constant(new GetCommand()),
      fc.constant(new SizeCommand()),
    ]);

  it('should calculate the correct size if capacity is in range of [1,1] (limited search space)', () =>
    fc.assert(
      fc.property(allCommandsWithCapacityInRange(1, 1), (commands) => {
        const real = new CircularBufferContext();
        const model = new CircularBufferModel();
        fc.modelRun(() => ({ model, real }), commands);
      }),
      {
        numRuns: 1000,
      }
    ));

  it('should calculate the correct size if capacity is in range of [2,2] (limited search space)', () =>
    fc.assert(
      fc.property(allCommandsWithCapacityInRange(2, 2), (commands) => {
        const real = new CircularBufferContext();
        const model = new CircularBufferModel();
        fc.modelRun(() => ({ model, real }), commands);
      }),
      {
        numRuns: 1000,
      }
    ));
  it('should calculate the correct size if capacity is in range of [10, 10000] (wide search space)', () =>
    fc.assert(
      fc.property(allCommandsWithCapacityInRange(10, 10000), (commands) => {
        const real = new CircularBufferContext();
        const model = new CircularBufferModel();
        fc.modelRun(() => ({ model, real }), commands);
      }),
      {
        numRuns: 1000,
      }
    ));
});
