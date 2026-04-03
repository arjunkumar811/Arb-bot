use anchor_lang::prelude::*;

pub mod instructions {
	pub mod execute_arbitrage;
	pub use execute_arbitrage::*;
}

use instructions::*;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod arbitrage {
	use super::*;

	pub fn execute_arbitrage(
		ctx: Context<ExecuteArbitrage>,
		minimum_profit: u64,
	) -> Result<()> {
		instructions::execute_arbitrage(ctx, minimum_profit)
	}
}
