use anchor_lang::prelude::*;
use anchor_spl::token::TokenAccount;

pub fn repay(
	output_account: &Account<TokenAccount>,
	repayment_amount: u64,
) -> Result<()> {
	require!(
		output_account.amount >= repayment_amount,
		RepayError::RepaymentNotSatisfied
	);
	Ok(())
}

#[error_code]
pub enum RepayError {
	#[msg("Flash loan repayment not satisfied")]
	RepaymentNotSatisfied,
}
