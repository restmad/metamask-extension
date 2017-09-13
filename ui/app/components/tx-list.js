const Component = require('react').Component
const connect = require('react-redux').connect
const h = require('react-hyperscript')
const inherits = require('util').inherits
const prefixForNetwork = require('../../lib/etherscan-prefix-for-network')
const selectors = require('../selectors')
const TxListItem = require('./tx-list-item')
const { formatBalance, formatDate } = require('../util')
const { showConfTxPage } = require('../actions')

module.exports = connect(mapStateToProps, mapDispatchToProps)(TxList)

function mapStateToProps (state) {
  return {
    txsToRender: selectors.transactionsSelector(state),
    conversionRate: selectors.conversionRateSelector(state),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    showConfTxPage: ({ id }) => dispatch(showConfTxPage({ id })),
  }
}

inherits(TxList, Component)
function TxList () {
  Component.call(this)
}

TxList.prototype.render = function () {
  return h('div.flex-column.tx-list-container', {}, [

    h('div.flex-row.tx-list-header-wrapper', [
      h('div.flex-row.tx-list-header', [
        h('div', 'transactions'),
      ]),
    ]),

    this.renderTranstions(),

  ])
}

TxList.prototype.renderTranstions = function () {
  const { txsToRender } = this.props

  return txsToRender.length
    ? txsToRender.map((transaction) => this.renderTransactionListItem(transaction))
    : [h('div.tx-list-item.tx-list-item--empty', [ 'No Transactions' ])]
}

// TODO: Consider moving TxListItem into a separate component
TxList.prototype.renderTransactionListItem = function (transaction) {
  const props = {
    dateString: formatDate(transaction.time),
    address: transaction.txParams.to,
    transactionStatus: transaction.status,
    transactionAmount: formatBalance(transaction.txParams.value, 6),
    transActionId: transaction.id,
    transactionHash: transaction.hash,
    transactionNetworkId: transaction.metamaskNetworkId,
  }

  const {
    address,
    transactionStatus,
    transactionAmount,
    dateString,
    transActionId,
    transactionHash,
    transactionNetworkId,
  } = props
  const { showConfTxPage } = this.props

  const opts = {
    key: transactionHash,
    transactionStatus,
    transActionId,
    dateString,
    address,
    transactionAmount,
    transactionHash,
    className: '.tx-list-item.tx-list-clickable',
  }

  if (transactionStatus === 'unapproved') {
    opts.onClick = () => showConfTxPage({id: transActionId})
    opts.className += '.tx-list-pending-item-container'
    opts.transactionStatus = 'Not Started'
  } else if (transactionHash) {
    opts.onClick = () => this.view(transactionHash, transactionNetworkId)
  }

  return h(TxListItem, opts)
}

TxList.prototype.view = function (txHash, network) {
  const url = etherscanLinkFor(txHash, network)
  if (url) {
    navigateTo(url)
  }
}

function navigateTo (url) {
  global.platform.openWindow({ url })
}

function etherscanLinkFor (txHash, network) {
  const prefix = prefixForNetwork(network)
  return `https://${prefix}etherscan.io/tx/${txHash}`
}
