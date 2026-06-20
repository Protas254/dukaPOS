import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { phone, amount, account_reference } = await req.json();

        if (!phone || !amount) {
            return Response.json({ error: 'Phone number and amount required' }, { status: 400 });
        }

        // Get credentials from environment
        const consumerKey = Deno.env.get("MPESA_CONSUMER_KEY");
        const consumerSecret = Deno.env.get("MPESA_CONSUMER_SECRET");
        const passkey = Deno.env.get("MPESA_PASSKEY");
        const shortcode = Deno.env.get("MPESA_SHORTCODE");
        const environment = Deno.env.get("MPESA_ENVIRONMENT") || 'sandbox';

        if (!consumerKey || !consumerSecret || !passkey || !shortcode) {
            return Response.json({ error: 'M-Pesa credentials not configured' }, { status: 500 });
        }

        const baseUrl = environment === 'production' 
            ? 'https://api.safaricom.co.ke' 
            : 'https://sandbox.safaricom.co.ke';

        // Step 1: Get OAuth token
        const auth = btoa(`${consumerKey}:${consumerSecret}`);
        const tokenResponse = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
            headers: { Authorization: `Basic ${auth}` }
        });

        if (!tokenResponse.ok) {
            throw new Error('Failed to get M-Pesa access token');
        }

        const { access_token } = await tokenResponse.json();

        // Step 2: Format phone number (ensure it starts with 254)
        let formattedPhone = phone.trim();
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '254' + formattedPhone.slice(1);
        } else if (formattedPhone.startsWith('+')) {
            formattedPhone = formattedPhone.slice(1);
        }

        // Step 3: Generate timestamp
        const now = new Date();
        const timestamp = now.getFullYear()
            + String(now.getMonth() + 1).padStart(2, '0')
            + String(now.getDate()).padStart(2, '0')
            + String(now.getHours()).padStart(2, '0')
            + String(now.getMinutes()).padStart(2, '0')
            + String(now.getSeconds()).padStart(2, '0');

        // Step 4: Generate password (base64 encode shortcode + passkey + timestamp)
        const password = btoa(`${shortcode}${passkey}${timestamp}`);

        // Step 5: Initiate STK Push
        const stkResponse = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                BusinessShortCode: shortcode,
                Password: password,
                Timestamp: timestamp,
                TransactionType: 'CustomerPayBillOnline',
                Amount: Math.round(amount),
                PartyA: formattedPhone,
                PartyB: shortcode,
                PhoneNumber: formattedPhone,
                CallBackURL: 'https://your-callback-url.com/mpesa/callback', // You'll need to set this up
                AccountReference: account_reference || 'DukaPOS',
                TransactionDesc: 'Payment for goods'
            })
        });

        const result = await stkResponse.json();

        if (!stkResponse.ok) {
            throw new Error(result.errorMessage || 'STK Push failed');
        }

        return Response.json({
            success: true,
            checkout_request_id: result.CheckoutRequestID,
            merchant_request_id: result.MerchantRequestID,
            response_description: result.ResponseDescription
        });

    } catch (error) {
        console.error('M-Pesa STK Push error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});