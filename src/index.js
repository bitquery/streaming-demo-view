import "core-js/stable";
import "regenerator-runtime/runtime";
import * as SockJS from 'sockjs-client'
import Stomp from "stompjs"
import "./style.scss"
import tradingViewrenderer from './tradingViewRenderer';
import { getTradingViewData } from './queries/trading_view'
import { getUnixTime } from './utils/utils'
import { createChart } from 'lightweight-charts/dist/lightweight-charts.esm.development.js'

const SUBSCRIPTIONS = {
	lastTrades: 'sub-0ee13285846a1fdd912e3537b1c0adbd1628f823'
}
const updateCandle = (trade, candle) => {
	if (trade.quotePrice > candle.high) candle.high = trade.quotePrice
	if (trade.quotePrice < candle.low) candle.low = trade.quotePrice
	// candle.close = trade.quotePrice
}

async function domagic() {
	const chart = createChart('realtimetradingview', {
		timeScale: {
			timeVisible: true,
			secondsVisible: false,
		}
	})
	const candleChart = chart.addCandlestickSeries()
	const values = await getTradingViewData()
	let lastTimeInterval = values[values.length-1].timeInterval.minute
	let nextTimeInterval = new Date ( (getUnixTime( values[values.length-1].timeInterval.minute )+ 30*60) * 1000 ).toISOString()
	console.log(values)
	tradingViewrenderer(candleChart, { values }, {}, 'realtimetradingview', false)
	let stompClient = null
	var socket = new SockJS('http://strm-etl-1.ph158.system.local:8080/stomp');
	stompClient = Stomp.over(socket);
	stompClient.connect({}, function (frame) {
		console.log('Connected: ' + frame);
		stompClient.subscribe(SUBSCRIPTIONS.lastTrades, function (update) {
			let data = JSON.parse(update.body).data.ethereum.dexTrades
			console.log(data[0].block.timestamp.time)
			let lastCandle = values[values.length - 1]
			let nextCandle = {}
			lastCandle.close = data[0].quotePrice
			data.filter(trade => getUnixTime(lastTimeInterval) > getUnixTime(trade.block.timestamp.time) < getUnixTime(nextTimeInterval))
				.forEach(trade => {
					updateCandle(trade, lastCandle)
				})
			values.splice(-1, 1, lastCandle)
			tradingViewrenderer(candleChart, {values: [lastCandle]}, {}, 'realtimetradingview', true)
			if (data.some(trade => getUnixTime(trade.block.timestamp.time) >= getUnixTime(nextTimeInterval))) {
				lastTimeInterval = new Date((getUnixTime(lastTimeInterval)+30*60) *1000).toISOString()
				nextTimeInterval = new Date((getUnixTime(nextTimeInterval)+30*60) *1000).toISOString()
				data.filter(trade => getUnixTime(trade.block.timestamp.time) >= getUnixTime(lastTimeInterval))
					.forEach(trade => {
						if (Object.keys(nextCandle).length) {
							updateCandle(trade, nextCandle)
						} else {
							nextCandle = {
								timeInterval: {
									minute: getUnixTime(lastTimeInterval)
								},
								open: trade.quotePrice,
								close: trade.quotePrice,
								low: trade.quotePrice,
								high: trade.quotePrice
							}
						}
					})
				// values.splice(-1, 1, nextCandle)
				values.push(nextCandle)
				tradingViewrenderer(candleChart, {values: [nextCandle]}, {}, 'realtimetradingview', true)
			}
		})
	});
}

window.onload = domagic
