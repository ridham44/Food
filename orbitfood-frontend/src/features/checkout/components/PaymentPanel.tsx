import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button/Button';
import { useCustomerAuthStore } from '@/stores/customerAuthStore';
import { loadRazorpayCheckoutScript } from '@/lib/loadRazorpayCheckoutScript';
import { useCreateRazorpayOrder, usePaymentConfig, useVerifyPayment, getCheckoutErrorMessage } from '@/features/checkout/useCheckout';
import { BillBreakdownCard } from '@/features/checkout/components/BillBreakdownCard';
import { PaymentProcessingAnimation } from '@/features/checkout/components/PaymentProcessingAnimation';
import { PaymentSuccessScreen } from '@/features/checkout/components/PaymentSuccessScreen';
import { PaymentFailedScreen } from '@/features/checkout/components/PaymentFailedScreen';
import type { RazorpayHandlerResponse } from '@/types/razorpay';
import type { BillBreakdown, CreateRazorpayOrderInput } from '@/features/checkout/types';

type Phase = 'summary' | 'creating_order' | 'awaiting_razorpay' | 'processing' | 'success' | 'failed';
type FailedStep = 'create' | 'widget' | 'verify';

const MIN_PROCESSING_MS = 3000;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function PaymentPanel({
  orderInput,
  estimatedBreakdown,
  restaurantName,
  onEdit,
  onTrackOrder,
  onViewOrders,
  onSuccess,
}: {
  orderInput: CreateRazorpayOrderInput;
  estimatedBreakdown: BillBreakdown;
  restaurantName?: string | null;
  onEdit: () => void;
  onTrackOrder: (orderListId: string) => void;
  onViewOrders: () => void;
  onSuccess?: (orderListId: string) => void;
}) {
  const customer = useCustomerAuthStore((state) => state.customer);
  const [phase, setPhase] = useState<Phase>('summary');
  const [breakdown, setBreakdown] = useState<BillBreakdown>(estimatedBreakdown);
  const [errorMessage, setErrorMessage] = useState('');
  const [failedStep, setFailedStep] = useState<FailedStep>('create');
  const [orderListId, setOrderListId] = useState<string | null>(null);

  const orderRef = useRef<{ pendingPaymentId: string; razorpayOrderId: string; amountInPaise: number; keyId: string } | null>(null);
  const paymentIdsRef = useRef<RazorpayHandlerResponse | null>(null);

  const { data: paymentConfig } = usePaymentConfig();
  const createOrder = useCreateRazorpayOrder();
  const verify = useVerifyPayment();

  // Warm up the widget script as soon as this panel mounts — pure prefetch,
  // doesn't gate anything until the customer actually clicks "Pay".
  useEffect(() => {
    loadRazorpayCheckoutScript();
  }, []);

  const openRazorpayWidget = () => {
    const order = orderRef.current;
    if (!order) return;

    if (!window.Razorpay) {
      setFailedStep('widget');
      setErrorMessage("Couldn't load the payment widget. Check your connection and try again.");
      setPhase('failed');
      return;
    }

    const razorpay = new window.Razorpay({
      key: order.keyId,
      amount: order.amountInPaise,
      currency: 'INR',
      name: 'OrbitFood',
      description: restaurantName ?? undefined,
      order_id: order.razorpayOrderId,
      prefill: {
        name: customer?.fullName,
        contact: customer?.phoneNo,
        ...(customer?.email ? { email: customer.email } : {}),
      },
      theme: { color: '#8b6cff' },
      handler: (response) => {
        paymentIdsRef.current = response;
        runVerification(response);
      },
      modal: {
        ondismiss: () => {
          setFailedStep('widget');
          setErrorMessage('Payment was cancelled before it completed.');
          setPhase('failed');
        },
      },
    });

    razorpay.open();
  };

  const runVerification = (response: RazorpayHandlerResponse) => {
    const order = orderRef.current;
    if (!order) return;

    setPhase('processing');

    Promise.allSettled([
      verify.mutateAsync({
        pendingPaymentId: order.pendingPaymentId,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      }),
      delay(MIN_PROCESSING_MS),
    ]).then(([verifyResult]) => {
      if (verifyResult.status === 'fulfilled') {
        setOrderListId(verifyResult.value.orderListId);
        setPhase('success');
        onSuccess?.(verifyResult.value.orderListId);
      } else {
        setFailedStep('verify');
        setErrorMessage(getCheckoutErrorMessage(verifyResult.reason));
        setPhase('failed');
      }
    });
  };

  const handleReviewAndPay = () => {
    setPhase('creating_order');
    createOrder.mutate(orderInput, {
      onSuccess: (result) => {
        orderRef.current = {
          pendingPaymentId: result.pendingPaymentId,
          razorpayOrderId: result.razorpayOrderId,
          amountInPaise: result.amountInPaise,
          keyId: result.keyId || paymentConfig?.keyId || '',
        };
        setBreakdown(result.breakdown);
        setPhase('awaiting_razorpay');
      },
      onError: (error) => {
        setFailedStep('create');
        setErrorMessage(getCheckoutErrorMessage(error));
        setPhase('failed');
      },
    });
  };

  const handleRetry = () => {
    if (failedStep === 'create') {
      setPhase('summary');
      return;
    }
    if (failedStep === 'widget') {
      setPhase('awaiting_razorpay');
      openRazorpayWidget();
      return;
    }
    // verify failed after a real Razorpay success — retry verification with
    // the same ids rather than charging the customer again.
    if (paymentIdsRef.current) {
      runVerification(paymentIdsRef.current);
    } else {
      setPhase('awaiting_razorpay');
    }
  };

  if (phase === 'success' && orderListId) {
    return (
      <PaymentSuccessScreen
        onTrackOrder={() => onTrackOrder(orderListId)}
        onViewOrders={onViewOrders}
      />
    );
  }

  if (phase === 'processing') {
    return <PaymentProcessingAnimation />;
  }

  if (phase === 'failed') {
    return (
      <PaymentFailedScreen
        message={errorMessage}
        retryLabel={failedStep === 'verify' ? 'Retry verification' : 'Try again'}
        onRetry={handleRetry}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <BillBreakdownCard breakdown={breakdown} estimated={phase === 'summary' || phase === 'creating_order'} />

      {phase === 'summary' || phase === 'creating_order' ? (
        <div className="flex gap-2.5">
          <Button variant="secondary" onClick={onEdit} disabled={phase === 'creating_order'}>
            Edit
          </Button>
          <Button className="flex-1" onClick={handleReviewAndPay} loading={phase === 'creating_order'}>
            Review & Pay
          </Button>
        </div>
      ) : (
        <Button className="w-full" onClick={openRazorpayWidget}>
          Pay ${breakdown.finalAmount.toFixed(2)}
        </Button>
      )}
    </div>
  );
}
