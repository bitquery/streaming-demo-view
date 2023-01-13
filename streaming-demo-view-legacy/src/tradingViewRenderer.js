export default async function tradingViewrenderer(chart, ds, config, el, update) {
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
		try {
			chart.update(data[0])
		} catch (error) {
			console.log(error)
		}
	} else {
		chart.setData(data)
	}
	
}
