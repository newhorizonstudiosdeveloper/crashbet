'use client';

import { useEffect } from 'react';

let mercadoPagoScriptLoadingPromise = null;
function loadMercadoPagoSdk() {
  if (mercadoPagoScriptLoadingPromise) return mercadoPagoScriptLoadingPromise;

  mercadoPagoScriptLoadingPromise = new Promise((resolve, reject) => {
    if (window.MercadoPago) return resolve();

    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Falha ao carregar SDK MercadoPago'));
    document.body.appendChild(script);
  });

  return mercadoPagoScriptLoadingPromise;
}

export default function StatusScreenBrick({ paymentId, paymentPayload, onPaymentApproved }) {
  useEffect(() => {
    if (!paymentId) return;

    let isMounted = true;
    let paymentApprovedCalled = false;

    async function loadBrick() {
      try {
        await loadMercadoPagoSdk();
        if (!isMounted) return;

        const container = document.getElementById('statusScreenBrick_container');
        if (!container) return;
        container.innerHTML = '';

        const mp = new window.MercadoPago('APP_USR-d2e34c8b-5564-4ddb-a18f-8d86226fb541', { locale: 'pt-BR' });
        const bricksBuilder = mp.bricks();

        const settings = {
          initialization: {
            paymentId,
            payload: paymentPayload,
          },
          callbacks: {
            onReady: () => console.log('Status Screen Brick pronto'),
            onError: (error) => console.error('Erro no Status Screen Brick:', error),
            onPaymentApproved: () => {
              if (!paymentApprovedCalled) {
                paymentApprovedCalled = true;
                console.log('Pagamento aprovado!');
                onPaymentApproved();
              }
            },
          },
        };

        await bricksBuilder.create('statusScreen', 'statusScreenBrick_container', settings);
      } catch (error) {
        console.error('Erro ao carregar Status Screen Brick:', error);
      }
    }

    loadBrick();

    return () => {
      isMounted = false;
      const container = document.getElementById('statusScreenBrick_container');
      if (container) container.innerHTML = '';
    };
  }, [paymentId, paymentPayload, onPaymentApproved]);

  return (
    <div
      id="statusScreenBrick_container"
      style={{ width: 360, height: 500, marginTop: 20 }}
    />
  );
}
