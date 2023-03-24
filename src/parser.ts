import { QueryFactory } from "./factory";
import { Group, isTokenOf, Statement, Token } from "./types";

export class Parser {
  #input: string;
  #index: number;
  #factory: QueryFactory<string, any>;

  constructor(input: string, factory: QueryFactory<string, any>) {
    this.#input = input;
    this.#index = 0;
    this.#factory = factory;
  }

  parse() {
    return this.#readGroup();
  }

  #readGroup(): Group {
    const list: Group = [];

    while (this.#index < this.#input.length) {
      this.#readWhitespace();
      const statement = this.#readStatement();
      list.push(statement);

      this.#readWhitespace();
      const token = this.#readToken();

      if (isTokenOf("LOGICAL_AND", token)) {
        list.push("AND");
      } else if (isTokenOf("LOGICAL_OR", token)) {
        list.push("OR");
      } else if (isTokenOf("LOGICAL_GROUP_END", token)) {
        break;
      } else if (token) {
        this.#raise("Expected logical AND or OR token.");
      }

      this.#readWhitespace();
      if (this.#readMatch("(")) {
        list.push(this.#readGroup());
      }
    }

    return list;
  }

  #readStatement(): Statement {
    const left = this.#readToken();
    if (!isTokenOf("LITERAL_VALUE", left) && !isTokenOf("REFERENCE", left)) {
      throw this.#raise("Expected literal value or reference.");
    }
    this.#readWhitespace();

    const operator = this.#readWord();
    this.#readWhitespace();

    const right = this.#readToken();
    if (!isTokenOf("LITERAL_VALUE", right) && !isTokenOf("REFERENCE", right)) {
      throw this.#raise("Expected literal value or reference.");
    }

    return { left, operator, right };
  }

  #readMatch(match: string) {
    if (this.#input.slice(this.#index, this.#index + match.length) === match) {
      this.#index += match.length;
      return true;
    }

    return false;
  }

  #canReadNumber() {
    return (
      !isNaN(parseInt(this.#input[this.#index])) ||
      this.#input[this.#index] === "."
    );
  }

  #readNumber() {
    const value = this.#readWord();
    const num = Number(value);

    if (isNaN(num)) {
      this.#expect("valid number");
    }

    return num;
  }

  #canReadString() {
    return this.#input[this.#index] === '"' || this.#input[this.#index] === "'";
  }

  #readString() {
    let value = "";
    let quote: string | undefined;
    let escape = false;

    while (this.#index < this.#input.length) {
      if (!quote) {
        if (
          this.#input[this.#index] === '"' ||
          this.#input[this.#index] === "'"
        ) {
          quote = this.#input[this.#index];
          this.#index++;
          continue;
        } else {
          this.#expect("single or double quote");
        }
      }

      if (escape) {
        if (
          this.#input[this.#index] === "\\" ||
          this.#input[this.#index] === quote
        ) {
          value += this.#input[this.#index];
          escape = false;
          this.#index++;
          continue;
        } else {
          this.#expect("backslash or quote");
        }
      }

      if (this.#input[this.#index] === "\\") {
        escape = true;
        this.#index++;
        continue;
      }

      if (this.#input[this.#index] === quote) {
        this.#index++;
        break;
      }

      value += this.#input[this.#index];
      this.#index++;
    }

    return value;
  }

  #readToken(): Token | null {
    if (this.#readMatch("true")) {
      return { type: "LITERAL_VALUE", value: true };
    }

    if (this.#readMatch("false")) {
      return { type: "LITERAL_VALUE", value: false };
    }

    if (this.#canReadNumber()) {
      return { type: "LITERAL_VALUE", value: this.#readNumber() };
    }

    if (this.#canReadString()) {
      return { type: "LITERAL_VALUE", value: this.#readString() };
    }

    if (this.#readMatch("AND")) {
      return { type: "LOGICAL_AND" };
    }

    if (this.#readMatch("OR")) {
      return { type: "LOGICAL_OR" };
    }

    if (this.#readMatch("(")) {
      return { type: "LOGICAL_GROUP_BEGIN" };
    }

    if (this.#readMatch(")")) {
      return { type: "LOGICAL_GROUP_END" };
    }

    const word = this.#readWord();

    if (word.length > 0) {
      return {
        type: "REFERENCE",
        name: word,
      };
    }

    return null;
  }

  #readWhitespace() {
    while (this.#input[this.#index] === " ") {
      this.#index += 1;
    }
  }

  #readWord(): string {
    let word = "";

    while (this.#index < this.#input.length) {
      if (
        this.#input[this.#index] === " " ||
        this.#input[this.#index] === "(" ||
        this.#input[this.#index] === ")"
      ) {
        this.#index++;
        break;
      }

      word += this.#input[this.#index++];
    }

    return word;
  }

  #raise(msg: string, pos: number | null = this.#index) {
    let out = `${this.#input}\n`;

    if (pos != null) {
      for (let i = 0; i < pos; i++) {
        out += " ";
      }
      out += "^ ";
    }

    console.error(out);

    throw new Error(msg);
  }

  #expect(name: string) {
    this.#raise(`Expected "${name}" in position ${this.#index}.`, this.#index);
  }

  #unexpect(token: string) {
    this.#raise(
      `Unexpected token "${token}" in position ${this.#index - token.length}.`,
      this.#index - token.length,
    );
  }
}
