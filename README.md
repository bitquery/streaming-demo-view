# Bitquery Realtime Streaming Demo


## Usage

The project demonstrates usage of GraphQL subscription to WebSocket streaming of data from the
[BitQuery](https://bitquery.io) data source. Subscription allows to subscribe to a GraphQL query and receive puch messages on client application ( browser or server side )
using Web Sockets.

To see the demo of this project, use the [https://streaming.bitquery.io/demo](https://streaming.bitquery.io/demo).

## Connecting to WebSocket

We use graphql-ws protocol to get web socket stream:

1. create graphql query in [Bitquery IDE](https://graphql.bitquery.io) or another Graphql client, for example [GraphiQL](https://www.electronjs.org/apps/graphiql)
2. replace the keyword "query" with the word "subscription"
3. create graphql-ws client
```
import { createClient } from 'graphql-ws'
const client = createClient({
	url: 'wss://streaming.bitquery.io/graphql'
});
```
4. subscribe
```
const payload = {
	query: `subscription {
				EVM(network: bsc){
					Transfers(Transfer: {Currency: {HasURI: true}}) {
						Transfer {
							Receiver
							Currency {
								Name
							}
							URI
						}
					}
				}
			}`
};
(async () => {
	const onNext = data => { 
        /* handle incoming values */
    }

	let unsubscribe = () => {
		/* complete the subscription */
	};

	await new Promise((resolve, reject) => {
		unsubscribe = client.subscribe(payload, {
			next: onNext,
			error: reject,
			complete: resolve,
		});
	});
})();
```

## Subscriptions

Currently we are limited to the DEX trades and transfers in:
1. Mainnet ethereum network for Uniswap v2 protocol
2. BSC network

All other available GraphQL data types will be available later.

## Build from Sources

clone this repo 
```
git clone https://github.com/bitquery/streaming-demo-view.git
```

Install packages

`npm install` or `yarn`

Run the project
`npm run dev` 

Browser will open demo here [http://127.0.0.1:5173/](http://127.0.0.1:5173/).

Build with
`npm run build`
