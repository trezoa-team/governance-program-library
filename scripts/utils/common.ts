// Load the payer keypair
import { Connection, Keypair } from '@trezoa/web3.js';
import { DEFAULT_KEYPAIR_PATH } from './constants';
import { TrezoaAnchorProvider, Wallet } from '@trezoa-xyz/trezoaanchor';

const keypairPath = process.env.KEYPAIR_PATH || DEFAULT_KEYPAIR_PATH;
let keypair = Keypair.fromSecretKey(Buffer.from(require(keypairPath), 'hex'));
try {
  keypair = Keypair.fromSecretKey(Buffer.from(require(keypairPath), 'hex'));
} catch (e) {
  console.error(`Unable to read keypair file at ${keypairPath}: ${e}`);
  process.exit(1);
}

const getConnection = (rpcUrl: string) => new Connection(rpcUrl, 'confirmed');
export const getProvider = (rpcUrl: string) => new TrezoaAnchorProvider(
  getConnection(rpcUrl),
  new Wallet(payer), {});

export const payer = keypair;