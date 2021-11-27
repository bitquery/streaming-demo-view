import "core-js/stable";
import "regenerator-runtime/runtime";
import * as SockJS from 'sockjs-client'
import Stomp from "stompjs"
import "./style.scss"
import tradingViewrenderer from './tradingViewRenderer';
import tableWidgetRenderer from 'table-widget/src/components/tableWidgetRenderer.js'
import { getTradingViewData } from './queries/trading_view'
import { getUnixTime } from './utils/utils'
import { createChart } from 'lightweight-charts/dist/lightweight-charts.esm.development.js'
import { INTERVAL } from './queries/interval'

const SUBSCRIPTIONS = {
	lastTrades: 'sub-91b1b654e79868f39c8ed58f8525d69a65caf7f5'
}
const tableConfig = {
    "height": "100%",
    "layout": "fitData",
    "columns": [
        {
            "field": "block.timestamp.time",
            "title": "Timestamp"
        },
        {
            "field": "block.height",
            "title": "Block"
        },
        {
            "field": "baseAmount",
            "title": "Base amount"
        },
        {
            "field": "baseCurrency.symbol",
            "title": "Base currency"
        },
        {
            "field": "quoteAmount",
            "title": "Quote amount"
        },
        {
            "field": "quoteCurrency.symbol",
            "title": "Quote currency"
        },
        {
            "field": "protocol",
            "title": "Protocol"
        },
        {
            "field": "exchange.fullName",
            "title": "Exchange"
        },
        {
            "field": "smartContract.address.address",
            "title": "Smart contract"
        },
        {
            "field": "transaction.hash",
            "title": "Hash"
        }
    ],
}

const updateCandle = (trade, candle) => {
	if (trade.quotePrice > candle.high) candle.high = trade.quotePrice
	if (trade.quotePrice < candle.low) candle.low = trade.quotePrice
}

async function domagic() {
	const chart = createChart('realtimetradingview', {
		timeScale: {
			timeVisible: true,
			secondsVisible: false,
		}
	})
	let table = null
	const candleChart = chart.addCandlestickSeries()
	const values = await getTradingViewData()
	let lastTimeInterval = values[values.length-1].timeInterval.minute
	let nextTimeInterval = new Date ( (getUnixTime( values[values.length-1].timeInterval.minute )+ INTERVAL*60) * 1000 ).toISOString()
	const includeLastCandle = timestamp => getUnixTime(lastTimeInterval) >= getUnixTime(timestamp) < getUnixTime(nextTimeInterval)
	const includeNextCandle = timestamp => getUnixTime(timestamp) >= getUnixTime(nextTimeInterval)
	console.log(values)
	tradingViewrenderer(candleChart, { values }, {}, 'realtimetradingview', false)
	document.getElementById('realtimetable').style.height = '500px'
	let stompClient = null
	var socket = new SockJS('http://strm-etl-1.ph158.system.local:8080/stomp');
	stompClient = Stomp.over(socket);
	stompClient.connect({}, function (frame) {
		console.log('Connected: ' + frame);
		stompClient.subscribe(SUBSCRIPTIONS.lastTrades, function (update) {
			console.log('table is ', table)
			let data = JSON.parse(update.body).data.ethereum.dexTrades
			if (table) {
				console.log(table)
				tableWidgetRenderer(table, {values: data}, tableConfig, 'realtimetable', true)	
			} else {
				tableWidgetRenderer(undefined , {values: data}, tableConfig, 'realtimetable', false).then(response => table = response)
			}
			console.log(data[0].block.timestamp.time, data[0].quotePrice)
			let lastCandle = values[values.length - 1]
			let nextCandle = {
				timeInterval: {
					minute: nextTimeInterval
				}
			}
			console.log(includeNextCandle(data[0].block.timestamp.time))
			for (let i = data.length-1; i >= 0; i--) {
				if (includeLastCandle(data[i].block.timestamp.time)) {
					updateCandle(data[i], lastCandle)
					if (i === 0) {
						lastCandle.close = data[i].quotePrice
						tradingViewrenderer(candleChart, {values: [lastCandle]}, {}, 'realtimetradingview', true)
						values.splice(-1, 1, lastCandle)
					}
				}
				console.log(data[i].block.timestamp.time, includeNextCandle(data[i].block.timestamp.time))
				if (includeNextCandle(data[i].block.timestamp.time)) {
					console.log('next candle in trades')
					if (i === 0) {
						console.log('in last trade change timeintervals')
						nextCandle.close = data[i].quotePrice
						lastTimeInterval = new Date((getUnixTime(lastTimeInterval)+INTERVAL*60) *1000).toISOString()
						nextTimeInterval = new Date((getUnixTime(nextTimeInterval)+INTERVAL*60) *1000).toISOString()
						console.log(lastTimeInterval, nextTimeInterval)
						tradingViewrenderer(candleChart, {values: [nextCandle]}, {}, 'realtimetradingview', true)
						values.push(nextCandle)
					}
					if (includeLastCandle(data[i+1] && data[i+1].block.timestamp.time)) {
						nextCandle.open = data[i].quotePrice
						nextCandle.high = data[i].quotePrice
						nextCandle.low = data[i].quotePrice
					}
					if ('open' in nextCandle) {
						updateCandle(data[i], nextCandle)
					}
				}
			}
			console.log(lastCandle, nextCandle, lastTimeInterval, nextTimeInterval)
			nextCandle = {}
		})
	})
}	

window.onload = domagic
