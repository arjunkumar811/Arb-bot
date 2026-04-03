use anchor_lang::prelude::*;
use anchor_spl::token::TokenAccount;

pub fn borrow(_input_account: &Account<TokenAccount>, _amount: u64) -> Result<()> {
	// Placeholder: perform flash-loan CPI and validate funds received.
	Ok(())
}

pub fn validate_balance(
	input_account: &Account<TokenAccount>,
	expected_minimum: u64,
) -> Result<()> {
	require!(
		input_account.amount >= expected_minimum,
		FlashLoanError::InsufficientLoanAmount
	);
	Ok(())
}

#[error_code]
pub enum FlashLoanError {
	#[msg("Flash loan amount below expectation")]
	InsufficientLoanAmount,
}
