import { CostClass, ReliabilityClass } from '../registry/types';

export function costRank(c: CostClass): number {
  switch (c) {
    case 'LOW':
      return 0;
    case 'MEDIUM':
      return 1;
    case 'HIGH':
      return 2;
  }
}

export function reliabilityRank(r: ReliabilityClass): number {
  switch (r) {
    case 'LOW':
      return 0;
    case 'MEDIUM':
      return 1;
    case 'HIGH':
      return 2;
  }
}

export function buildTieBreakString(): string {
  return 'score>cost>reliability>lex';
}
