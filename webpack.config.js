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
		publicPath: 'auto',
		clean: true,
	},
	devtool: 'inline-source-map',
	devServer: {
		historyApiFallback: {
			index: '/address/second'
		},
		static: {
			directory: './dist',
			publicPath: '/address/second',
		},
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
			},
			{
				test: /\.(png|svg|jpg|jpeg|gif)$/i,
				type: 'asset/resource'
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
