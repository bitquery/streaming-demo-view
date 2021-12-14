import { CURRENCIES } from './currencies'
export const getSubscriptionId = async () => {
	const currs = window.location.pathname.match(/0x[a-fA-F0-9]{40}/g)
	const baseAddress = currs[0]
	const quoteAddress = currs[1]
	let ds = new window.dataSourceWidget(`
	subscription (
			$network: EthereumNetwork!
			$from: ISO8601DateTime
			$baseAddress: String
			$quoteAddress: String
		) {
		ethereum(network: $network) {
		  dexTrades(
			options: {desc: ["block.height", "tradeIndex"]}
			baseCurrency: {is: $baseAddress}
			quoteCurrency: {is: $quoteAddress}
			time: {since: $from}
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
		"network": "ethereum",
		"baseAddress": baseAddress.startsWith('0x') ? baseAddress : CURRENCIES.WETH,
		"quoteAddress": quoteAddress.startsWith('0x') ? quoteAddress : CURRENCIES.USDC,
		"from": (new Date()).toISOString()
  }, `ethereum.dexTrades`, 'BQYuq0a8yHb2oa6bDx9R3GO2LNWAtR2q')
	const data = await ds.fetcher()
	const json = await data.json()
	return json.extensions.subId
}