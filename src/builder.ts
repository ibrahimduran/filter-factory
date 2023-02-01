import { QueryFactory } from "./factory";
import { Group, ValueOrReference } from "./types";

export class QueryBuilder {
  readonly #factory: QueryFactory<string, unknown>;

  constructor(factory: QueryFactory<string, any>, acc: unknown) {
    this.#factory = factory;
  }

  and(left: ValueOrReference, operator: string, right: ValueOrReference) {
    return this;
  }

  or(left: ValueOrReference, operator: string, right: ValueOrReference) {
    return this;
  }
}
