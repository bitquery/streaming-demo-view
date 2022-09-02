import './style.scss'
import './index.scss'

import { createClient } from 'graphql-ws'

setInterval(() => document.getElementById("datetime").innerHTML = new Date().toISOString(), 1)

const client = createClient({
	url: 'ws://strm-etl-2.ph165.system.local:8081'
});

async function execute(payload) {
	return new Promise((resolve, reject) => {
		let result;
		client.subscribe(payload, {
			next: (data) => {
				const trades = document.getElementById('trades')
				const trade = document.createElement('div')
				trade.classList.add('trade')
				trade.innerHTML = data.data.evm.dexTrades[0].txHash
				trades.appendChild(trade)
				const timeout = setTimeout(() => trades.removeChild(trade), 10000)
				result = data
			},
			error: reject,
			complete: () => resolve(result),
		});
	});
}

// use
(async () => {
	try {
		const result = await execute({
			query: 'subscription { evm(network: bsc) { dexTrades{ txHash } } }'
		});
		// complete
		// next = result = { data: { hello: 'Hello World!' } }
	} catch (err) {
		console.log(err)
		// error
	}
})();
