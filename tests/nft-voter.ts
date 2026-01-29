import * as trezoaanchor from "@trezoa-xyz/trezoaanchor";
import { Program } from "@trezoa-xyz/trezoaanchor";
import { NftVoter } from "../target/types/nft_voter";

describe("nft-voter", () => {

  const program = trezoaanchor.workspace.NftVoter as Program<NftVoter>;

  it("Is initialized!", async () => {

    const records = program.account.voterWeightRecord.all();
    // Add your test here.
    //const tx = await program.rpc.createRegistrar({});
    console.log("Your transaction signature", records);
  });
});
