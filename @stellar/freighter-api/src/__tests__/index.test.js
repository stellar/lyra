import FreighterAPI from "../index";

describe("freighter API", () => {
  it("has keys", () => {
    expect(typeof FreighterAPI.isConnected).toBe("function");
    expect(typeof FreighterAPI.getPublicKey).toBe("function");
    expect(typeof FreighterAPI.signTransaction).toBe("function");
  });
});
