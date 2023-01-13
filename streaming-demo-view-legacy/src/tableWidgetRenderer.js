import Tabulator from "tabulator-tables"; 
import "../index.css"
import { formatter } from "./utils/formatter.js";

export default async function tableWidgetRenderer(table, ds, config, el, update) {
	let values = undefined
	let cfg = {}
	if (!ds.values) {
		const data = await ds.fetcher()
		const json = await data.json()
		values = ds.setupData(json)
	} else {
		values = ds.values
	}
	let newCol = [...config.columns]
	newCol.forEach(col => col.formatter = col.formatterParams && formatter)
	cfg = {
		height: '100%',
		layout: 'fitData',
		...config,
		data: values,
	}
	if (update) {
		table.addData(values, true)
	} else {
		try {
			if (el) {
				const table = new Tabulator(`#${el}`, cfg)
				return table
			}
		} catch (error) {
			console.log(error)
		}
	}
}