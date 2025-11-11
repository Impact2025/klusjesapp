export class Timestamp {
  private readonly date: Date;

  private constructor(date: Date) {
    this.date = date;
  }

  static now(): Timestamp {
    return new Timestamp(new Date());
  }

  static fromDate(date: Date): Timestamp {
    return new Timestamp(date);
  }

  static fromMillis(millis: number): Timestamp {
    return new Timestamp(new Date(millis));
  }

  static fromISO(isoString: string): Timestamp {
    return new Timestamp(new Date(isoString));
  }

  toDate(): Date {
    return this.date;
  }

  toMillis(): number {
    return this.date.getTime();
  }

  toISOString(): string {
    return this.date.toISOString();
  }
}

export type SerializableTimestamp = string;

export const serializeTimestamp = (timestamp: Timestamp | null | undefined): SerializableTimestamp | null =>
  timestamp ? timestamp.toISOString() : null;

export const deserializeTimestamp = (value: SerializableTimestamp | null | undefined): Timestamp | null =>
  value ? Timestamp.fromISO(value) : null;
