import { NextResponse } from 'next/server';

type MercadoPagoConfigConstructor = new (options: { accessToken: string }) => object;
type PaymentConstructor = new (client: object) => {
  create: (params: { body: object }) => Promise<object>;
};

let Payment: PaymentConstructor | undefined;
let MercadoPagoConfig: MercadoPagoConfigConstructor | undefined;

async function initMercadoPago() {
  if (!Payment || !MercadoPagoConfig) {
    const mp = await import('mercadopago');
    MercadoPagoConfig = mp.MercadoPagoConfig as MercadoPagoConfigConstructor;
    Payment = mp.Payment as PaymentConstructor;
  }
}

export async function POST(req: Request) {
  try {
    if (!process.env.MP_ACCESS_TOKEN) {
      throw new Error('Access Token do Mercado Pago não configurado (.env.local)');
    }

    const { valor, userId } = await req.json();

    if (!valor || !userId) {
      throw new Error('Valor e userId são obrigatórios');
    }

    await initMercadoPago();

    const client = new MercadoPagoConfig!({
      accessToken: process.env.MP_ACCESS_TOKEN!,
    });

    const payment = new Payment!(client);

    const pagamento = await payment.create({
      body: {
        transaction_amount: Number(valor),
        description: 'Adicionar saldo no jogo',
        payment_method_id: 'pix',
        payer: {
          email: 'comprador@email.com',
        },
        external_reference: userId,
      },
    });

    return NextResponse.json(pagamento);
  } catch (error: unknown) {
    let message = 'Erro interno ao criar pagamento';
    if (error instanceof Error) {
      message = error.message;
    }
    console.error('Erro detalhado ao criar pagamento:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
