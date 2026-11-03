import OrdersManager from "@/components/OrdersManager";

export default function OrdersPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">订单管理</h1>
        <p className="text-muted-foreground">
          微信支付产生的订单都在这里；支付成功会自动写入会员管理。
        </p>
      </div>

      <OrdersManager />
    </div>
  );
}
