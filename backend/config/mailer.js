const nodemailer = require('nodemailer');

/**
 * Sends a verification email with a security code.
 * If SMTP credentials are configured in environment variables, sends real email.
 * Otherwise, logs to console for local development and testing.
 * 
 * @param {string} to - Recipient email address
 * @param {string} code - 6-digit verification code
 * @returns {Promise<boolean>}
 */
async function sendResetCodeEmail(to, code) {
    try {
        console.log('====================================================');
        console.log(`[EMAIL SERVICE] Sending reset code to: ${to}`);
        console.log(`[EMAIL SERVICE] Security code: ${code}`);
        console.log('====================================================');

        const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
        const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_PASS;

        if (smtpUser && smtpPass) {
            const transporter = nodemailer.createTransport({
                service: process.env.SMTP_SERVICE || 'gmail',
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: Number(process.env.SMTP_PORT) || 587,
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: smtpUser,
                    pass: smtpPass
                }
            });

            await transporter.sendMail({
                from: process.env.SMTP_FROM || `"Skavtsko skladišče" <${smtpUser}>`,
                to,
                subject: 'Varnostna koda za ponastavitev gesla - Skavtsko skladišče',
                text: `Vaša enkratna varnostna koda za ponastavitev gesla skladišča je: ${code}\n\nKoda je veljavna 15 minut.`,
                html: `
                    <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
                        <h2 style="color: #065f46;">Skavtsko skladišče - Ponastavitev gesla</h2>
                        <p>Prejeli smo vašo zahtevo za ponastavitev gesla za urejanje imetnikov ključa.</p>
                        <p>Vaša enkratna varnostna koda za preverjanje je:</p>
                        <div style="background: #f1f5f9; padding: 15px; border-radius: 10px; font-size: 28px; font-weight: bold; letter-spacing: 5px; text-align: center; color: #0f172a; margin: 20px 0;">
                            ${code}
                        </div>
                        <p style="font-size: 13px; color: #64748b;">Koda je veljavna 15 minut. Če zahteve niste sprožili vi, lahko to sporočilo prezrete.</p>
                    </div>
                `
            });
        }

        return true;
    } catch (err) {
        console.error('Napaka pri pošiljanju e-pošte:', err.message);
        // Do not crash if SMTP server is unavailable; logged to console
        return false;
    }
}

module.exports = {
    sendResetCodeEmail
};
