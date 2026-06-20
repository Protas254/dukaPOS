import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const callbackData = await req.json();

        console.log('M-Pesa Callback received:', callbackData);

        // Extract callback data
        const stkCallback = callbackData.Body?.stkCallback;
        if (!stkCallback) {
            return Response.json({ ResultCode: 0, ResultDesc: 'Accepted' });
        }

        const merchantRequestId = stkCallback.MerchantRequestID;
        const checkoutRequestId = stkCallback.CheckoutRequestID;
        const resultCode = stkCallback.ResultCode;
        const resultDesc = stkCallback.ResultDesc;

        // ResultCode 0 means success
        const isSuccess = resultCode === 0;

        // Get callback metadata
        const callbackMetadata = stkCallback.CallbackMetadata?.Item || [];
        const getMetadataValue = (name) => {
            const item = callbackMetadata.find(i => i.Name === name);
            return item ? item.Value : null;
        };

        const mpesaReceiptNumber = getMetadataValue('MpesaReceiptNumber');
        const amount = getMetadataValue('Amount');
        const phoneNumber = getMetadataValue('PhoneNumber');
        const transactionDate = getMetadataValue('TransactionDate');

        // Store the payment result in a entity for tracking
        await base44.entities.MpesaPayment.create({
            merchant_request_id: merchantRequestId,
            checkout_request_id: checkoutRequestId,
            result_code: resultCode,
            result_description: resultDesc,
            mpesa_receipt_number: mpesaReceiptNumber,
            amount: amount,
            phone_number: phoneNumber,
            transaction_date: transactionDate,
            status: isSuccess ? 'completed' : 'failed',
            is_success: isSuccess
        }).catch(err => {
            console.error('Failed to store M-Pesa payment result:', err);
        });

        return Response.json({ 
            ResultCode: 0, 
            ResultDesc: 'Accepted' 
        });

    } catch (error) {
        console.error('M-Pesa callback error:', error);
        return Response.json({ 
            ResultCode: 0, 
            ResultDesc: 'Accepted' 
        });
    }
});