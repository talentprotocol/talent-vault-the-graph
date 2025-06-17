import {
  Deposit as DepositEvent,
  Transfer as TransferEvent,
  Withdraw as WithdrawEvent,
} from "../generated/TalentVault/TalentVault";
import {
  Deposit,
  Transfer,
  Withdraw,
  Owner,
  GlobalState,
} from "../generated/schema";
import { BigInt, Bytes } from "@graphprotocol/graph-ts";

const GLOBAL_STATE_ID = "global-state";

function getOrCreateGlobalState(): GlobalState {
  let state = GlobalState.load(GLOBAL_STATE_ID);
  if (!state) {
    state = new GlobalState(GLOBAL_STATE_ID);
    state.totalDeposits = BigInt.fromI32(0);
    state.totalWithdraws = BigInt.fromI32(0);
    state.activeParticipants = BigInt.fromI32(0);
    state.totalBalance = BigInt.fromI32(0);
    state.save();
  }
  return state;
}

function getOrCreateOwner(address: Bytes): Owner {
  let owner = Owner.load(address);
  if (!owner) {
    owner = new Owner(address);
    owner.balance = BigInt.fromI32(0);
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

  let oldBalance = owner.balance;
  owner.balance = owner.balance.plus(event.params.shares);
  owner.save();

  // Update global state
  let globalState = getOrCreateGlobalState();
  globalState.totalDeposits = globalState.totalDeposits.plus(BigInt.fromI32(1));
  globalState.totalBalance = globalState.totalBalance.plus(event.params.shares);
  if (
    oldBalance.equals(BigInt.fromI32(0)) &&
    event.params.shares.gt(BigInt.fromI32(0))
  ) {
    globalState.activeParticipants = globalState.activeParticipants.plus(
      BigInt.fromI32(1)
    );
  }
  globalState.save();
}

export function handleTransfer(event: TransferEvent): void {
  let entity = new Transfer(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  let fromOwner = getOrCreateOwner(event.params.from);
  let toOwner = getOrCreateOwner(event.params.to);
  entity.from = fromOwner.id;
  entity.to = toOwner.id;
  entity.value = event.params.value;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();

  fromOwner.balance = fromOwner.balance.minus(event.params.value);
  fromOwner.save();

  toOwner.balance = toOwner.balance.plus(event.params.value);
  toOwner.save();
}

export function handleWithdraw(event: WithdrawEvent): void {
  let entity = new Withdraw(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.sender = event.params.sender;
  entity.receiver = event.params.receiver;
  let owner = getOrCreateOwner(event.params.owner);
  entity.owner = owner.id;
  entity.assets = event.params.assets;
  entity.shares = event.params.shares;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();

  let oldBalance = owner.balance;
  owner.balance = owner.balance.minus(event.params.shares);
  owner.save();

  // Update global state
  let globalState = getOrCreateGlobalState();
  globalState.totalWithdraws = globalState.totalWithdraws.plus(
    BigInt.fromI32(1)
  );
  globalState.totalBalance = globalState.totalBalance.minus(
    event.params.shares
  );
  if (
    oldBalance.gt(BigInt.fromI32(0)) &&
    owner.balance.equals(BigInt.fromI32(0)) &&
    event.params.shares.gt(BigInt.fromI32(0))
  ) {
    globalState.activeParticipants = globalState.activeParticipants.minus(
      BigInt.fromI32(1)
    );
  }
  globalState.save();
}
