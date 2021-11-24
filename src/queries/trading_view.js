import { INTERVAL } from './interval'
export const getTradingViewData = async () => {
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
		"baseAddress": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
		"quoteAddress": "0x8b3192f5eebd8579568a2ed41e6feb402f93f73f",
		"protocol": "Uniswap v2",
		"exchangeName": "Uniswap"
	}, `ethereum.dexTrades`, 'BQY6TU7z5qlHcPYngQKPOZ0eOmhNnnBn')
	const data = await ds.fetcher()
	const json = await data.json()
	return ds.setupData(json)
}