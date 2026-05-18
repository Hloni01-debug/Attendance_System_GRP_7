import React, { useState } from 'react';
import { useAuthStore } from '../stores/authStore';

const FuelTransactionsPage = () => {
    const { token } = useAuthStore();
    const [formData, setFormData] = useState({
        Shift_ID: '',
        Fuel_Litres: '',
        Fuel_Cost: ''
    });
    const [message, setMessage] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/fuel-transactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    Shift_ID: parseInt(formData.Shift_ID),
                    Fuel_Litres: parseFloat(formData.Fuel_Litres),
                    Fuel_Cost: parseFloat(formData.Fuel_Cost)
                })
            });

            const data = await response.json();

            if (data.success) {
                setMessage('Transaction recorded successfully');
                setFormData({ Shift_ID: '', Fuel_Litres: '', Fuel_Cost: '' });
            } else {
                setMessage(`Backend Error: ${data.error || 'Failed to save transaction'}`);
            }
        } catch (error) {
            setMessage(`Frontend Error: ${error.message}`);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
            <h2>Log Fuel Transaction</h2>
            {message && <p style={{ color: message.includes('successfully') ? 'green' : 'red' }}>{message}</p>}
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <label>Shift ID:</label>
                    <input
                        type="number"
                        name="Shift_ID"
                        value={formData.Shift_ID}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label>Fuel (Litres):</label>
                    <input
                        type="number"
                        step="0.01"
                        name="Fuel_Litres"
                        value={formData.Fuel_Litres}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label>Cost:</label>
                    <input
                        type="number"
                        step="0.01"
                        name="Fuel_Cost"
                        value={formData.Fuel_Cost}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                    />
                </div>
                <button type="submit" style={{ padding: '10px 15px', cursor: 'pointer' }}>
                    Submit Transaction
                </button>
            </form>
        </div>
    );
};

export default FuelTransactionsPage;