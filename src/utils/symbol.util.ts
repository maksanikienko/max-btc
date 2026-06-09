const QUOTE_ASSETS = ['USDT', 'BUSD', 'BTC', 'ETH', 'BNB'] as const;

export function parseSymbol(symbol: string): { base: string; quote: string } {
  for (const q of QUOTE_ASSETS) {
    if (symbol.endsWith(q))
      return { base: symbol.slice(0, -q.length), quote: q };
  }
  return { base: symbol.slice(0, -3), quote: symbol.slice(-3) };
}
