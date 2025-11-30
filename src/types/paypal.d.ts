interface Window {
  paypal?: {
    Buttons: (config: {
      createOrder: () => Promise<string>;
      onApprove: (data: { orderID: string }) => Promise<void>;
      onError: (err: any) => void;
    }) => {
      render: (selector: string) => void;
    };
  };
}
