import * as trezoaanchor from "@trezoa-xyz/trezoaanchor";
import { Program } from "@trezoa-xyz/trezoaanchor";
import {BonkPlugin} from "../../target/types/bonk_plugin";
import idl from "../../target/idl/bonk_plugin.json";
import {StakeIdl, stakeIdl} from "./stake-idl";
import { GovernanceConfig, TplGovernance } from "governance-idl-sdk";
import secret from "../../../../sol/id.json";
import { Connection, Transaction, sendAndConfirmTransaction, clusterApiUrl } from "@trezoa/web3.js";
import { token } from "@trezoa-xyz/trezoaanchor/dist/cjs/utils";

const connection = new trezoaanchor.web3.Connection(trezoaanchor.web3.clusterApiUrl("devnet"));
const web3Connection = new Connection(clusterApiUrl("devnet"));
const keypair = trezoaanchor.web3.Keypair.fromSecretKey(Uint8Array.from(secret));
const wallet = new trezoaanchor.Wallet(keypair);

const provider = new trezoaanchor.TrezoaAnchorProvider(connection, wallet, {});
const program = new Program<BonkPlugin>(idl as BonkPlugin, provider);
const stakeProgram = new Program<StakeIdl>(stakeIdl as StakeIdl, provider);
const tplGovernance = new TplGovernance(web3Connection)

