// import { createChart } from 'lightweight-charts'
// import { createChart } from 'lightweight-charts/dist/lightweight-charts.esm.development.js'
// import elementResizeEvent from 'element-resize-event'

export default async function tradingViewrenderer(chart, ds, config, el, update) {
	console.log(ds)
	// const thisTV = document.getElementById(el).firstChild
	// thisTV && document.getElementById(el).removeChild(thisTV)
	let values = undefined
	if (!ds.values) {
		const data = await ds.fetcher()
		const json = await data.json()
		values = ds.setupData(json)
	} else {
		values = ds.values
	}
	const data = []
	for (let i = 0; i < values.length; i++) {
		let trade = {
			time: Math.round(new Date(values[i]?.timeInterval?.minute).getTime() / 1000),
			open: +values[i].open,
			high: values[i].high,
			low: values[i].low,
			close: +values[i].close
		}
		data.push(trade)
	}
	if (update) {
		console.log(data[0])
		chart.update(data[0])
	} else {
		chart.setData(data)
	}
	// chart.setData(data)
	/* function reportWindowSize() {
		chart.applyOptions({
			width: document.getElementById(el).clientWidth,
			height: document.getElementById(el).clientHeight
		});
	}
	let element = document.getElementById(el).parentNode
	elementResizeEvent(element, function() {
		reportWindowSize() 
	})*/
}
