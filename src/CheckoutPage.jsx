import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

function CheckoutPage() {
    const { id } = useParams(); // checkoutId
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('pending');
    const [invoice, setInvoice] = useState(null);
    const [error, setError] = useState('');

    // We passed invoice in state or we need to fetch it?
    // Ideally server returned it. But we are navigating here.
    // Let's pass it via location state or fetch it again if possible.
    // But getCheckout might not return the full invoice secret if not authorized?
    // Actually, for this flow, let's pass the invoice string via query param or state for simplicity,
    // OR just fetch the checkout details from the backend if we expose an endpoint for it.
    // We have /api/payment-status/:id which returns the checkout object.
    // Let's use that to get the invoice if we don't have it.

    useEffect(() => {
        const fetchCheckout = async () => {
            try {
                const res = await fetch(`/api/payment-status/${id}`);
                const data = await res.json();

                if (data.checkout && data.checkout.invoice) {
                    setInvoice(data.checkout.invoice.invoice); // The BOLT11 string
                }

                if (data.paid) {
                    handleSuccess();
                }
            } catch (err) {
                console.error(err);
                setError('Failed to load checkout details.');
            }
        };

        fetchCheckout();

        // Poll for status
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/payment-status/${id}`);
                const data = await res.json();
                if (data.paid) {
                    clearInterval(interval);
                    handleSuccess();
                }
            } catch (e) {
                console.error(e);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [id]);

    const handleSuccess = () => {
        setStatus('paid');
        const word = searchParams.get('word');
        const feeling = searchParams.get('feeling');
        // Redirect to success page to generate image
        navigate(`/success?word=${encodeURIComponent(word)}&feeling=${encodeURIComponent(feeling)}&checkoutId=${id}`);
    };

    return (
        <div className="container">
            <div className="content">
                <h1>Pay with Lightning</h1>
                <p>Scan to generate your art</p>

                {error && <div className="error">{error}</div>}

                {invoice ? (
                    <div className="qr-container" style={{ background: 'white', padding: '20px', borderRadius: '10px', margin: '20px auto', width: 'fit-content' }}>
                        <QRCodeSVG value={invoice} size={256} />
                    </div>
                ) : (
                    <div className="loading-spinner"></div>
                )}

                <div className="invoice-text" style={{ wordBreak: 'break-all', fontSize: '0.8rem', color: '#666', marginTop: '10px' }}>
                    {invoice}
                </div>

                <p>Waiting for payment...</p>
            </div>
        </div>
    );
}

export default CheckoutPage;
