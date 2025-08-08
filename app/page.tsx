'use client';
import { useState, useEffect } from 'react';
import StatusScreenBrick from './types/components/StatusScreenBrick';

export default function AdicionarSaldoPage() {
  const [valor, setValor] = useState('');
  const [valorPago, setValorPago] = useState(0); // novo estado para valor pago
  const [qrCodeBase64, setQrCodeBase64] = useState('');
  const [status, setStatus] = useState('');
  const [saldo, setSaldo] = useState(0);
  const [paymentId, setPaymentId] = useState(null);
  const [paymentPayload, setPaymentPayload] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  async function criarPagamento() {
    const valorNumber = Number(valor);
    if (!valorNumber || valorNumber <= 0) {
      setStatus('Informe um valor válido');
      return;
    }

    setStatus('Gerando pagamento...');
    setQrCodeBase64('');
    setPaymentId(null);
    setPaymentPayload(null);

    try {
      const res = await fetch('/api/criar-pagamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valor: valorNumber,
          userId: 'usuario123',
        }),
      });

      if (!res.ok) throw new Error('Erro ao criar pagamento');

      const dados = await res.json();

      const qrCode = dados.point_of_interaction?.transaction_data?.qr_code_base64 || '';
      const idPagamento = dados.id;

      setQrCodeBase64(qrCode);
      setPaymentId(idPagamento);
      setPaymentPayload(dados);
      setValorPago(valorNumber); // guarda o valor pago usado para atualizar o saldo depois
      setStatus('Pagamento gerado! Escaneie o QR Code para pagar.');

      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error(error);
      setStatus('Erro ao gerar pagamento.');
    }
  }

  useEffect(() => {
    if (!paymentId) return;

    const interval = setInterval(() => {
      setRefreshKey((prev) => prev + 1);
    }, 15000);

    return () => clearInterval(interval);
  }, [paymentId]);

  function handlePaymentApproved() {
    setStatus('Pagamento aprovado! Atualizando saldo...');
    setSaldo((prev) => prev + valorPago);

    // Limpa estados para novo pagamento
    setValor('');
    setQrCodeBase64('');
    setPaymentId(null);
    setPaymentPayload(null);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-2xl font-bold mb-4">Adicionar Saldo</h1>

      <p className="mb-4 text-lg">Saldo atual: R$ {saldo.toFixed(2)}</p>

      <input
        type="number"
        placeholder="Digite o valor (R$)"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        className="p-2 rounded text-black mb-4 w-64"
        min="0"
        step="0.01"
      />

      <button
        onClick={criarPagamento}
        className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded font-bold"
      >
        Gerar QR Code Pix
      </button>

      {status && <p className="mt-4">{status}</p>}

      {qrCodeBase64 && (
        <img
          src={`data:image/png;base64,${qrCodeBase64}`}
          alt="QR Code Pix"
          className="mt-4 w-64 h-64"
        />
      )}

      {paymentId && (
        <StatusScreenBrick
          key={refreshKey}
          paymentId={paymentId}
          paymentPayload={paymentPayload}
          onPaymentApproved={handlePaymentApproved}
        />
      )}
    </div>
  );
}
