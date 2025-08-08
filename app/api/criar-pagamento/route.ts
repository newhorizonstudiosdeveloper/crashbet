import { NextResponse } from 'next/server';

// Import dinâmico para evitar problema no Node 22
let Payment: any;
let MercadoPagoConfig: any;

async function initMercadoPago() {
  if (!Payment || !MercadoPagoConfig) {
    const mp = await import('mercadopago');
    MercadoPagoConfig = mp.MercadoPagoConfig;
    Payment = mp.Payment;
  }
}

export async function POST(req: Request) {
  try {
    // Garante que credencial está presente
    if (!process.env.MP_ACCESS_TOKEN) {
      throw new Error('Access Token do Mercado Pago não configurado (.env.local)');
    }

    // Lê dados enviados do frontend
    const { valor, userId } = await req.json();
    if (!valor || !userId) {
      throw new Error('Valor e userId são obrigatórios');
    }

    // Inicializa Mercado Pago
    await initMercadoPago();
    const client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN!,
    });

    const payment = new Payment(client);

    // Cria pagamento PIX
    const pagamento = await payment.create({
      body: {
        transaction_amount: Number(valor),
        description: 'Adicionar saldo no jogo',
        payment_method_id: 'pix',
        payer: {
          email: 'comprador@email.com', // pode vir do seu sistema
        },
        external_reference: userId, // identifica o jogador no webhook
      },
    });

    // Retorna pagamento para o frontend
    return NextResponse.json(pagamento);

  } catch (error: any) {
    console.error('Erro detalhado ao criar pagamento:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno ao criar pagamento' },
      { status: 500 }
    );
  }
}
