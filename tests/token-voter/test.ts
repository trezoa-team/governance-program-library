import * as trezoaanchor from "@trezoa-xyz/trezoaanchor";
import { Program } from "@trezoa-xyz/trezoaanchor";
import {TokenVoter} from "../../target/types/token_voter";
import idl from "../../target/idl/token_voter.json";
import { GovernanceConfig, TplGovernance } from "governance-idl-sdk";
import secret from "../../../../sol/id.json";
import { Connection, Transaction, sendAndConfirmTransaction } from "@trezoa/web3.js";
import { token } from "@trezoa-xyz/trezoaanchor/dist/cjs/utils";

const connection = new trezoaanchor.web3.Connection(trezoaanchor.web3.clusterApiUrl("devnet"));
const web3Connection = new Connection(trezoaanchor.web3.clusterApiUrl("devnet"));
const keypair = trezoaanchor.web3.Keypair.fromSecretKey(Uint8Array.from(secret));
const wallet = new trezoaanchor.Wallet(keypair);

const provider = new trezoaanchor.TrezoaAnchorProvider(connection, wallet, {});
const program = new Program<TokenVoter>(idl as TokenVoter, provider);
const tplGovernance = new TplGovernance(web3Connection)

describe("token-voter", () => {
  const governanceProgramId = new trezoaanchor.web3.PublicKey("GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw")
  const realm = new trezoaanchor.web3.PublicKey("A2MqSD5iEqTjBkTg9naHoS5x1YLhQemrJTcBEFXoasph")
  const governingTokenMint = new trezoaanchor.web3.PublicKey("6WddAU5ryy4BSNWqNPM3LsPYcirKY2ax7U2yfkzwe1kq")
  const governingTokenOwner = wallet.publicKey

  const [registrar] = trezoaanchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("registrar"),
      realm.toBytes(),
      governingTokenMint.toBytes()
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

  const [maxVoterWeightRecord] = trezoaanchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("max-voter-weight-record"),
      realm.toBytes(),
      governingTokenMint.toBytes()
    ], 
    program.programId
  )

  xit("create the registrar", async() => {
    const tx = await program.methods.createRegistrar(1)
      .accounts({
        governanceProgramId,
        realm,
        governingTokenMint,
        realmAuthority: governingTokenOwner,
        })
      .rpc();

    console.log(tx)
  })

  const ownerAta = token.associatedAddress({mint: governingTokenMint, owner: keypair.publicKey})

  xit("creates voter weight record", async() => {
    const tx = await program.methods.createVoterWeightRecord()
    .accounts({
      registrar
    })
    .rpc()

    console.log(tx)
  })

  xit("creates max vwr", async() => {
    const tx = await program.methods.createMaxVoterWeightRecord()
    .accounts({
      registrar,
      realm,
      governanceProgramId,
      realmGoverningTokenMint: governingTokenMint      
    }).rpc()

    console.log(tx)
  })


  xit("configures mint", async() => {
    const tx = await program.methods.configureMintConfig(0)
    .accounts({
      registrar,
      realm,
      realmAuthority: keypair.publicKey,
      mint: governingTokenMint,
      maxVoterWeightRecord,
      governanceProgramId
    })
    .rpc()

    console.log(tx)
  })

  it("deposits tokens", async() => {
    const tx = await program.methods.deposit(0, new trezoaanchor.BN(350))
    .accountsPartial({
      mint: governingTokenMint,
      tokenOwnerRecord,
      depositAuthority: keypair.publicKey,
      tokenProgram: token.TOKEN_PROGRAM_ID,
      registrar
    })
    .rpc()

    console.log(tx)
  })
});
