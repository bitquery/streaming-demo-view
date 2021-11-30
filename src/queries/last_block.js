export const getLastBlockSubscriptionId = async () => {
	let ds = new window.dataSourceWidget(`
	subscription ($network: EthereumNetwork!, $from: ISO8601DateTime) {
		ethereum(network: $network) {
		  dexTrades(time: {since: $from}, options: {limit: 1}) {
			block {
				timestamp{
					time(format: "%FT%TZ")
					}
				height
			}
		  }
		}
	  }
 `, {
		"network": "ethereum",
		"from": (new Date()).toISOString()
	}, `ethereum.dexTrades`, 'BQYuq0a8yHb2oa6bDx9R3GO2LNWAtR2q')
	const data = await ds.fetcher()
	const json = await data.json()
	return json.extensions.subId
}