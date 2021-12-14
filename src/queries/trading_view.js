import { INTERVAL } from './interval'
export const getTradingViewData = async () => {
	const currs = window.location.pathname.match(/0x[a-fA-F0-9]{40}/g)
	const baseAddress = currs ? currs[0] : CURRENCIES.USDC
	const quoteAddress = currs ? currs[1] : CURRENCIES.WETH
	let ds = new window.dataSourceWidget(`
   query(
	 $baseAddress: String
	 $quoteAddress: String
	 $from: ISO8601DateTime!
	 $interval: Int
   ) {
	 ethereum(network: bsc) {
	   dexTrades(
		 baseCurrency: { is: $baseAddress }
		 quoteCurrency: { is: $quoteAddress }
		 time: { since:  $from }
		 priceAsymmetry: { lt: 0.7 }
		 any: [
		   {tradeAmountUsd: { gt: 0.00001 }},
		   {tradeAmountUsd: { is: 0 }}
		 ]
	   ) {
		 timeInterval {
		   minute(format:"%FT%TZ", count: $interval)
		 }
		 buyCurrency: baseCurrency {
		   symbol
		   address
		 }
		 buyAmount: baseAmount
		 sellCurrency: quoteCurrency {
		   symbol
		   address
		 }
		 volume: quoteAmount
		 trades: count
		 high: quotePrice(calculate: maximum)
		 low: quotePrice(calculate: minimum)
		 open: minimum(of: block, get: quote_price)
		 close: maximum(of: block, get: quote_price)
	   }
	 }
   }
 `, {
		"from": "2021-10-18T00:00:00",
		"interval": INTERVAL,
		"baseAddress": baseAddress,
		"quoteAddress": quoteAddress,
	}, `ethereum.dexTrades`, 'BQYuq0a8yHb2oa6bDx9R3GO2LNWAtR2q')
	const data = await ds.fetcher()
	const json = await data.json()
	return ds.setupData(json)
}