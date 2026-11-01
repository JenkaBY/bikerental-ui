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
