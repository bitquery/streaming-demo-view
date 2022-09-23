import './style.scss'
import './index.scss'

import { createClient } from 'graphql-ws'

setInterval(() => document.getElementById("datetime").innerHTML = new Date().toLocaleString('en-SG', {
	timeZone: 'Asia/Singapore',
	hour12: false
}), 1)

const client = createClient({
	url: 'wss://streaming.bitquery.io/graphql'
});

const maxSize = 10

const addNft = async (url, name) => {
	const nft = document.createElement('div')
	nft.classList.add('nft')
	const response = await fetch(url)
	const imageBlob = await response.blob()
	const imageObjectURL = URL.createObjectURL(imageBlob)
	nft.style.backgroundImage = `url(${imageObjectURL})`
	const coeff = Math.floor ( Math.random()*(100-25+1) + 25 ) / 100
	const size = maxSize * coeff
	nft.style.height = `${size}vmax`
	nft.style.width = `${size}vmax`
	const animationTime = 3/coeff <= 3 ? 3 : 3/coeff
	nft.style.animation = `falling ${animationTime}s`
	const appearancePoint = Math.random() * window.innerWidth
	nft.style.left = `${appearancePoint}px`
	const app = document.getElementById('app')
	const nftName = document.createElement('span')
	nftName.style.fontSize = `${size/5}vmax`
	nftName.innerHTML = name ? name : ''
	nft.appendChild(nftName)
	app.appendChild(nft)
	setTimeout(() => {
		app.removeChild(nft)
	}, animationTime*1000)
}

async function nft(payload) {
	return new Promise((resolve, reject) => {
		let result;
		client.subscribe(payload, {
			next: async (data) => {
				const transfers = data.data.EVM.Transfers
				transfers.forEach(async ({Transfer: { URI, name }}) => {
					if (URI && URI.match(/data:image/gm)) {
						addNft(URI, name)
					} else if (!URI.match(/^ipfs:\/\//gm)) {
						try {
							const data = await fetch(URI)
							const json = await data.json()
							if (json.image) {
								addNft(json.image, json.name)
							}
						} catch (error) {							
						}
					}
				})
			},
			error: reject,
			complete: () => resolve(result)
		})
	})	
}

async function execute(payload) {
	return new Promise((resolve, reject) => {
		let result;
		client.subscribe(payload, {
			next: (data) => {
				const result = data.data.EVM
				const tradesNode = document.getElementById('trades')
				result.buy.forEach((trade, i, arr) => {
					const tradesRow = document.createElement('div')
					const time = document.createElement('div')
					const address = document.createElement('div')
					const action = document.createElement('div')
					const forprice = document.createElement('div')
					tradesRow.classList.add('trades__row')
					time.classList.add('trades__column', 'time')
					address.classList.add('trades__column', 'address')
					action.classList.add('trades__column', 'action')
					forprice.classList.add('trades__column', 'forprice')
					time.innerHTML = `${new Date(trade.Block.Time).toLocaleString('en-SG', { timeZone: 'Asia/Singapore', hour12: false }).split(', ')[1]}`
					address.innerHTML = ` ${trade.Trade.Sell.Buyer.substring(0, 10)}...`
					action.innerHTML = ` buy ${trade.Trade.Buy.Amount.Decimal.substring(0, 10)} ${trade.Trade.Buy.Currency.Symbol}`
					forprice.innerHTML = ` for ${trade.Trade.Sell.Amount.Decimal.substring(0, 6)} ${trade.Trade.Sell.Currency.Symbol}`
					setTimeout(() => {
						tradesRow.appendChild(time)
						tradesRow.appendChild(address)
						tradesRow.appendChild(action)
						tradesRow.appendChild(forprice)
						tradesNode.appendChild(tradesRow)
						const priceNode = document.getElementById('price')
						const price = trade.Trade.Buy.Price
						const color = +price > +priceNode.innerHTML ? 'green' : 'red'
						priceNode.innerHTML = price.toFixed(5)
						priceNode.classList.remove('green', 'red')
						priceNode.classList.add(color)
						if (tradesNode.children.length > 20) {
							tradesNode.removeChild(tradesNode.children.item(0))
						}
					}, i * 2500 / result.buy.length)
				})
				result.sell.forEach((trade, i, arr) => {
					const tradesRow = document.createElement('div')
					const time = document.createElement('div')
					const address = document.createElement('div')
					const action = document.createElement('div')
					const forprice = document.createElement('div')
					tradesRow.classList.add('trades__row')
					time.classList.add('trades__column', 'time')
					address.classList.add('trades__column', 'address')
					action.classList.add('trades__column', 'action')
					forprice.classList.add('trades__column', 'forprice')
					time.innerHTML = `${new Date(trade.Block.Time).toLocaleString('en-SG', { timeZone: 'Asia/Singapore', hour12: false }).split(', ')[1]}`
					address.innerHTML = ` ${trade.Trade.Sell.Buyer.substring(0, 10)}...`
					action.innerHTML = ` sell ${trade.Trade.Sell.Amount.Decimal.substring(0, 10)} ${trade.Trade.Sell.Currency.Symbol}`
					forprice.innerHTML = ` for ${trade.Trade.Buy.Amount.Decimal.substring(0, 6)} ${trade.Trade.Buy.Currency.Symbol}`
					setTimeout(() => {
						tradesRow.appendChild(time)
						tradesRow.appendChild(address)
						tradesRow.appendChild(action)
						tradesRow.appendChild(forprice)
						tradesNode.appendChild(tradesRow)
						const priceNode = document.getElementById('price')
						const price = trade.Trade.Sell.Price
						const color = +price > +priceNode.innerHTML ? 'green' : 'red'
						priceNode.innerHTML = price.toFixed(5)
						priceNode.classList.remove('green', 'red')
						priceNode.classList.add(color)
						if (tradesNode.children.length > 20) {
							tradesNode.removeChild(tradesNode.children.item(0))
						}
					}, i * 2500 / result.sell.length)
				})
			},
			error: reject,
			complete: () => resolve(result),
		});
	});
}

(async () => {
	try {
		const result = await Promise.all[ execute({
			query: `subscription {
				EVM(network: bsc){
				  buy: DEXTrades(Trade: {
					Sell: {Currency: {SmartContract: {is: "0x55d398326f99059ff775485246999027b3197955"}}}
					Buy: {Currency: {SmartContract: {is: "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c"}}}
				  }) {
					Block {
					  Time
					}
					Trade {
					  Sell {
						Buyer
						Amount {
									  Decimal
						}
						Currency {
						  Symbol
								  }
					  }
					  Buy {
						Price
						Amount {
									  Decimal
						}
						Currency {
						  Symbol
						}
					  }
					}
				  }
				  sell: DEXTrades(Trade: {
					Buy: {Currency: {SmartContract: {is: "0x55d398326f99059ff775485246999027b3197955"}}}
					Sell: {Currency: {SmartContract: {is: "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c"}}}
			  
				  }) {
					Block {
					  Time
					}
					Trade {
					  Sell {
						Price
						Buyer
						Amount {
									  Decimal
						}
						Currency {
						  Symbol
								  }
					  }
					  Buy {
						
						Amount {
									  Decimal
						}
						Currency {
						  Symbol
						}
					  }
					}
				  }
				}
			  }`
		}), nft({query: `subscription {
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
			}`})];
	} catch (err) {
		console.log(err)
	}
})();
