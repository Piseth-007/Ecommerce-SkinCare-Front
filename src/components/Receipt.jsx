export default function Receipt({ order }) {
  if (!order) return null;

  return (
    <div className="hidden print:block print:p-8 font-mono text-black">
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold">Your Store Name</h1>
        <p className="text-xs">Order Receipt</p>
      </div>

      <div className="text-xs mb-4 border-b border-black pb-2">
        <p>Order #: {order.id}</p>
        <p>Date: {new Date(order.created_at).toLocaleString()}</p>
        <p>Customer: {order.user?.name}</p>
        <p>Status: {order.status}</p>
      </div>

      <table className="w-full text-xs mb-4">
        <thead>
          <tr className="border-b border-black">
            <th className="text-left py-1">Item</th>
            <th className="text-right py-1">Qty</th>
            <th className="text-right py-1">Price</th>
            <th className="text-right py-1">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {order.items?.map((item) => (
            <tr key={item.id}>
              <td className="py-1">{item.product?.name}</td>
              <td className="text-right py-1">{item.quantity}</td>
              <td className="text-right py-1">
                ${Number(item.price).toFixed(2)}
              </td>
              <td className="text-right py-1">
                ${(Number(item.price) * item.quantity).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t border-black pt-2 text-right text-xs">
        <p className="font-bold">Total: ${Number(order.total).toFixed(2)}</p>
      </div>

      <p className="text-center text-[10px] mt-6">
        Thank you for your purchase!
      </p>
    </div>
  );
}
