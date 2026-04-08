use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};

use super::{flash_loan, repay, swap};

#[derive(Accounts)]
pub struct ExecuteArbitrage<'info> {
	#[account(mut)]
	pub payer: Signer<'info>,
	#[account(mut)]
	pub input_token_account: Account<'info, TokenAccount>,
	#[account(mut)]
	pub output_token_account: Account<'info, TokenAccount>,
	pub token_program: Program<'info, Token>,
}

#[event]
pub struct ArbitrageExecuted {
	pub profit: u64,
	pub final_amount: u64,
	pub repayment_amount: u64,
}

pub fn execute_arbitrage(
	ctx: Context<ExecuteArbitrage>,
	minimum_profit: u64,
	flash_loan_repayment: u64,
) -> Result<()> {
	flash_loan::validate_balance(&ctx.accounts.input_token_account, flash_loan_repayment)?;

	swap::execute_swaps(ctx.remaining_accounts)?;

	repay::repay(&ctx.accounts.output_token_account, flash_loan_repayment)?;

	// Swap CPIs are expected to mutate token accounts before profit check.
	let input_amount = ctx.accounts.input_token_account.amount;
	let output_amount = ctx.accounts.output_token_account.amount;
	let profit = output_amount.saturating_sub(input_amount);

	require!(profit >= minimum_profit, ArbitrageError::NotProfitable);

	emit!(ArbitrageExecuted {
		profit,
		final_amount: output_amount,
		repayment_amount: flash_loan_repayment,
	});

	Ok(())
}

#[error_code]
pub enum ArbitrageError {
	#[msg("Arbitrage not profitable")]
	NotProfitable,
}
