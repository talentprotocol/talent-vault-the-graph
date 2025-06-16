import {
  Approval as ApprovalEvent,
  Deposit as DepositEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  Transfer as TransferEvent,
  Withdraw as WithdrawEvent,
  YieldAccrualDeadlineUpdated as YieldAccrualDeadlineUpdatedEvent,
  YieldRateUpdated as YieldRateUpdatedEvent,
} from "../generated/TalentVault/TalentVault";
import {
  Approval,
  Deposit,
  OwnershipTransferred,
  Transfer,
  Withdraw,
  YieldAccrualDeadlineUpdated,
  YieldRateUpdated,
  Owner,
} from "../generated/schema";
import { BigInt, Bytes } from "@graphprotocol/graph-ts";

function getOrCreateOwner(address: Bytes): Owner {
  let owner = Owner.load(address);
  if (!owner) {
    owner = new Owner(address);
    owner.balance = BigInt.fromI32(0);
    owner.save();
  }
  return owner;
}

export function handleApproval(event: ApprovalEvent): void {
  let entity = new Approval(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.owner = event.params.owner;
  entity.spender = event.params.spender;
  entity.value = event.params.value;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
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

  owner.balance = owner.balance.plus(event.params.shares);
  owner.save();
}

export function handleOwnershipTransferred(
  event: OwnershipTransferredEvent
): void {
  let entity = new OwnershipTransferred(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.previousOwner = event.params.previousOwner;
  entity.newOwner = event.params.newOwner;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
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

  owner.balance = owner.balance.minus(event.params.shares);
  owner.save();
}

export function handleYieldAccrualDeadlineUpdated(
  event: YieldAccrualDeadlineUpdatedEvent
): void {
  let entity = new YieldAccrualDeadlineUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.yieldAccrualDeadline = event.params.yieldAccrualDeadline;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleYieldRateUpdated(event: YieldRateUpdatedEvent): void {
  let entity = new YieldRateUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.yieldRate = event.params.yieldRate;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}
