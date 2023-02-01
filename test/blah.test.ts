import { QueryFactory } from "../src";

describe("blah", () => {
  it("works", () => {
    const factory = new QueryFactory([
      "string",
      "number",
      "keyword",
      "text",
    ], [] as Array<any>);

    factory.add({
      name: "type",
      type: "keyword",
    });

    factory.add({
      name: "content",
      type: "text",
    });

    factory.register({
      left: "$keyword",
      operator: "EQ",
      right: "string",
      transform({ left, right }, acc) {
      },
    });

    factory.register({
      left: "$text",
      operator: "SEARCH",
      right: "string",
    });

    factory.register({
      left: "$any",
      operator: "EXISTS",
    });

    const parsed = factory.parse(
      `content SEARCH "1" AND (content SEARCH "2" OR content SEARCH "3")  gf`,
    );
    console.log(parsed);
    console.log(JSON.stringify(parsed, null, 2));

    setInterval(() => {}, 1000);
  });
});
