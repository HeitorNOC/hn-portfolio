const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const SERVICE_LABELS = {
  site:        'Criação de Sites',
  consultoria: 'Consultoria de TI',
  sistema:     'Sistemas Web',
  design:      'UI/UX Design',
  manutencao:  'Manutenção & Suporte'
};

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, service, message } = req.body || {};

  if (!name || !email || !service || !message) {
    return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'E-mail inválido.' });
  }

  const serviceLabel = SERVICE_LABELS[service] || escHtml(service);

  try {
    await resend.emails.send({
      from:    'HN Services <contato@hnservices.com.br>',
      to:      ['contato@hnservices.com.br'],
      replyTo: email,
      subject: `Novo contato: ${serviceLabel} — ${name}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#111111;color:#F5F0E8;border-radius:8px;">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:28px;">
            <svg width="28" height="28" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 6 L8 50 M28 6 L28 50 M8 26 L28 26 M48 6 L48 50 M28 6 L48 50"
                    stroke="#C9F31D" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span style="font-weight:700;font-size:18px;">HN Services</span>
          </div>
          <h2 style="color:#C9F31D;font-size:22px;margin:0 0 24px;">Novo contato via site</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:10px 0;color:#4A4A4A;width:100px;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;">Nome</td>
              <td style="padding:10px 0;">${escHtml(name)}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#4A4A4A;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;">E-mail</td>
              <td style="padding:10px 0;"><a href="mailto:${escHtml(email)}" style="color:#C9F31D;">${escHtml(email)}</a></td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#4A4A4A;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;">Serviço</td>
              <td style="padding:10px 0;">${serviceLabel}</td>
            </tr>
          </table>
          <div style="margin-top:24px;padding:18px;background:#1A1A1A;border-radius:6px;border-left:3px solid #C9F31D;">
            <p style="margin:0 0 8px;color:#4A4A4A;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;">Mensagem</p>
            <p style="margin:0;white-space:pre-wrap;line-height:1.6;">${escHtml(message)}</p>
          </div>
          <p style="margin:28px 0 0;font-size:12px;color:#4A4A4A;">Responda diretamente a este e-mail para entrar em contato com ${escHtml(name)}.</p>
        </div>
      `,
      text: `Novo contato via site\n\nNome: ${name}\nE-mail: ${email}\nServiço: ${serviceLabel}\n\nMensagem:\n${message}`
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Resend error:', err);
    return res.status(500).json({ error: 'Falha ao enviar mensagem. Tente novamente.' });
  }
};
