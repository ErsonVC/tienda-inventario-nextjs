import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function enviarAlertaStockBajo(productoNombre: string, stockActual: number, stockMinimo: number) {
  const mailOptions = {
    from: `"Sistema Inventario" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_TO,
    subject: `⚠️ Alerta de Stock Bajo: ${productoNombre}`,
    text: `El producto "${productoNombre}" ha alcanzado un nivel crítico de stock.\n\nStock Actual: ${stockActual}\nStock Mínimo: ${stockMinimo}\n\nPor favor, realice un pedido a su proveedor.`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #e11d48;">⚠️ Alerta de Stock Bajo</h2>
        <p>El producto <strong>${productoNombre}</strong> ha alcanzado un nivel crítico de stock.</p>
        <hr />
        <p><strong>Stock Actual:</strong> <span style="color: #e11d48; font-weight: bold;">${stockActual}</span></p>
        <p><strong>Stock Mínimo:</strong> ${stockMinimo}</p>
        <hr />
        <p style="font-size: 12px; color: #666;">Este es un mensaje automático del Sistema de Inventario.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email enviado: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Error enviando email:", error);
    return false;
  }
}
