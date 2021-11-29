import { CURRENCIES } from './currencies'
export const getSubscriptionId = async () => {
	const baseAddress = window.location.pathname.split('/')[1]
	const quoteAddress = window.location.pathname.split('/')[2]
	let ds = new window.dataSourceWidget(`
	subscription (
			$network: EthereumNetwork!
			$limit: Int!, $offset: Int!
			$from: ISO8601DateTime
			$till: ISO8601DateTime
			$baseAddress: String
			$quoteAddress: String
		) {
		ethereum(network: $network) {
		  dexTrades(
			options: {desc: ["block.height", "tradeIndex"], limit: $limit, offset: $offset}
			baseCurrency: {is: $baseAddress}
			quoteCurrency: {is: $quoteAddress}
			date: {since: $from, till: $till}
		  ) {
			block {
			  timestamp {
				time(format: "%FT%TZ")
			  }
			  height
			}
			tradeIndex
			protocol
			exchange {
			  fullName
			}
			smartContract {
			  address {
				address
				annotation
			  }
			}
			baseAmount
			baseCurrency {
			  address
			  symbol
			}
			quoteAmount
			quoteCurrency {
			  address
			  symbol
			}
			transaction {
			  hash
			}
			quotePrice
		  }
		}
	  }
	  
 `, {
		"limit": 10,
		"offset": 0,
		"network": "ethereum",
		"baseAddress": baseAddress.startsWith('0x') ? baseAddress : CURRENCIES.WETH,
		"quoteAddress": quoteAddress.startsWith('0x') ? quoteAddress : CURRENCIES.USDC,
		"from": "2021-11-16",
		"till": null,
		"dateFormat": "%Y-%m-%d"
  }, `ethereum.dexTrades`, 'BQYuq0a8yHb2oa6bDx9R3GO2LNWAtR2q')
	const data = await ds.fetcher()
	const json = await data.json()
	return json.extensions.subId
}