import { INTERVAL } from './interval'
import { CURRENCIES } from './currencies'
export const getTradingViewData = async () => {
	const baseAddress = window.location.pathname.split('/')[1]
	const quoteAddress = window.location.pathname.split('/')[2]
	let ds = new window.dataSourceWidget(`
   query(
	 $baseAddress: String
	 $quoteAddress: String
	 $from: ISO8601DateTime!
	 $interval: Int
	 $protocol: String
	 $exchangeName: String
   ) {
	 ethereum(network: ethereum) {
	   dexTrades(
		 protocol: { is: $protocol }
		 baseCurrency: { is: $baseAddress }
		 quoteCurrency: { is: $quoteAddress }
		 time: { since:  $from }
		 exchangeName: { is: $exchangeName }
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
		"baseAddress": baseAddress.startsWith('0x') ? baseAddress : CURRENCIES.WETH,
		"quoteAddress": quoteAddress.startsWith('0x') ? quoteAddress : CURRENCIES.USDC,
		"protocol": "Uniswap v2",
		"exchangeName": "Uniswap"
	}, `ethereum.dexTrades`, 'BQYuq0a8yHb2oa6bDx9R3GO2LNWAtR2q')
	const data = await ds.fetcher()
	const json = await data.json()
	return ds.setupData(json)
}