export type PayerPort = {
  pay(bolt11: string): Promise<void>;
};
