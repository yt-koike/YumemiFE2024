import "@testing-library/jest-dom";
import { gcd, widthTable } from "@/app/prefecturePage";
import exp from "constants";

// 参考サイト: https://nextjs.org/docs/app/building-your-application/testing/jest
describe("数学的関数", () => {
  it("gcd", () => {
    expect(gcd([])).toBe(1);
    expect(gcd([5,15,25])).toBe(5);
  });
});