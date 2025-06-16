import {
  Deposit as DepositEvent,
  Transfer as TransferEvent,
  Withdraw as WithdrawEvent,
} from "../generated/TalentVault/TalentVault";
import { Deposit, Transfer, Withdraw, Owner } from "../generated/schema";
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
