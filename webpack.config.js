const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
	mode: 'development',
	entry: {
		index: './src/index.js'
	},
	output: {
		filename: '[name].js',
		path: path.resolve(__dirname, 'dist'),
		publicPath: path.resolve(__dirname, 'dist'),
		clean: true,
	},
	devtool: 'inline-source-map',
	devServer: {
		static: './dist',
		hot: true
	},
	module: {
		rules: [
			{
				test: /\.s[ac]ss$/i,
				use: [
					"style-loader",
					"css-loader",
					"sass-loader",
				],
			},
			{
				test: /\.css$/i,
				use: [
					"style-loader",
					"css-loader",
					"sass-loader",
				],
			},
			{
				test: /\.m?js$/,
				include: path.resolve(__dirname, 'src'),
				exclude: /(node_modules|bower_components)/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: ['@babel/preset-env']
					}
				}
			}
		],
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: './index.html'
		}),
	],
	resolve: {
		extensions: ['.ts', '.js'],
		modules: [path.resolve(__dirname, 'node_modules')]
	}
};
