import { Container } from "../../src/di/container";

describe("Container", () => {
    const c = new Container();
    c.register("test", { value: 42 });
    
    it("should resolve registered values", () => {
        const resolved = c.resolve<{ value: number }>("test");
        expect(resolved.value).toBe(42);
    }); 
    it("should throw error for unregistered keys", () => {
        expect(() => c.resolve("unknown")).toThrow("No provider found for key: unknown");
    });
}); 