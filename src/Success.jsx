import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

function Success() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying'); // verifying, paid, generating, complete, error
    const [image, setImage] = useState(null);
    const [error, setError] = useState('');

    const word = searchParams.get('word');
    const feeling = searchParams.get('feeling');
    const checkoutId = searchParams.get('checkoutId');

    useEffect(() => {
        if (!word || !feeling || !checkoutId) {
            setStatus('error');
            setError('Missing payment information.');
            return;
        }

        const verifyPayment = async () => {
            try {
                // Poll for payment status
                // In a real app, we might wait for webhook, but polling is fine for this UX
                let paid = false;
                let attempts = 0;
                const maxAttempts = 10; // 20 seconds total

                while (!paid && attempts < maxAttempts) {
                    const res = await fetch(`/api/payment-status/${checkoutId}`);
                    const data = await res.json();

                    if (data.paid) {
                        paid = true;
                        setStatus('paid');
                    } else {
                        attempts++;
                        await new Promise(r => setTimeout(r, 2000));
                    }
                }

                if (!paid) {
                    throw new Error('Payment verification timed out. Please check your wallet.');
                }

                // Generate Image
                setStatus('generating');
                const genRes = await fetch('/api/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ word, feeling })
                });

                if (!genRes.ok) {
                    throw new Error('Failed to generate image after payment.');
                }

                const genData = await genRes.json();
                if (genData.image) {
                    setImage(genData.image);
                    setStatus('complete');
                } else {
                    throw new Error('No image returned.');
                }

            } catch (err) {
                console.error(err);
                setStatus('error');
                setError(err.message);
            }
        };

        verifyPayment();
    }, [word, feeling, checkoutId]);

    return (
        <div className="container">
            <div className="content">
                <h1>
                    {status === 'verifying' && 'Verifying Payment...'}
                    {status === 'paid' && 'Payment Confirmed!'}
                    {status === 'generating' && 'Generating Art...'}
                    {status === 'complete' && 'Here is your masterpiece!'}
                    {status === 'error' && 'Something went wrong'}
                </h1>

                {error && <div className="error">{error}</div>}

                {status === 'complete' && image && (
                    <div className="result-container">
                        <img src={image} alt={`${word} (${feeling})`} className="generated-image" />
                        <button onClick={() => navigate('/')} className="make-button" style={{ marginTop: '2rem' }}>
                            MAKE ANOTHER
                        </button>
                    </div>
                )}

                {(status === 'verifying' || status === 'generating') && (
                    <div className="loading-spinner"></div>
                )}
            </div>
        </div>
    );
}

export default Success;
