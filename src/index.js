import "core-js/stable";
import "regenerator-runtime/runtime";
import * as SockJS from 'sockjs-client'
import Stomp from "stompjs"
import "./style.scss"
import tradingViewrenderer from './tradingViewRenderer';
import tableWidgetRenderer from './tableWidgetRenderer.js'
import { getTradingViewData } from './queries/trading_view'
import { getSubscriptionId } from "./queries/subscription";
import { getUnixTime } from './utils/utils'
import { createChart } from 'lightweight-charts/dist/lightweight-charts.esm.development.js'
import { INTERVAL } from './queries/interval'
import { CURRENCIES } from "./queries/currencies";

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
const timeSinceLastBlockProcessed = () => {
	let timeBegan = null
    , timeStopped = null
    , stoppedDuration = 0
    , started = null;

	function start() {
		if (timeBegan === null) {
			timeBegan = new Date();
		}
		if (timeStopped !== null) {
			stoppedDuration += (new Date() - timeStopped);
		}
		started = setInterval(clockRunning, 10);	
	}
	function restart() {
		clearInterval(started);
		stoppedDuration = 0;
		timeBegan = null;
		timeStopped = null;
		document.getElementById("block-time-ago").innerHTML = "00.000";
		start()
	}
	function clockRunning(){
		var currentTime = new Date()
			, timeElapsed = new Date(currentTime - timeBegan - stoppedDuration)
			, min = timeElapsed.getUTCMinutes()
			, sec = timeElapsed.getUTCSeconds()
			, ms = timeElapsed.getUTCMilliseconds();
	
		document.getElementById("block-time-ago").innerHTML = 
			(min > 9 ? min : "0" + min) + ":" + 
			(sec > 9 ? sec : "0" + sec) + "." + 
			(ms > 99 ? ms : ms > 9 ? "0" + ms : "00" + ms);
	};
	return restart
}
async function domagic() {
	const restart = timeSinceLastBlockProcessed()
	if (window.location.pathname === '/') {
		window.location.pathname = `/${CURRENCIES.WETH}/${CURRENCIES.USDC}`
	}
	const baseAddress = document.createTextNode(window.location.pathname.split('/')[1].startsWith('0x') ? 
		window.location.pathname.split('/')[1] : CURRENCIES.WETH)
	const quoteAddress = document.createTextNode(window.location.pathname.split('/')[2].startsWith('0x') ? 
		window.location.pathname.split('/')[2] : CURRENCIES.USDC)
	document.getElementById('basecurrency').appendChild(baseAddress)
	document.getElementById('quotecurrency').appendChild(quoteAddress)
	const chart = createChart('realtimetradingview', {
		timeScale: {
			timeVisible: true,
			secondsVisible: false,
		}
	})
	let table = null
	const candleChart = chart.addCandlestickSeries()
	const [values, subID] = await Promise.all([ getTradingViewData(), getSubscriptionId() ])
	let lastTimeInterval = values[values.length-1].timeInterval.minute
	let nextTimeInterval = new Date ( (getUnixTime( values[values.length-1].timeInterval.minute )+ INTERVAL*60) * 1000 ).toISOString()
	const includeLastCandle = timestamp => getUnixTime(lastTimeInterval) >= getUnixTime(timestamp) < getUnixTime(nextTimeInterval)
	const includeNextCandle = timestamp => getUnixTime(timestamp) >= getUnixTime(nextTimeInterval)
	tradingViewrenderer(candleChart, { values }, {}, 'realtimetradingview', false)
	document.getElementById('realtimetable').style.height = '500px'
	let stompClient = null
	var socket = new SockJS('https://streaming.bitquery.io/stomp');
	stompClient = Stomp.over(socket);
	stompClient.connect({}, function (frame) {
		stompClient.subscribe(subID, function (update) {
			restart()
			let data = JSON.parse(update.body).data.ethereum.dexTrades
			document.getElementById('block-height').innerHTML = data[0].block.height
			document.getElementById('last-block-delay').innerHTML = getUnixTime(new Date()) - getUnixTime(data[0].block.timestamp.time)
			if (table) {
				tableWidgetRenderer(table, {values: data}, tableConfig, 'realtimetable', true)	
			} else {
				tableWidgetRenderer(undefined , {values: data}, tableConfig, 'realtimetable', false).then(response => table = response)
			}
			let lastCandle = values[values.length - 1]
			let nextCandle = {
				timeInterval: {
					minute: nextTimeInterval
				}
			}
			for (let i = data.length-1; i >= 0; i--) {
				if (includeLastCandle(data[i].block.timestamp.time)) {
					updateCandle(data[i], lastCandle)
					if (i === 0) {
						lastCandle.close = data[i].quotePrice
						tradingViewrenderer(candleChart, {values: [lastCandle]}, {}, 'realtimetradingview', true)
						values.splice(-1, 1, lastCandle)
					}
				}
				if (includeNextCandle(data[i].block.timestamp.time)) {
					if (i === 0) {
						nextCandle.close = data[i].quotePrice
						lastTimeInterval = new Date((getUnixTime(lastTimeInterval)+INTERVAL*60) *1000).toISOString()
						nextTimeInterval = new Date((getUnixTime(nextTimeInterval)+INTERVAL*60) *1000).toISOString()
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
			nextCandle = {}
		})
	})
}	

window.onload = domagic
