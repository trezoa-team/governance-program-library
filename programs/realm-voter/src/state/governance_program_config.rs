use trezoaanchor_lang::prelude::*;

/// Configuration of an tpl-governance instance used to grant governance power
#[derive(AnchorSerialize, AnchorDeserialize, Debug, Clone, Copy, PartialEq, Default)]
pub struct GovernanceProgramConfig {
    /// The program id of the configured tpl-governance instance
    pub program_id: Pubkey,

    /// Reserved for future upgrades
    pub reserved: [u8; 8],
}
