import {
  Deposit as DepositEvent,
  Withdraw as WithdrawEvent,
} from "../generated/TalentVault/TalentVault";
import { Deposit, Withdraw, Owner, GlobalState } from "../generated/schema";
import { BigInt, Bytes, log } from "@graphprotocol/graph-ts";

const GLOBAL_STATE_ID = "global-state";
const ZERO_NUMBER = BigInt.fromI32(0);
const ONE_NUMBER = BigInt.fromI32(1);

function getOrCreateGlobalState(): GlobalState {
  let state = GlobalState.load(GLOBAL_STATE_ID);
  if (!state) {
    state = new GlobalState(GLOBAL_STATE_ID);
    state.totalDeposits = ZERO_NUMBER;
    state.totalWithdraws = ZERO_NUMBER;
    state.activeParticipants = ZERO_NUMBER;
    state.totalBalance = ZERO_NUMBER;
    state.save();
  }
  return state;
}

function getOrCreateOwner(address: Bytes): Owner {
  let owner = Owner.load(address);
  if (!owner) {
    owner = new Owner(address);
    owner.balance = ZERO_NUMBER;
    owner.save();
  }
  return owner;
}

export function handleDeposit(event: DepositEvent): void {
  let entity = new Deposit(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.sender = event.params.sender;
  let owner = getOrCreateOwner(event.params.owner);
  entity.owner = owner.id;
  entity.assets = event.params.assets;
  entity.shares = event.params.shares;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();

  const globalState = getOrCreateGlobalState();

  if (
    owner.balance.equals(ZERO_NUMBER) &&
    event.params.assets.gt(ZERO_NUMBER)
  ) {
    globalState.activeParticipants =
      globalState.activeParticipants.plus(ONE_NUMBER);
  }
  owner.balance = owner.balance.plus(event.params.assets);
  owner.save();

  // Update global state
  globalState.totalDeposits = globalState.totalDeposits.plus(ONE_NUMBER);
  globalState.totalBalance = globalState.totalBalance.plus(event.params.assets);
  globalState.save();
}

export function handleWithdraw(event: WithdrawEvent): void {
  const entity = new Withdraw(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.sender = event.params.sender;
  entity.receiver = event.params.receiver;
  const owner = getOrCreateOwner(event.params.owner);
  entity.owner = owner.id;
  entity.assets = event.params.assets;
  entity.shares = event.params.shares;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();

  const oldBalance = owner.balance;

  // Update global state
  const globalState = getOrCreateGlobalState();
  globalState.totalWithdraws = globalState.totalWithdraws.plus(ONE_NUMBER);
  globalState.totalBalance = globalState.totalBalance.minus(
    event.params.shares
  );
  if (
    oldBalance.gt(ZERO_NUMBER) &&
    owner.balance.equals(ZERO_NUMBER) &&
    event.params.assets.gt(ZERO_NUMBER)
  ) {
    globalState.activeParticipants =
      globalState.activeParticipants.minus(ONE_NUMBER);
  }
  globalState.save();

  owner.balance = owner.balance.minus(event.params.assets);
  owner.save();
}
