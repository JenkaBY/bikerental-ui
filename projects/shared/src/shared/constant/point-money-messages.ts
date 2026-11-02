export function pointDepositedToBankTitle(month: string): string {
  return $localize`Deposited to bank in ${month}:month:`;
}

export function pointDepositedSplit(collected: string, terminalSettled: string): string {
  return $localize`Collections ${collected}:collected: · Terminal settlements ${terminalSettled}:terminalSettled:`;
}

export function pointsClosedHidden(count: number): string {
  return $localize`Closed hidden: ${count}:count:`;
}

export function pointResultTransferCount(count: number): string {
  return $localize`Transfers: ${count}:count:`;
}

export function pointShiftCaption(sequence: number, time: string): string {
  return $localize`Shift ${sequence}:sequence: · opened ${time}:time:`;
}

export function pointMoveRemaining(amount: string): string {
  return $localize`Remaining: ${amount}:amount:`;
}

export function pointCollectedMessage(amount: string): string {
  return $localize`Collected: ${amount}:amount:`;
}

export function pointSettlementRecordedMessage(amount: string): string {
  return $localize`Settlement recorded: ${amount}:amount:`;
}

export function operatorHandInAmount(amount: string): string {
  return $localize`Hand in ${amount}:amount:`;
}

export function shiftSurplusMessage(amount: string): string {
  return $localize`Surplus +${amount}:amount:`;
}

export function shiftShortageMessage(amount: string): string {
  return $localize`Shortage −${amount}:amount:`;
}

export function shiftClosedTitle(sequence: number): string {
  return $localize`Shift ${sequence}:sequence: closed`;
}
