import { validateProfit } from "../bot/src/rules/profitValidator";

type TestCase = {
	name: string;
	input: {
		initialAmount: bigint;
		finalAmount: bigint;
		flashLoanFee: bigint;
		swapFee: bigint;
		minimumProfitThreshold: bigint;
	};
	expected: boolean;
};

const cases: TestCase[] = [
	{
		name: "Profitable scenario",
		input: {
			initialAmount: 1_000_000n,
			finalAmount: 1_020_000n,
			flashLoanFee: 2_000n,
			swapFee: 2_000n,
			minimumProfitThreshold: 5_000n,
		},
		expected: true,
	},
	{
		name: "Loss scenario",
		input: {
			initialAmount: 1_000_000n,
			finalAmount: 995_000n,
			flashLoanFee: 2_000n,
			swapFee: 2_000n,
			minimumProfitThreshold: 1_000n,
		},
		expected: false,
	},
	{
		name: "Zero profit scenario",
		input: {
			initialAmount: 1_000_000n,
			finalAmount: 1_000_000n,
			flashLoanFee: 0n,
			swapFee: 0n,
			minimumProfitThreshold: 1n,
		},
		expected: false,
	},
];

let failures = 0;

for (const testCase of cases) {
	const result = validateProfit(testCase.input);
	const passed = result.isProfitable === testCase.expected;
	const status = passed ? "PASS" : "FAIL";

	console.log(
		`${status} - ${testCase.name} | profit=${result.profit.toString()}`
	);

	if (!passed) {
		console.error(
			`Expected ${testCase.expected} but got ${result.isProfitable}`
		);
		failures += 1;
	}
}

if (failures > 0) {
	process.exit(1);
}
