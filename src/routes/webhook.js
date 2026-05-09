const express = require('express');
const router = express.Router();
const db = require('../db/mysql');

router.post('/mercadopago', async (req, res) => {

    try {

        const { data } = req.body;
        console.log('Recebido webhook do Mercado Pago:', data);

        if (!data?.id) {
            return res.sendStatus(200);
        }

        const paymentId = data.id;

        // busca pagamento no MP
        const mpResponse = await fetch(
            `https://api.mercadopago.com/v1/payments/${paymentId}`,
            {
                headers: {
                    Authorization:
                        `Bearer ${process.env.MP_ACCESS_TOKEN}`
                }
            }
        );

        const payment = await mpResponse.json();

        if (payment.status !== 'approved') {
            console.log(`Pagamento ${paymentId} não aprovado. Status: ${payment.status}`);
            return res.sendStatus(200);
        }
        console.log(`Pagamento ${paymentId} aprovado. Atualizando status...`);

        // atualiza payment no banco
        await db.query(
            `UPDATE payments 
             SET status = 'paid', paid_at = NOW()
             WHERE transaction_id = ?`,
            [paymentId]
        );

        // pega order
        const [rows] = await db.query(
            `SELECT order_id FROM payments WHERE transaction_id = ?`,
            [paymentId]
        );

        if (rows.length) {

            const orderId = rows[0].order_id;

            await db.query(
                `UPDATE orders 
                 SET payment_status = 'paid',
                     order_status = 'confirmed'
                 WHERE id = ?`,
                [orderId]
            );
        }

        return res.sendStatus(200);

    } catch (error) {
        console.log(error);
        return res.sendStatus(200);
    }
});

module.exports = router;