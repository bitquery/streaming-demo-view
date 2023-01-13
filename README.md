# Bitquery Realtime Streaming Demo


## Usage

The project demonstrates usage of GraphQL subscription to WebSocket streaming of data from the
[BitQuery](https://bitquery.io) data source. Subscription allows to subscribe to a GraphQL query and receive puch messages on client application ( browser or server side )
using Web Sockets.

To see the demo of this project, use the [https://streaming.bitquery.io/trades](https://streaming.bitquery.io/trades).

## Connecting to WebSocket

We use hybrid http / ws protocol to get web socket stream:

1. create graphql query in [Bitquery IDE](https://graphql.bitquery.io) or another Graphql client, for example [GraphiQL](https://www.electronjs.org/apps/graphiql)
2. replace the keyword "query" with the word "subscription" and execute the query
3. in response you will get the extensions data, which has a field "subId", which serves as a token to subscribe on  this query data updates
4. open the websocket STOMP connection to endpoint https://streaming.bitquery.io/stomp,  passing this subId, for example:
```
var socket = new SockJS('https://streaming.bitquery.io/stomp');
    stompClient = Stomp.over(socket);
    stompClient.connect({}, function (frame) {
        stompClient.subscribe( '<PLACE subId HERE!!>', function (update) {
            showUpdate(update.body);
        });
    });
```

## Subscriptions

Currently we are limited to the following subsciptions:

1. DEX trades in mainnet ethereum network for Uniswap v2 protocol
2. Blocks in Ethereum mainnet

All other available GraphQL data types will be available later.

## Build from Sources

clone this repo 
```
git clone https://github.com/bitquery/streaming-demo-view.git
```

Install packages

`npm install` or `yarn`
build project  

`npm run build` 
run it with

`npm run start`

Browser will open 

[http://localhost:8080/addr1/addr2](http://localhost:8080) with 

WETH (0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2) 

and 

USDC (0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48) 

as a default topken pair. 

## Deploy

Copy content of `dist/` folder to `(your nginx docroot)/bsctrades`

### nginx.conf
```
    #.
    #.
    server {
        #.
        #.
        location / {
            root $(replace docroot e.g. /nginx/var/www);
            index index.html;
        }
        location /trades {
            root $(reaplce docroot);
            try_files $uri &uri/ &uri/index.html /trades/index.html;
            add_header Last-Modified $date_gmt;
            add_header Cache-Control 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0';
            if_modified_since off;
            expires off;
            etag off;
        }
        location /bsctrades {
            root $(repalce docroot);
            try_files $uri &uri/ &uri/index.html /bsctrades/index.html;
            add_header Last-Modified $date_gmt;
            add_header Cache-Control 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0';
            if_modified_since off;
            expires off;
            etag off;
        }
        #.
        #.
    }
    #.
    #.
```

