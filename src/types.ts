export type LiteralValueToken = {
  type: "LITERAL_VALUE";
  value: number | string | boolean;
};
export type ReferenceToken = { type: "REFERENCE"; name: string };
export type LogicalAndToken = { type: "LOGICAL_AND" };
export type LogicalOrToken = { type: "LOGICAL_OR" };
export type LogicalGroupBeginToken = { type: "LOGICAL_GROUP_BEGIN" };
export type LogicalGroupEndToken = { type: "LOGICAL_GROUP_END" };

export type Token =
  | LiteralValueToken
  | ReferenceToken
  | LogicalAndToken
  | LogicalOrToken
  | LogicalGroupBeginToken
  | LogicalGroupEndToken;

export function isTokenOf<Type extends Token["type"]>(
  type: Type,
  token: Token | null,
): token is Extract<Token, { type: Type }> {
  return token !== null && token.type === type;
}

export interface Statement {
  left: LiteralValueToken | ReferenceToken;
  operator: string;
  right?: LiteralValueToken | ReferenceToken;
}

// export type Group = { op: "AND" | "OR"; children: Array<Statement | Group> };
export type Group<T = Statement> = Array<T | "AND" | "OR" | Group>;

export type ValueOrReference = { name: string } | number | string | boolean;
