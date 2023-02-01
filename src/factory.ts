import { QueryBuilder } from "./builder";
import { Parser } from "./parser";

interface Reference<Types extends string = string> {
  name: string;
  type: Types;
}

interface Operator<Types extends string, Acc> {
  left: Token<Types>;
  operator: string;
  right?: Token<Types>;
  transform?: (
    value: {
      left: { name: string; value: string | number | boolean };
      right: { name: string; value: string | number | boolean };
    },
    acc: Acc,
  ) => void | boolean;
}

type Token<Types extends string = string> =
  | "any"
  | "any[]"
  | "$any"
  | "$any[]"
  | Types
  | `${Types}[]`
  | `$${Types}`
  | `$${Types}[]`;

export class QueryFactory<Types extends string, Acc> {
  readonly #references: Reference[] = [];
  readonly #operators: Operator<Types, Acc>[] = [];
  readonly #operatorSet = new Set<string>();
  readonly #referenceSet = new Set<string>();
  readonly #types: Types[] = [];
  readonly #tokens: Token<Types>[] = [];
  readonly #acc: Acc | undefined;

  constructor(types: Types[] | QueryFactory<Types, Acc> = [], acc?: Acc) {
    if (!Array.isArray(types)) {
      this.#references = types.#references;
      this.#referenceSet = types.#referenceSet;
      this.#types = types.#types;
      this.#tokens = types.#tokens;
    } else {
      this.#types = types;
      this.#tokens = ["any", "any[]", "$any", "$any[]"];
    }

    this.#acc = acc;
  }

  get definitions() {
    return this.#operators;
  }

  get operators() {
    return Array.from(this.#operatorSet.values());
  }

  get references() {
    return Array.from(this.#referenceSet.values());
  }

  get types() {
    return this.#types;
  }

  get(name: string) {
    if (!this.#referenceSet.has(name)) {
      throw new Error(`Reference "${name}" does not exist.`);
    }

    return this.#references.find((x) => x.name === name);
  }

  add(def: Reference<Types>) {
    if (this.#referenceSet.has(def.name)) {
      throw new Error(`Reference "${def.name}" already exists.`);
    }

    this.#references.push(def);
    this.#referenceSet.add(def.name);
    this.#tokens.push(def.type);
    this.#tokens.push(`$${def.type}`);
    this.#tokens.push(`${def.type}[]`);
  }

  register(
    def: Operator<Types, Acc>,
  ) {
    this.#operators.push(def);
    this.#operatorSet.add(def.operator);
  }

  parse(input: string): any[] {
    return new Parser(input, this).parse();
  }

  narrow(
    filter: {
      left?: Token<Types>;
      operator?: string;
      right?: Token<Types> | null;
    } = {},
    throwError = false,
  ): QueryFactory<Types, Acc> {
    const narrowed = new QueryFactory(this);

    this.#operators.forEach((op) => {
      if (
        filter.left &&
        filter.left !== "$any" &&
        op.left !== "$any" &&
        op.left !== filter.left
      ) {
        return;
      }

      if (filter.operator && op.operator !== filter.operator) {
        return;
      }

      if (filter.right === null && op.right) {
        return;
      }

      if (
        filter.right &&
        filter.right !== "$any" &&
        op.right !== "$any" &&
        op.right !== filter.right
      ) {
        return;
      }

      narrowed.register(op);
    });

    if (narrowed.#operators.length === 0 && throwError) {
      if (this.#operators.length > 0) {
        console.log("Expected one of these:");
        this.#operators.forEach((x) =>
          console.log(` ${x.left} ${x.operator} ${x.right ?? ""}`)
        );
      } else {
        console.log("No overload found.");
      }
      throw new Error(`Narrowing ${JSON.stringify(filter)} failed.`);
    }

    return narrowed;
  }

  create(): QueryBuilder {
    return new QueryBuilder(
      this,
      this.#acc ? JSON.parse(JSON.stringify(this.#acc)) : this.#acc,
    );
  }

  public token(token: Token<Types> | string) {
    const x = this.#tokens.find((x) => x === token);

    if (!x) {
      throw new Error(`Type "${token}" not found.`);
    }

    return x;
  }

  public reference(name: string) {
    const x = this.#references.find((x) => x.name === name);

    if (!x) {
      throw new Error(`Reference "${name}" not found.`);
    }

    return x;
  }
}
