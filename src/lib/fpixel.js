export const purchaseEvent = (name, options = {}) => {
	window.fbq('track', name, options)
}