describe("bonk-plugin", () => {
  const governanceProgramId = new trezoaanchor.web3.PublicKey("GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw")
  const realm = new trezoaanchor.web3.PublicKey("A2MqSD5iEqTjBkTg9naHoS5x1YLhQemrJTcBEFXoasph")
  const stakePool = new trezoaanchor.web3.PublicKey("9YbGRA8qfDeJuonKJuZYzDXcRVyB2B6cMPCWpTeC1eRL")
  //8TPev5NsgJoViPrRUXp7F1HjUhmHDjzknG4i82FPVWkT
  const governingTokenMint = new trezoaanchor.web3.PublicKey("6WddAU5ryy4BSNWqNPM3LsPYcirKY2ax7U2yfkzwe1kq")
  const governingTokenOwner = wallet.publicKey
  const previousVoterWeightPluginProgramId = new trezoaanchor.web3.PublicKey("BUsq2cFH6cmfYcoveaf52BkPaXUW3ZhTUnFybyaJrtkN")

  const governanceKey = new trezoaanchor.web3.PublicKey("GyzFPcYaG6wfoi7Y3jLxAvXZWDR3nNqni1cJxkTSQHuq")
  const proposalKey = new trezoaanchor.web3.PublicKey("AmGnTWwrJSszBgtRTA3j4pRL6o9GNsBuEQj3UY85AQwB")
  const ownerAta = token.associatedAddress({mint: governingTokenMint, owner: keypair.publicKey})
  const stakeMintToken = new trezoaanchor.web3.PublicKey("J5d7DVTTdGj7KcDtuFWL3322rasxHjpHhUmEzqFLHjuB")
  const vaultAta = "5DpomEty6Rgpe46wu8dyCs8bQviFJdo2yRbxBBxH8NbM"
  const ownerStakeMintAta = token.associatedAddress({mint: stakeMintToken, owner: keypair.publicKey})

  // const governanceKey = tplGovernance.pda.governanceAccount({
  //   realmAccount: realm,
  //   seed: realm
  // }).publicKey

  // const proposalKey = tplGovernance.pda.proposalAccount({
  //   governanceAccount: governanceKey,
  //   governingTokenMint,
  //   proposalSeed: realm
  // }).publicKey


  const [registrar] = trezoaanchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("registrar"),
      realm.toBytes(),
      governingTokenMint.toBytes()
    ], 
    program.programId
  )

  const [voterWeightRecord] = trezoaanchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("voter-weight-record"),
      realm.toBytes(),
      governingTokenMint.toBytes(),
      governingTokenOwner.toBytes()
    ], 
    program.programId
  )

  const [inputVoterWeight] = trezoaanchor.web3.PublicKey.findProgramAddressSync(
    [
      new trezoaanchor.web3.PublicKey("D5UGhWTuEoDzgk5NFJL1zdeogV5HP3Fa9VT5Ep12yzXG").toBytes(),
      Buffer.from("voter-weight-record"),
      governingTokenOwner.toBytes()
    ], 
    previousVoterWeightPluginProgramId
  )

  const [stakeDepositRecord] = trezoaanchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("stake-deposit-record"),
      voterWeightRecord.toBytes()
    ], 
    program.programId
  )

  const [tokenOwnerRecord] = trezoaanchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("governance"),
      realm.toBytes(),
      governingTokenMint.toBytes(),
      governingTokenOwner.toBytes()
    ], 
    governanceProgramId
  ) 

  const [stakeDepositReceiptOne] = trezoaanchor.web3.PublicKey.findProgramAddressSync(
    [
      keypair.publicKey.toBytes(),
      stakePool.toBytes(),
      new trezoaanchor.BN(0).toArrayLike(Buffer, 'le', 4),
      Buffer.from("stakeDepositReceipt")
    ],
    stakeProgram.programId
  )

  const stakeDepositReceipts = [
    // 0,1,2,3,4,5,6,
    // 7,8,9,
    // 10,
    // 11,
    // 12,
    // 13,
    // 14,
  ].map(i => {
    const [stakeDepositReceipt] = trezoaanchor.web3.PublicKey.findProgramAddressSync(
      [
        keypair.publicKey.toBytes(),
        stakePool.toBytes(),
        new trezoaanchor.BN(i).toArrayLike(Buffer, 'le', 4),
        Buffer.from("stakeDepositReceipt")
      ],
      stakeProgram.programId
    )

    return stakeDepositReceipt
  })

  const remainingAccounts = stakeDepositReceipts.map(address => (
    {pubkey: address, isSigner: false, isWritable: false}
  ))
  // const remainingAccounts = [{pubkey: stakePool, isSigner: false, isWritable: false}]

  it("Is initializes registrar!", async () => {
    try {
      const tx = await program.methods.createRegistrar()
      .accounts({
        governanceProgramId,
        realm,
        stakePool,
        governingTokenMint,
        realmAuthority: keypair.publicKey,
        previousVoterWeightPluginProgramId: null
      })
      .instruction();
      
      const txx = new Transaction().add(tx)
      const sig = await sendAndConfirmTransaction(web3Connection, txx, [keypair])
      console.log(sig)

      // console.log("Your transaction signature", tx);
    } catch(e) {
      console.log(e)
    }

  });

  xit("creates voter weight record", async() => {
    const tx = await program.methods.createVoterWeightRecord(
      governingTokenOwner
    )
    .accountsPartial({
      voterWeightRecord,
      registrar,
      stakeDepositRecord
    })
    .instruction()

    const txx = new Transaction().add(tx)
    const sig = await sendAndConfirmTransaction(web3Connection, txx, [keypair])
    console.log(sig)
    // console.log("Your transaction signature", tx);
  })

  xit("updates voter weight record", async() => {
    const updateVwrIx = await program.methods.updateVoterWeightRecord(
      stakeDepositReceipts.length,
      proposalKey,
      {createProposal:{}}
    )
    .accounts({
      registrar,
      voterWeightRecord,
      inputVoterWeight,
      governance: governanceKey,
      proposal: proposalKey,
      voterAuthority: keypair.publicKey,
      voterTokenOwnerRecord: tokenOwnerRecord,
    })
    .remainingAccounts(remainingAccounts)
    .instruction()

    // console.log(updateVwrIx.keys.map(k => k.pubkey.toBase58()))
    const txx = new Transaction().add(updateVwrIx)
    const sig = await sendAndConfirmTransaction(web3Connection, txx, [keypair])
    console.log(sig)

  })

  // it("it closes accounts", async() => {
  //   const x = await program.methods.closeTemp()
  //   .accounts({
  //     voterWeightRecord,
  //     stakeDepositRecord
  //   })
  //   .rpc()
  //   console.log(x)
  // })

  xit("fetches registrar", async() => {
    const registrarInfo = await program.account.registrar.fetch(registrar)
    console.log(registrarInfo)
  })

  xit("fetches Voter Weight Record", async() => {
    const vwrInfo = await program.account.voterWeightRecord.fetch(voterWeightRecord)
    console.log(vwrInfo)
    console.log("THe current power is: ", vwrInfo.voterWeight.toNumber())

    const sdrInfo = await program.account.stakeDepositRecord.fetch(stakeDepositRecord)
    console.log(sdrInfo)
  })

  xit("creates stake deposit receipt", async() => {
    const nonce = 0

    try {
      const ixs = await Promise.all(stakeDepositReceipts.map(async(nn,i) => {
        return await stakeProgram.methods.deposit(
          i+15,
          new trezoaanchor.BN(1000),
          new trezoaanchor.BN(364000)
        ).accounts({
          owner: keypair.publicKey,
          from: ownerAta,
          vault: vaultAta,
          stakeMint: stakeMintToken,
          stakePool,
          stakeDepositReceipt: nn,
          systemProgram: trezoaanchor.web3.SystemProgram.programId,
          rent: trezoaanchor.web3.SYSVAR_RENT_PUBKEY,
          tokenProgram: token.TOKEN_PROGRAM_ID,
          payer: keypair.publicKey,
          destination: ownerStakeMintAta
        })
        .instruction()
      }))
      
      const tx = new Transaction().add(...ixs)
      const sig = await sendAndConfirmTransaction(web3Connection, tx, [keypair])
      console.log(sig)
    } catch(e) {console.log(e)} 
  })

  xit("creates proposal", async() => {
    try {
    const createProposalIx = await tplGovernance.createProposalInstruction(
      `This is the test proposal ${Math.floor(Math.random()*100000)}`,
      "",
      {
        choiceType: "single",
        multiChoiceOptions: null
      },
      ["yes"],
      true,
      realm,
      governanceKey,
      tokenOwnerRecord,
      governingTokenMint,
      governingTokenOwner,
      governingTokenOwner,
      realm
    )

    console.log(createProposalIx.keys.map(k => k.pubkey.toBase58()))

    const tx = new Transaction().add(createProposalIx)
    const sig = await sendAndConfirmTransaction(web3Connection, tx, [keypair])
    console.log(sig)
    } catch(e) {
      console.log(e)
    }
  })

  xit("creates governance", async() => {
    const config: GovernanceConfig = {
      minCommunityWeightToCreateProposal: new trezoaanchor.BN(1),
      minCouncilWeightToCreateProposal: new trezoaanchor.BN(1),
      communityVoteThreshold: { yesVotePercentage: [20]},
      communityVetoVoteThreshold: {disabled: {}},
      councilVetoVoteThreshold: {yesVotePercentage: [1]},
      councilVoteThreshold: {yesVotePercentage: [1]},
      minTransactionHoldUpTime: 0,
      councilVoteTipping: {early: {}},
      communityVoteTipping: {early: {}},
      votingBaseTime: 86400,
      votingCoolOffTime: 0,
      depositExemptProposalCount: 100
    }

    const createGovernanceIx = await tplGovernance.createGovernanceInstruction(
      config,
      realm,
      wallet.publicKey,
      tokenOwnerRecord,
      wallet.publicKey,
      realm
    )

    const tx = new Transaction().add(createGovernanceIx)
    const sig = await sendAndConfirmTransaction(web3Connection, tx, [keypair])
    console.log(sig)
  })

});
